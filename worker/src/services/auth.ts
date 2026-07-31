import type { Db } from '../db';
import type { Env, User, ApiKey, DEMO_USER_ID } from '../config';
import { sha256Hex } from '../config';
import type { SettingsService } from './settings';

export interface AuthPrincipal {
  user: User;
  apiKey: ApiKey | null;
  isImpersonated: boolean;
}

export class AuthService {
  constructor(private db: Db, private env: Env, private settings: SettingsService) {}

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
    // Future-ready stub: JWT validation. For now returns null.
    return null;
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
