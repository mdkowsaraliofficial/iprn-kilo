import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { compress } from 'hono/compress';
import { logger } from 'hono/logger';
import { createApp, servicesMiddleware, securityHeadersMiddleware, maintenanceMiddleware, authMiddleware, rateLimitMiddleware, requireAdmin } from './middleware';
import { getServices } from './services';
import { registerPublic } from './routes/public';
import { registerAuthRoutes } from './routes/auth';
import { registerNumbersRoutes } from './routes/numbers';
import { registerSmsRoutes } from './routes/sms';
import { registerWalletRoutes, registerRewardsRoutes } from './routes/wallet';
import { registerWebhookRoutes } from './routes/webhooks';
import { registerApiKeysRoutes } from './routes/api-keys';
import { registerNotificationsRoutes } from './routes/notifications';
import { registerAnalyticsRoutes, registerSettingsRoutes, registerIngestRoutes } from './routes/analytics';
import { registerAdminRoutes } from './routes/admin';
import type { Env } from './config';
import type { ProblemDetail } from '@iprn/types';
import type { IngestSmsRequest } from '@iprn/types';

type App = ReturnType<typeof createApp>;

let _cached: { app: App; env: Env } | null = null;
let _apiApp: App | null = null;
let _adminApp: App | null = null;
let _apiServicesRef: unknown = null;
let _adminServicesRef: unknown = null;

function buildApi(services: unknown): App {
  if (_apiApp && _apiServicesRef === services) return _apiApp;
  _apiServicesRef = services;
  const api = createApp();
  api.use('*', servicesMiddleware, authMiddleware, rateLimitMiddleware, maintenanceMiddleware);

  const s = services as any;
  registerAuthRoutes(api, s);
  registerNumbersRoutes(api, s);
  registerSmsRoutes(api, s);
  registerWalletRoutes(api, s);
  registerRewardsRoutes(api, s);
  registerWebhookRoutes(api, s);
  registerApiKeysRoutes(api, s);
  registerNotificationsRoutes(api, s);
  registerAnalyticsRoutes(api, s);
  registerSettingsRoutes(api, s);
  registerIngestRoutes(api, s);

  api.get('/sse/events', async (c) => {
    const principal = c.get('principal');
    if (!principal) {
      return c.json({ type: 'https://iprn.online/problems/unauthorized', title: 'Unauthorized', status: 401, detail: 'Not authenticated' }, 401);
    }
    const userId = principal.user.id;
    const { stream } = s.sse.subscribe(userId);
    c.header('Content-Type', 'text/event-stream');
    c.header('Cache-Control', 'no-cache, no-transform');
    c.header('Connection', 'keep-alive');
    c.header('X-Accel-Buffering', 'no');
    return c.newResponse(stream);
  });

  api.onError((err: any, c) => {
    console.error('[api-error]', err);
    const status = err.status || (err.code === 'CONFLICT' ? 409 : 500);
    const body: ProblemDetail = {
      type: 'https://iprn.online/problems/internal-error',
      title: err.title || err.message || 'Internal Server Error',
      status,
      detail: err.message || 'An internal error occurred.',
    };
    return c.json(body, status);
  });

  _apiApp = api;
  return api;
}

function buildAdmin(services: unknown): App {
  if (_adminApp && _adminServicesRef === services) return _adminApp;
  _adminServicesRef = services;
  const admin = createApp();
  admin.use('*', servicesMiddleware, authMiddleware, requireAdmin, rateLimitMiddleware, maintenanceMiddleware);
  registerAdminRoutes(admin, services as any);
  admin.onError((err: any, c) => {
    console.error('[admin-error]', err);
    const status = err.status || (err.code === 'CONFLICT' ? 409 : 500);
    return c.json({ type: 'https://iprn.online/problems/internal-error', title: err.message || 'Internal Server Error', status, detail: err.message || 'An error occurred.' }, status);
  });
  _adminApp = admin;
  return admin;
}

function buildApp(services: unknown): App {
  if (_cached && _cached.env === (services as any).env) return _cached.app;
  const app = createApp();

  app.use('*', logger());
  app.use('*', cors({
    origin: ['*'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-admin-token', 'x-hmac-signature', 'x-hook-signature'],
    maxAge: 3600,
    credentials: true,
  }));
  app.use('*', compress());
  app.use('*', servicesMiddleware);
  app.use('*', securityHeadersMiddleware);

  const publicApp = createApp();
  publicApp.use('*', servicesMiddleware);
  registerPublic(publicApp, services as any);
  app.route('/api/v1/public', publicApp);

  app.route('/api/v1', buildApi(services));
  app.route('/api/v1/admin', buildAdmin(services));

  app.notFound((c) => c.json({ type: 'https://iprn.online/problems/not-found', title: 'Not Found', status: 404, detail: 'The requested resource was not found.' }, 404));
  app.onError((err: any, c) => {
    console.error('[worker-error]', err);
    const status = err.status || (err.code === 'CONFLICT' ? 409 : 500);
    const body: ProblemDetail = {
      type: 'https://iprn.online/problems/internal-error',
      title: err.title || err.message || 'Internal Server Error',
      status,
      detail: err.message || 'An internal error occurred.',
    };
    return c.json(body, status);
  });

  _cached = { app, env: (services as any).env };
  return app;
}

async function deliverWebhook(services: any, evt: any): Promise<void> {
  const { deliveryId, url, payload, secretHash } = evt;
  const now = new Date().toISOString();
  const body = JSON.stringify({ ...payload, timestamp: now });
  const signature = await hmacSha256Hex(secretHash, body);
  let responseStatus: number | null = null;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'IPRN-Online/1.0', 'X-IPRN-Signature': `sha256=${signature}` },
      body,
      cf: { timeout: 15000 },
    } as any);
    responseStatus = res.status;
    if (!res.ok) {
      const respText = await res.text().catch(() => '');
      await services.db.run('UPDATE webhook_deliveries SET status = ?, attempts = attempts + 1, last_attempt_at = ?, response_status = ?, response_body = ? WHERE id = ?',
        ['failed', now, responseStatus, respText.slice(0, 2000), deliveryId]);
    } else {
      await services.db.run('UPDATE webhook_deliveries SET status = ?, attempts = attempts + 1, last_attempt_at = ?, response_status = ? WHERE id = ?',
        ['delivered', now, responseStatus, deliveryId]);
    }
  } catch (e) {
    await services.db.run('UPDATE webhook_deliveries SET status = ?, attempts = attempts + 1, last_attempt_at = ?, response_status = ? WHERE id = ?',
      ['failed', now, null, deliveryId]);
    console.error('[webhook-delivery-failed]', { deliveryId, url, error: (e as Error).message });
    throw e;
  }
}

