import type { Db } from '../db';
import type { Env } from '../config';
import type { WebhookDelivery, WebhookEventType } from '@iprn/types';
import { uuid, nowIso, hmacSha256Hex, sha256Hex } from '../config';
import type { LoggingService } from './logging';
import type { SettingsService } from './settings';
import { ALL_WEBHOOK_EVENTS } from '@iprn/types';

export interface WebhookConfig {
  id: string;
  userId: string;
  apiKeyId: string | null;
  url: string;
  events: string[];
  secretHash: string;
  createdAt: string;
  updatedAt: string;
}

export class WebhooksService {
  constructor(
    private db: Db,
    private env: Env,
    private logging: LoggingService,
    private settings: SettingsService
  ) {}

  async listWebhooks(userId: string): Promise<WebhookConfig[]> {
    const rows = await this.db.query<{
      id: string; user_id: string; api_key_id: string | null; url: string; events: string; secret_hash: string; created_at: string; updated_at: string;
    }>('SELECT id, user_id, api_key_id, url, events, secret_hash, created_at, updated_at FROM webhooks WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return rows.map((r) => ({
      id: r.id, userId: r.user_id, apiKeyId: r.api_key_id, url: r.url,
      events: JSON.parse(r.events), secretHash: r.secret_hash, createdAt: r.created_at, updatedAt: r.updated_at,
    }));
  }

  async createWebhook(userId: string, data: { url: string; events: string[]; apiKeyId?: string }): Promise<WebhookConfig> {
    const id = `wh_${uuid()}`;
    const now = nowIso();
    const secret = crypto.randomUUID();
    const secretHash = await sha256Hex(secret);
    await this.db.run(
      'INSERT INTO webhooks (id, user_id, api_key_id, url, events, secret_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, userId, data.apiKeyId ?? null, data.url, JSON.stringify(data.events), secretHash, now, now]
    );
    const config = await this.getWebhook(userId, id);
    if (config) {
      (config as any).__secret = secret;
    }
    return config as WebhookConfig;
  }

  async getWebhook(userId: string, id: string): Promise<WebhookConfig | null> {
    const row = await this.db.first<{
      id: string; user_id: string; api_key_id: string | null; url: string; events: string; secret_hash: string; created_at: string; updated_at: string;
    }>('SELECT id, user_id, api_key_id, url, events, secret_hash, created_at, updated_at FROM webhooks WHERE id = ? AND user_id = ?', [id, userId]);
    if (!row) return null;
    return {
      id: row.id, userId: row.user_id, apiKeyId: row.api_key_id, url: row.url,
      events: JSON.parse(row.events), secretHash: row.secret_hash, createdAt: row.created_at, updatedAt: row.updated_at,
    } as WebhookConfig;
  }

  async updateWebhook(userId: string, id: string, data: { url?: string; events?: string[] }): Promise<WebhookConfig | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    if (data.url !== undefined) { sets.push('url = ?'); params.push(data.url); }
    if (data.events !== undefined) { sets.push('events = ?'); params.push(JSON.stringify(data.events)); }
    if (sets.length === 0) return this.getWebhook(userId, id);
    params.push(nowIso(), id, userId);
    await this.db.run(`UPDATE webhooks SET ${sets.join(', ')}, updated_at = ? WHERE id = ? AND user_id = ?`, params);
    return this.getWebhook(userId, id);
  }

  async deleteWebhook(userId: string, id: string): Promise<void> {
    await this.db.run('DELETE FROM webhooks WHERE id = ? AND user_id = ?', [id, userId]);
  }

  async listDeliveries(userId: string, webhookId: string, opts: { limit?: number; cursor?: string | null }): Promise<{ data: WebhookDelivery[]; meta: { total: number; nextCursor: string | null } }> {
    const limit = Math.min(opts.limit ?? 25, 100);
    const wheres: string[] = ['user_id = ?'];
    const params: unknown[] = [userId];
    if (webhookId) { wheres.push('url IN (SELECT url FROM webhooks WHERE id = ? AND user_id = ?)'); params.push(webhookId, userId); }
    if (opts.cursor) { wheres.push('created_at < ?'); params.push(opts.cursor); }
    const whereClause = wheres.join(' AND ');
    const rows = await this.db.query<{
      id: string; user_id: string; api_key_id: string | null; event_type: string; url: string; status: string;
      attempts: number; last_attempt_at: string | null; next_retry_at: string | null; response_status: number | null;
      response_body: string | null; created_at: string; payload_hash: string;
    }>(
      `SELECT id, user_id, api_key_id, event_type, payload_hash, url, status, attempts, last_attempt_at, next_retry_at, response_status, response_body, created_at
       FROM webhook_deliveries WHERE ${whereClause} ORDER BY created_at DESC LIMIT ?`,
      [...params, limit + 1]
    );
    const hasNext = rows.length > limit;
    const data = rows.slice(0, limit);
    const nextCursor = hasNext ? (data[data.length - 1]?.created_at ?? null) : null;
    const formatted: WebhookDelivery[] = data.map((r) => ({
      id: r.id, userId: r.user_id, apiKeyId: r.api_key_id, eventType: r.event_type as WebhookEventType,
      payloadHash: r.payload_hash, url: r.url, status: r.status as WebhookDelivery['status'],
      attempts: r.attempts, lastAttemptAt: r.last_attempt_at, nextRetryAt: r.next_retry_at,
      responseStatus: r.response_status, responseBody: r.response_body, createdAt: r.created_at,
    }));
    return { data: formatted, meta: { total: data.length, nextCursor } };
  }

  async queueDelivery(userId: string, eventType: WebhookEventType, payload: Record<string, unknown>): Promise<void> {
    const configs = await this.listWebhooks(userId);
    const matched = configs.filter((c) => c.events.includes(eventType) || c.events.includes('*'));
    const now = nowIso();
    for (const cfg of matched) {
      const payloadStr = JSON.stringify(payload);
      const payloadHash = await sha256Hex(payloadStr);
      const deliveryId = `whd_${uuid()}`;
      await this.db.run(
        `INSERT INTO webhook_deliveries (id, user_id, api_key_id, event_type, payload_hash, url, status, attempts, last_attempt_at, next_retry_at, response_status, response_body, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, NULL, ?, NULL, NULL, ?)`,
        [deliveryId, userId, cfg.apiKeyId, eventType, payloadHash, cfg.url, now, now]
      );
      await this.env.WEBHOOK_DELIVERY_QUEUE.send({
        deliveryId, userId, eventType, payload, url: cfg.url, secretHash: cfg.secretHash,
      });
    }
  }

  async sendTest(userId: string, webhookId: string): Promise<{ status: string }> {
    const cfg = await this.getWebhook(userId, webhookId);
    if (!cfg) return { status: 'failed' };
    const payload = { type: 'webhook.test', timestamp: nowIso(), message: 'This is a test delivery from IPRN Online.' };
    await this.queueDelivery(userId, 'sms.received' as WebhookEventType, payload);
    return { status: 'queued' };
  }

  async validateIncomingRequest(providerId: string, req: Request): Promise<{ valid: boolean; body?: unknown }> {
    const provider = await this.db.first<{ config: string }>('SELECT config FROM providers WHERE id = ?', [providerId]);
    if (!provider) return { valid: false };
    const cfg = JSON.parse(provider.config) as Record<string, unknown>;
    const sigHeader = cfg.signatureHeader as string | undefined;
    const sigSecret = cfg.signatureSecret as string | undefined;
    if (sigHeader && sigSecret) {
      const provided = req.headers.get(sigHeader);
      if (!provided) return { valid: false };
      const bodyText = await req.clone().text();
      const expected = await hmacSha256Hex(sigSecret, bodyText);
      const valid = provided.toLowerCase() === `sha256=${expected}` || provided.toLowerCase() === expected;
      if (!valid) return { valid: false };
    }
    const body = await req.json().catch(() => ({}));
    return { valid: true, body };
  }

  async validateProviderSignature(providerId: string, body: string, signature: string): Promise<boolean> {
    const provider = await this.db.first<{ config: string }>('SELECT config FROM providers WHERE id = ?', [providerId]);
    if (!provider) return false;
    const cfg = JSON.parse(provider.config) as Record<string, unknown>;
    const sigSecret = cfg.signatureSecret as string | undefined;
    if (!sigSecret) return true;
    if (!signature) return false;
    const expected = await hmacSha256Hex(sigSecret, body);
    const provided = signature.toLowerCase().replace('sha256=', '');
    const a = new Uint8Array(Array.from(expected, (c) => c.charCodeAt(0)));
    const b = new Uint8Array(Array.from(provided, (c) => c.charCodeAt(0)));
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) result |= (a[i] ?? 0) ^ (b[i] ?? 0);
    return result === 0;
  }
}

export { ALL_WEBHOOK_EVENTS };
