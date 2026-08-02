import { Hono } from 'hono';
import type { Env } from './config';
import type { Services } from './services';
import { getServices } from './services';
import type { User, ApiKey, ProblemDetail } from '@iprn/types';

export type AppVariables = {
  env: Env;
  services: Services;
  user: User | null;
  apiKey: ApiKey | null;
  principal: { user: User; apiKey: ApiKey | null; isImpersonated: boolean } | null;
  requestId: string;
};

export type AppHono = Hono<{ Bindings: Env; Variables: AppVariables }>;

export function createApp(): AppHono {
  return new Hono<{ Bindings: Env; Variables: AppVariables }>();
}

export const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

export function problemDetail(c: any, status: number, title: string, detail?: string, errors?: Record<string, string[]>): Response {
  const body: ProblemDetail = { type: `https://iprn.online/problems/${title.toLowerCase().replace(/\s/g, '-')}`, title, status, detail };
  if (errors) (body as any).errors = errors;
  return c.json(body, status);
}

export async function servicesMiddleware(c: any, next: any) {
  const env = c.env as Env;
  const services = getServices(env);
  c.set('env', env);
  c.set('services', services);
  c.set('requestId', crypto.randomUUID());
  await services.initialized;
  await next();
}

export async function securityHeadersMiddleware(c: any, next: any) {
  await next();
  for (const [k, v] of Object.entries(JSON_HEADERS)) {
    c.header(k, v as string);
  }
  c.header('X-Request-ID', c.get('requestId'));
}

export async function maintenanceMiddleware(c: any, next: any) {
  const services: Services = c.get('services');
  const isMaintenance = await services.getSetting<number>('maintenance_mode');
  if (isMaintenance === 1) {
    const msg = await services.getSetting<string>('maintenance_message');
    const body: ProblemDetail = { type: 'https://iprn.online/problems/maintenance-mode', title: 'Service Unavailable', status: 503, detail: msg as string };
    return c.json(body, 503);
  }
  await next();
}

export async function authMiddleware(c: any, next: any) {
  const services: Services = c.get('services');
  const env: Env = c.get('env');
  try {
    const principal = await services.auth.resolvePrincipal(c.req.raw);
    c.set('principal', principal);
    c.set('user', principal.user);
    c.set('apiKey', principal.apiKey);
    await next();
  } catch (e) {
    const body: ProblemDetail = { type: 'https://iprn.online/problems/auth-failed', title: 'Unauthorized', status: 401, detail: (e as Error).message };
    return c.json(body, 401);
  }
}

export async function requireAdmin(c: any, next: any) {
  const user = c.get('user') as User | null;
  if (!user || user.role !== 'admin') {
    const body: ProblemDetail = { type: 'https://iprn.online/problems/forbidden', title: 'Forbidden', status: 403, detail: 'Admin access required' };
    return c.json(body, 403);
  }
  await next();
}

export async function rateLimitMiddleware(c: any, next: any) {
  const services: Services = c.get('services');
  const env: Env = c.get('env');
  const principal = c.get('principal') as { user: User; apiKey: ApiKey | null; isImpersonated: boolean } | null;

  let identifier = 'anonymous';
  let limit: number;
  if (principal?.apiKey) {
    identifier = `key:${principal.apiKey.id}`;
    limit = principal.apiKey.rateLimitOverride ?? (await services.getSetting<number>('rate_limit_default'));
  } else if (principal?.user) {
    identifier = `user:${principal.user.id}`;
    limit = await services.getSetting<number>('rate_limit_default');
  } else {
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    identifier = `ip:${ip}`;
    limit = await services.getSetting<number>('rate_limit_sms_ingest');
  }

  const windowSeconds = 3600;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / windowSeconds) * windowSeconds;
  const key = `rl:${identifier}:${windowStart}`;

  const current = await env.RATE_LIMIT_KV.get(key);
  const count = current ? parseInt(current, 10) : 0;
  if (count >= limit) {
    const retryAfter = Math.ceil((windowStart + windowSeconds - now));
    c.header('Retry-After', String(retryAfter));
    const body: ProblemDetail = { type: 'https://iprn.online/problems/rate-limited', title: 'Too Many Requests', status: 429, detail: `Rate limit exceeded. ${limit} requests per hour.` };
    return c.json(body, 429);
  }

  const newCount = count + 1;
  await env.RATE_LIMIT_KV.put(key, String(newCount), { expirationTtl: windowSeconds });
  c.header('X-RateLimit-Limit', String(limit));
  c.header('X-RateLimit-Remaining', String(Math.max(0, limit - newCount)));
  c.header('X-RateLimit-Reset', String(windowStart + windowSeconds));
  await next();
}
