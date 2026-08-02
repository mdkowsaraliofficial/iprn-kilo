import { createApp } from '../middleware';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { okList } from '../lib/helpers';
import { generateSecret, sha256Hex, nowIso, uuid } from '../config';
import type { Services } from '../services';

const CreateKeySchema = z.object({ name: z.string().min(1).max(100), permissions: z.array(z.string()).optional() });

export function registerApiKeysRoutes(app: ReturnType<typeof createApp>, services: Services): void {
  app.get('/api-keys', async (c) => {
    const userId = c.get('user')!.id;
    const rows = await services.db.query<{
      id: string; key_prefix: string; webhook_url: string | null; webhook_events: string; permissions: string;
      rate_limit_override: number | null; last_used_at: string | null; created_at: string;
    }>('SELECT id, key_prefix, webhook_url, webhook_events, permissions, rate_limit_override, last_used_at, created_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return c.json(rows.map((r) => ({
      id: r.id, keyPrefix: r.key_prefix, keyPrefixDisplay: r.key_prefix,
      webhookUrl: r.webhook_url, webhookEvents: JSON.parse(r.webhook_events),
      permissions: JSON.parse(r.permissions), rateLimitOverride: r.rate_limit_override,
      lastUsedAt: r.last_used_at, createdAt: r.created_at, maskedSecret: '••••••••',
    })));
  });

  app.post('/api-keys', zValidator('json', CreateKeySchema), async (c) => {
    const userId = c.get('user')!.id;
    const data = c.req.valid('json');
    const keyId = `key_${uuid()}`;
    const keyPrefix = `ipk_${Math.random().toString(36).slice(2, 10)}`;
    const secret = await generateSecret();
    const secretHash = await sha256Hex(secret);
    const keyHash = await sha256Hex(`${keyId}.${secret}`);
    const permissions = data.permissions ?? ['sms.read', 'wallet.read', 'numbers.read', 'rewards.read', 'otp.read'];
    await services.db.run(
      'INSERT INTO api_keys (id, user_id, key_hash, key_prefix, secret_hash, webhook_url, webhook_events, permissions, rate_limit_override, last_used_at, created_at) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, NULL, NULL, ?)',
      [keyId, userId, keyHash, keyPrefix, secretHash, JSON.stringify(permissions), nowIso()]
    );
    await services.logging.audit(userId, 'api_key.create', 'api_key', keyId, null, null, null, 'info');
    return c.json({ id: keyId, keyId, keyPrefix, secret, createdAt: nowIso() }, 201);
  });

  app.delete('/api-keys/:id', async (c) => {
    const userId = c.get('user')!.id;
    const r = await services.db.run('DELETE FROM api_keys WHERE id = ? AND user_id = ?', [c.req.param('id'), userId]);
    if ((r.meta as any)?.changes === 0) return c.json({ type: 'https://iprn.online/problems/not-found', title: 'Not Found', status: 404, detail: 'API key not found' }, 404);
    return c.json({ success: true });
  });

  app.post('/api-keys/:id/rotate', async (c) => {
    const userId = c.get('user')!.id;
    const id = c.req.param('id');
    const row = await services.db.first<{ key_prefix: string }>('SELECT key_prefix FROM api_keys WHERE id = ? AND user_id = ?', [id, userId]);
    if (!row) return c.json({ type: 'https://iprn.online/problems/not-found', title: 'Not Found', status: 404, detail: 'API key not found' }, 404);
    const newSecret = await generateSecret();
    const newSecretHash = await sha256Hex(newSecret);
    await services.db.run('UPDATE api_keys SET secret_hash = ? WHERE id = ?', [newSecretHash, id]);
    await services.logging.audit(userId, 'api_key.rotate', 'api_key', id, null, null, null, 'info');
    return c.json({ id, keyPrefix: row.key_prefix, secret: newSecret });
  });

  app.get('/api-keys/:id/usage', async (c) => {
    const userId = c.get('user')!.id;
    const id = c.req.param('id');
    const exists = await services.db.first<{ id: string }>('SELECT id FROM api_keys WHERE id = ? AND user_id = ?', [id, userId]);
    if (!exists) return c.json({ type: 'https://iprn.online/problems/not-found', title: 'Not Found', status: 404, detail: 'API key not found' }, 404);
    const [total, today, top] = await Promise.all([
      services.db.first<{ c: number }>('SELECT COUNT(*) as c FROM api_usage_logs WHERE api_key_id = ?', [id]),
      services.db.first<{ c: number }>("SELECT COUNT(*) as c FROM api_usage_logs WHERE api_key_id = ? AND date(created_at) = date('now')", [id]),
      services.db.query<{ endpoint: string; count: number }>('SELECT endpoint, COUNT(*) as count FROM api_usage_logs WHERE api_key_id = ? GROUP BY endpoint ORDER BY count DESC LIMIT 10', [id]),
    ]);
    return c.json({
      totalRequests: total ? Number(total.c) : 0,
      requestsToday: today ? Number(today.c) : 0,
      topEndpoints: top.map((r) => ({ endpoint: r.endpoint, count: Number(r.count) })),
    });
  });

  app.get('/api-keys/:id/logs', async (c) => {
    const userId = c.get('user')!.id;
    const id = c.req.param('id');
    const limit = parseInt(c.req.query('limit') ?? '25', 10);
    const rows = await services.db.query<{ endpoint: string; method: string; status_code: number; response_time_ms: number; created_at: string }>(
      'SELECT endpoint, method, status_code, response_time_ms, created_at FROM api_usage_logs WHERE api_key_id = ? ORDER BY created_at DESC LIMIT ?',
      [id, limit + 1]
    );
    const hasNext = rows.length > limit;
    const data = rows.slice(0, limit).map((r) => ({ endpoint: r.endpoint, method: r.method, statusCode: r.status_code, responseTimeMs: r.response_time_ms, createdAt: r.created_at }));
    return okList(c, data, { total: rows.length, nextCursor: hasNext ? (data[data.length - 1]?.createdAt ?? null) : null, cursor: c.req.query('cursor') ?? null, limit, hasNext, hasPrev: !!c.req.query('cursor') });
  });
}
