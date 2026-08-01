import { createApp } from '../middleware';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { okList } from '../lib/helpers';
import { hmacSha256Hex, sha256Hex, nowIso } from '../config';
import type { Services } from '../services';

const WebhookCreateBody = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  secret: z.string().min(8).optional(),
});
const WebhookUpdateBody = z.object({
  url: z.string().url().optional(),
  events: z.array(z.string()).optional(),
});

export function registerWebhookRoutes(app: ReturnType<typeof createApp>, services: Services): void {
  app.get('/webhooks', async (c) => {
    const userId = c.get('user')!.id;
    const webhooks = await services.webhooks.listWebhooks(userId);
    return c.json(webhooks.map((w) => ({
      id: w.id, userId: w.userId, url: w.url, events: w.events, createdAt: w.createdAt, updatedAt: w.updatedAt,
    })));
  });

  app.post('/webhooks', zValidator('json', WebhookCreateBody), async (c) => {
    const userId = c.get('user')!.id;
    const data = c.req.valid('json');
    const cfg = await services.webhooks.createWebhook(userId, { url: data.url, events: data.events });
    return c.json({
      id: cfg.id, userId: cfg.userId, url: cfg.url, events: cfg.events,
      secret: (cfg as any).__secret, createdAt: cfg.createdAt, updatedAt: cfg.updatedAt,
    }, 201);
  });

  app.put('/webhooks/:id', zValidator('json', WebhookUpdateBody), async (c) => {
    const userId = c.get('user')!.id;
    const updated = await services.webhooks.updateWebhook(userId, c.req.param('id'), c.req.valid('json'));
    if (!updated) return c.json({ type: 'https://iprn.online/problems/not-found', title: 'Not Found', status: 404, detail: 'Webhook not found' }, 404);
    return c.json({ id: updated.id, userId: updated.userId, url: updated.url, events: updated.events, updatedAt: updated.updatedAt });
  });

  app.delete('/webhooks/:id', async (c) => {
    const userId = c.get('user')!.id;
    await services.webhooks.deleteWebhook(userId, c.req.param('id'));
    return c.json({ success: true });
  });

  app.post('/webhooks/:id/test', async (c) => {
    const userId = c.get('user')!.id;
    const result = await services.webhooks.sendTest(userId, c.req.param('id'));
    return c.json(result);
  });

  app.get('/webhooks/:id/deliveries', async (c) => {
    const userId = c.get('user')!.id;
    const q = c.req.query('limit');
    const limit = parseInt(q ?? '25', 10);
    const result = await services.webhooks.listDeliveries(userId, c.req.param('id'), { limit });
    return okList(c, result.data, {
      total: result.meta.total, nextCursor: result.meta.nextCursor,
      cursor: c.req.query('cursor') ?? null, limit, hasNext: !!result.meta.nextCursor, hasPrev: !!c.req.query('cursor'),
    });
  });

  app.post('/ingest/webhook/:providerId', async (c) => {
    const providerId = c.req.param('providerId');
    const bodyText = await c.req.text();
    const signature = c.req.header('x-hmac-signature') ?? c.req.header('x-hook-signature') ?? '';
    const valid = await services.webhooks.validateProviderSignature(providerId, bodyText, signature);
    if (!valid) return c.json({ processed: false, error: 'Invalid signature' }, 401);
    let body: any = {};
    try { body = JSON.parse(bodyText); } catch { body = {}; }
    const res = await services.ingest.ingestSms({
      phoneNumber: body.phoneNumber ?? body.number ?? '',
      sender: body.sender ?? 'unknown',
      message: body.message ?? body.body ?? '',
      providerId,
    });
    return c.json(res);
  });
}
