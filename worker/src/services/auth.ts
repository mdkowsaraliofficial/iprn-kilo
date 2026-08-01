import type { Db } from '../db';
import type { Env } from '../config';
import { DEMO_USER_ID, sha256Hex, hashPassword, verifyPassword, generateToken, nowIso, uuid } from '../config';
import type { User, ApiKey } from '@iprn/types';
import type { SettingsService } from './settings';
import type { LoggingService } from './logging';

export interface AuthPrincipal {
  user: User;
  apiKey: ApiKey | null;
  isImpersonated: boolean;
}

export class AuthService {
  constructor(private db: Db, private env: Env, private settings: SettingsService, private logging: LoggingService) {}

  async validateApiKey(keyId: string, secret: string): Promise<{ user: User; apiKey: ApiKey } | null> {
    const row = await this.db.first<{
      id: string;
      user_id: string;
      key_hash: string;
      key_prefix: string;
      secret_hash: string;
      webhook_url: string | null;
      webhook_events: string;
      permissions: string;
      rate_limit_override: number | null;
      last_used_at: string | null;
      created_at: string;
    }>(
      'SELECT id, user_id, key_hash, key_prefix, secret_hash, webhook_url, webhook_events, permissions, rate_limit_override, last_used_at, created_at FROM api_keys WHERE id = ?',
      [keyId]
    );
    if (!row) return null;

    const providedFullHash = await sha256Hex(`${keyId}.${secret}`);
    const providedSecretHash = await sha256Hex(secret);

    const storedSecretHash = row.secret_hash;
    const valid = providedSecretHash === storedSecretHash || providedFullHash === row.key_hash;
    if (!valid) return null;

    const user = await this.getUser(row.user_id);
    if (!user) return null;

    const apiKey: ApiKey = {
      id: row.id,
      userId: row.user_id,
      keyHash: row.key_hash,
      keyPrefix: row.key_prefix,
      secretHash: row.secret_hash,
      webhookUrl: row.webhook_url,
      webhookEvents: JSON.parse(row.webhook_events),
      permissions: JSON.parse(row.permissions),
      rateLimitOverride: row.rate_limit_override,
      lastUsedAt: row.last_used_at,
      createdAt: row.created_at,
    };

    await this.db.run('UPDATE api_keys SET last_used_at = datetime(\'now\') WHERE id = ?', [row.id]);

    return { user, apiKey };
  }

  async validateToken(token: string): Promise<{ user: User; apiKey: ApiKey | null } | null> {
    const stored = await this.env.SESSION_KV.get(`sess:${token}`);
    if (!stored) return null;
    let payload: any;
    try { payload = JSON.parse(stored); } catch { return null; }
    const user = await this.getUser(payload.userId);
    if (!user) return null;
    return { user, apiKey: null };
  }