async function hmacSha256Hex(key: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const keyBytes = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', keyBytes, enc.encode(data));
  const HEX = '0123456789abcdef';
  const b2h = (b: number) => (HEX[b >> 4] ?? '0') + (HEX[b & 0x0f] ?? '0');
  return Array.from(new Uint8Array(sig), b2h).join('');
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const services = getServices(env);
    void ctx;
    await services.initialized.catch(() => {});

    const url = new URL(request.url);
    const path = url.pathname;

    // Serve dashboard / admin static assets
    if (path.startsWith('/dashboard') || path === '/' || path === '') {
      if (env.ASSETS) {
        if (path === '/' || path === '') return Response.redirect(url.origin + '/dashboard/', 302);
        if (path === '/dashboard' || path === '/dashboard/') {
          const r = await env.ASSETS.fetch(new Request(url.origin + '/dashboard/index.html', request));
          if (r.status === 200) return r;
        }
        if (path === '/dashboard' || path === '/dashboard/') return await env.ASSETS.fetch(new Request(url.origin + '/dashboard/index.html', request));
        const assetResp = await env.ASSETS.fetch(request);
        if (assetResp.status !== 404) return assetResp;
        const fallback = await env.ASSETS.fetch(new Request(url.origin + '/dashboard/index.html', request));
        if (fallback.status === 200) return fallback;
      }
      return new Response('Dashboard not found. Build the dashboard app first.', { status: 404 });
    }

    if (path.startsWith('/admin')) {
      if (env.ASSETS) {
        if (path === '/admin' || path === '/admin/') {
          return await env.ASSETS.fetch(new Request(url.origin + '/admin/index.html', request));
        }
        const assetResp = await env.ASSETS.fetch(request);
        if (assetResp.status !== 404) return assetResp;
        const fallback = await env.ASSETS.fetch(new Request(url.origin + '/admin/index.html', request));
        if (fallback.status === 200) return fallback;
      }
      return new Response('Admin panel not found. Build the admin app first.', { status: 404 });
    }

    const app = buildApp(services);
    const resp = await app.fetch(request, env, ctx);
    return resp;
  },

  async WEBHOOK_DELIVERY_QUEUE(batch: { messages: Array<{ body: unknown }> }, env: Env, ctx: ExecutionContext): Promise<void> {
    void ctx;
    const services = getServices(env);
    await services.initialized.catch(() => {});
    for (const msg of batch.messages) {
      try { await deliverWebhook(services, msg.body); } catch { /* retry via queue re-delivery */ }
    }
  },

  async REWARD_PROCESSING_QUEUE(batch: { messages: Array<{ body: unknown }> }, env: Env, ctx: ExecutionContext): Promise<void> {
    void ctx;
    const services = getServices(env);
    await services.initialized.catch(() => {});
    for (const msg of batch.messages) {
      try { await services.ingest.ingestSms(msg.body as IngestSmsRequest); } catch (e) { console.error('[sms-ingest-error]', e); }
    }
  },

  async ANALYTICS_QUEUE(batch: { messages: Array<{ body: unknown }> }, env: Env, ctx: ExecutionContext): Promise<void> {
    void ctx;
    const services = getServices(env);
    await services.initialized.catch(() => {});
    for (const msg of batch.messages) {
      try { await services.logging.log('info', 'analytics', JSON.stringify(msg.body)); } catch (e) { console.error('[analytics-error]', e); }
    }
  },

  async scheduled(_event: any, env: Env, _ctx: ExecutionContext): Promise<void> {
    const services = getServices(env);
    await services.initialized.catch(() => {});
  },
} as Export;

interface Export {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) => Promise<Response>;
  WEBHOOK_DELIVERY_QUEUE: (batch: { messages: Array<{ body: unknown }> }, env: Env, ctx: ExecutionContext) => Promise<void>;
  REWARD_PROCESSING_QUEUE: (batch: { messages: Array<{ body: unknown }> }, env: Env, ctx: ExecutionContext) => Promise<void>;
  ANALYTICS_QUEUE: (batch: { messages: Array<{ body: unknown }> }, env: Env, ctx: ExecutionContext) => Promise<void>;
  scheduled: (event: any, env: Env, ctx: ExecutionContext) => Promise<void>;
}
