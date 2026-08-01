import type { Db } from '../db';
import type { Env } from '../config';
import type { Provider, ProviderHealthLog } from '@iprn/types';
import { uuid, nowIso, sha256Hex } from '../config';
import type { CacheService } from './logging';
import type { LoggingService } from './logging';

export class ProvidersService {
  constructor(private db: Db, private env: Env, private cache: CacheService, private logging: LoggingService) {}

  async list(): Promise<Provider[]> {
    const rows = await this.db.query<{
      id: string; name: string; slug: string; type: string; config: string;
      status: string; health_score: number; last_checked_at: string | null; created_at: string; updated_at: string;
    }>('SELECT id, name, slug, type, config, status, health_score, last_checked_at, created_at, updated_at FROM providers ORDER BY created_at DESC');
    return rows.map((r) => ({
      id: r.id, name: r.name, slug: r.slug, type: r.type as Provider['type'],
      config: r.config ? JSON.parse(r.config) : {},
      status: r.status as Provider['status'], healthScore: r.health_score,
      lastCheckedAt: r.last_checked_at, createdAt: r.created_at, updatedAt: r.updated_at,
    }));
  }

  async get(slug: string): Promise<Provider | null> {
    const row = await this.db.first<{
      id: string; name: string; slug: string; type: string; config: string;
      status: string; health_score: number; last_checked_at: string | null; created_at: string; updated_at: string;
    }>('SELECT * FROM providers WHERE slug = ?', [slug]);
    if (!row) return null;
    return {
      id: row.id, name: row.name, slug: row.slug, type: row.type as Provider['type'],
      config: row.config ? JSON.parse(row.config) : {},
      status: row.status as Provider['status'], healthScore: row.health_score,
      lastCheckedAt: row.last_checked_at, createdAt: row.created_at, updatedAt: row.updated_at,
    };
  }

  async create(data: { name: string; slug: string; type: Provider['type']; config: Record<string, unknown>; status: Provider['status'] }): Promise<Provider> {
    const id = `prov_${uuid()}`;
    await this.db.run(
      'INSERT INTO providers (id, name, slug, type, config, status, health_score, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 100, ?, ?)',
      [id, data.name, data.slug, data.type, JSON.stringify(data.config), data.status, nowIso(), nowIso()]
    );
    await this.cache.delete('iprn:providers');
    return (await this.get(data.slug))!;
  }

  async update(id: string, data: Partial<{ name: string; slug: string; type: string; config: Record<string, unknown>; status: string; healthScore: number }>): Promise<Provider | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    if (data.name !== undefined) { sets.push('name = ?'); params.push(data.name); }
    if (data.slug !== undefined) { sets.push('slug = ?'); params.push(data.slug); }
    if (data.type !== undefined) { sets.push('type = ?'); params.push(data.type); }
    if (data.config !== undefined) { sets.push('config = ?'); params.push(JSON.stringify(data.config)); }
    if (data.status !== undefined) { sets.push('status = ?'); params.push(data.status); }
    if (data.healthScore !== undefined) { sets.push('health_score = ?'); params.push(data.healthScore); }
    if (sets.length === 0) return this.getByProviderId(id);
    params.push(nowIso(), id);
    await this.db.run(`UPDATE providers SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`, params);
    await this.cache.delete('iprn:providers');
    return this.getByProviderId(id);
  }

  async getByProviderId(id: string): Promise<Provider | null> {
    const row = await this.db.first<{
      id: string; name: string; slug: string; type: string; config: string;
      status: string; health_score: number; last_checked_at: string | null; created_at: string; updated_at: string;
    }>('SELECT * FROM providers WHERE id = ?', [id]);
    if (!row) return null;
    return {
      id: row.id, name: row.name, slug: row.slug, type: row.type as Provider['type'],
      config: row.config ? JSON.parse(row.config) : {},
      status: row.status as Provider['status'], healthScore: row.health_score,
      lastCheckedAt: row.last_checked_at, createdAt: row.created_at, updatedAt: row.updated_at,
    };
  }

  async healthCheck(providerId: string): Promise<{ status: string; responseTimeMs: number | null; error: string | null }> {
    const provider = await this.getByProviderId(providerId);
    if (!provider) return { status: 'down', responseTimeMs: null, error: 'Provider not found' };
    const start = Date.now();
    try {
      let status = 'healthy';
      let error: string | null = null;
      if (provider.type === 'http_api') {
        const cfg = provider.config as Record<string, unknown>;
        const url = cfg.healthCheckUrl as string | undefined;
        if (url) {
          const res = await fetch(url, { method: 'GET', cf: { timeout: 5000 } } as any);
          const elapsed = Date.now() - start;
          if (!res.ok) { status = res.status >= 500 ? 'down' : 'degraded'; error = `HTTP ${res.status}`; }
          const responseTimeMs = elapsed;
          await this.recordHealth(providerId, status, responseTimeMs, error);
          return { status, responseTimeMs, error };
        }
      }
      if (provider.type === 'manual_pool') {
        status = 'healthy';
        const responseTimeMs = Date.now() - start;
        await this.recordHealth(providerId, status, responseTimeMs, null);
        return { status, responseTimeMs, error: null };
      }
      const responseTimeMs = Date.now() - start;
      await this.recordHealth(providerId, status, responseTimeMs, null);
      return { status, responseTimeMs, error: null };
    } catch (e) {
      const responseTimeMs = Date.now() - start;
      await this.recordHealth(providerId, 'down', responseTimeMs, (e as Error).message);
      return { status: 'down', responseTimeMs, error: (e as Error).message };
    }
  }

  private async recordHealth(providerId: string, status: string, responseTimeMs: number | null, error: string | null): Promise<void> {
    const healthScore = status === 'healthy' ? 100 : status === 'degraded' ? 50 : 0;
    await this.db.run(
      'UPDATE providers SET status = ?, health_score = ?, last_checked_at = ? WHERE id = ?',
      [status as Provider['status'], healthScore, nowIso(), providerId]
    );
    await this.db.run(
      'INSERT INTO provider_health_log (id, provider_id, status, response_time_ms, error_message, checked_at) VALUES (?, ?, ?, ?, ?, ?)',
      [`health_${uuid()}`, providerId, status, responseTimeMs, error, nowIso()]
    );
    await this.cache.delete(`iprn:providers:${providerId}`);
  }
}