  async getUser(userId: string): Promise<User | null> {
    const row = await this.db.first<{
      id: string;
      email: string;
      display_name: string;
      status: string;
      role: string;
      number_limit_override: number | null;
      api_enabled: number;
      tier: string;
      created_at: string;
    }>('SELECT id, email, display_name, status, role, number_limit_override, api_enabled, tier, created_at FROM users WHERE id = ?', [userId]);
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      status: row.status as User['status'],
      role: row.role as User['role'],
      numberLimitOverride: row.number_limit_override,
      apiEnabled: row.api_enabled === 1,
      createdAt: row.created_at,
    } as User;
  }

  async getApiKeyById(id: string): Promise<ApiKey | null> {
    const row = await this.db.first<{
      id: string;
      user_id: string;
      key_hash: string;
      key_prefix: string;
      secret_hash: string;
      webhook_url: string | null;
      webhook_events: string;
      permissions: string;
      rate_limit_override: number | null;
      last_used_at: string | null;
      created_at: string;
    }>('SELECT * FROM api_keys WHERE id = ?', [id]);
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      keyHash: row.key_hash,
      keyPrefix: row.key_prefix,
      secretHash: row.secret_hash,
      webhookUrl: row.webhook_url,
      webhookEvents: JSON.parse(row.webhook_events),
      permissions: JSON.parse(row.permissions),
      rateLimitOverride: row.rate_limit_override,
      lastUsedAt: row.last_used_at,
      createdAt: row.created_at,
    };
  }

  async register(data: { email: string; password: string; displayName: string }): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const existing = await this.db.first<{ id: string }>('SELECT id FROM users WHERE email = ?', [data.email]);
    if (existing) {
      const err: any = new Error('Email already registered');
      err.code = 'CONFLICT';
      err.status = 409;
      throw err;
    }
    const userId = `user_${uuid()}`;
    const passwordHash = await hashPassword(data.password);
    const tier = await this.settings.get<string>('default_user_tier') ?? 'bronze';
    await this.db.run(
      'INSERT INTO users (id, email, display_name, status, role, number_limit_override, api_enabled, tier, password_hash, created_at) VALUES (?, ?, ?, ?, ?, NULL, 1, ?, ?, ?)',
      [userId, data.email, data.displayName, 'active', 'user', tier, passwordHash, nowIso()]
    );
    await this.db.run(
      'INSERT INTO wallet_balances (user_id, pending_cents, approved_cents, frozen_cents, lifetime_earned_cents, lifetime_withdrawn_cents, updated_at) VALUES (?, 0, 0, 0, 0, 0, ?)',
      [userId, nowIso()]
    );

    const accessToken = await generateToken();
    const refreshToken = await generateToken();
    await this.env.SESSION_KV.put(`sess:${accessToken}`, JSON.stringify({ userId, role: 'user', tokenId: accessToken }), { expirationTtl: 3600 });
    await this.env.SESSION_KV.put(`rsess:${refreshToken}`, JSON.stringify({ userId, role: 'user', tokenId: refreshToken }), { expirationTtl: 86400 });

    await this.logging.audit(userId, 'user.register', 'user', userId, { email: data.email, displayName: data.displayName }, null, null, 'info');
    const user = await this.getUser(userId);
    return { user: user!, accessToken, refreshToken };
  }

  async login(data: { email: string; password: string; totpCode?: string }): Promise<{ user: User; accessToken: string; refreshToken: string } | null> {
    const row = await this.db.first<{ id: string; password_hash: string | null; status: string; role: string }>(
      'SELECT id, password_hash, status, role FROM users WHERE email = ?',
      [data.email]
    );
    if (!row || !row.password_hash) return null;
    const valid = await verifyPassword(data.password, row.password_hash);
    if (!valid) return null;
    const accessToken = await generateToken();
    const refreshToken = await generateToken();
    await this.env.SESSION_KV.put(`sess:${accessToken}`, JSON.stringify({ userId: row.id, role: row.role, tokenId: accessToken }), { expirationTtl: 3600 });
    await this.env.SESSION_KV.put(`rsess:${refreshToken}`, JSON.stringify({ userId: row.id, role: row.role, tokenId: refreshToken }), { expirationTtl: 86400 });
    const user = await this.getUser(row.id);
    return { user: user!, accessToken, refreshToken };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
    const stored = await this.env.SESSION_KV.get(`rsess:${refreshToken}`);
    if (!stored) return null;
    let payload: any;
    try { payload = JSON.parse(stored); } catch { return null; }
    const newAccess = await generateToken();
    await this.env.SESSION_KV.put(`sess:${newAccess}`, JSON.stringify({ userId: payload.userId, role: payload.role, tokenId: newAccess }), { expirationTtl: 3600 });
    return { accessToken: newAccess, refreshToken };
  }

  async resolvePrincipal(req: Request): Promise<AuthPrincipal> {
    // 1. API key header
    const apiKeyHeader = req.headers.get('x-api-key');
    if (apiKeyHeader) {
      const sep = apiKeyHeader.indexOf('.');
      if (sep > 0) {
        const keyId = apiKeyHeader.substring(0, sep);
        const secret = apiKeyHeader.substring(sep + 1);
        const found = await this.validateApiKey(keyId, secret);
        if (found) return { user: found.user, apiKey: found.apiKey, isImpersonated: false };
      }
    }

    // 2. Bearer token
    const auth = req.headers.get('Authorization');
    if (auth && auth.startsWith('Bearer ')) {
      const token = auth.substring(7);
      const found = await this.validateToken(token);
      if (found) return { user: found.user, apiKey: found.apiKey ?? null, isImpersonated: false };
    }

    // 3. Admin impersonation token (dev / admin panel)
    const adminHeader = req.headers.get('x-admin-token');
    if (adminHeader && this.env.ADMIN_TOKEN && adminHeader === this.env.ADMIN_TOKEN) {
      const admin = await this.getUser('admin-user-001');
      if (admin) return { user: admin, apiKey: null, isImpersonated: true };
    }

    // 4. Open-access dev fallback -> demo user
    const demo = await this.getUser(DEMO_USER_ID);
    if (demo) return { user: demo, apiKey: null, isImpersonated: true };

    throw new Error('Unable to resolve auth principal');
  }
}
