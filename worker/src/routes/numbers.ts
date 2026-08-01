import { createApp } from '../middleware';
import { zValidator } from '@hono/zod-validator';
import { NumberListQuerySchema, NumberRequestSchema } from '@iprn/validators';
import { parsePagination, okList } from '../lib/helpers';
import type { Services } from '../services';

export function registerNumbersRoutes(app: ReturnType<typeof createApp>, services: Services): void {
  app.get('/numbers', zValidator('query', NumberListQuerySchema), async (c) => {
    const userId = c.get('user')!.id;
    const q = c.req.valid('query');
    const result = await services.numbers.getUserNumbers(userId);
    return okList(c, result, {
      total: result.length, nextCursor: null,
      cursor: null, limit: q.limit, hasNext: false, hasPrev: false,
    });
  });

  app.get('/numbers/available', async (c) => {
    const summary = await services.numbers.getAvailableSummary();
    return c.json(summary);
  });

  app.post('/numbers/request', zValidator('json', NumberRequestSchema), async (c) => {
    const userId = c.get('user')!.id;
    const data = c.req.valid('json');
    try {
      const { assigned } = await services.numbers.assignNumbers(userId, data);
      await services.logging.audit(userId, 'number.assign', 'number', null, { count: assigned.length, countryCode: data.countryCode }, null, null, 'info');
      for (const n of assigned) {
        await services.webhooks.queueDelivery(userId, 'number.assigned', {
          type: 'number.assigned', userId, number: n, assignedAt: n.createdAt,
        });
      }
      return c.json({ message: `Assigned ${assigned.length} number(s)`, assigned }, 201);
    } catch (e: any) {
      if (e.code === 'NO_NUMBERS_AVAILABLE') {
        return c.json({ type: 'https://iprn.online/problems/no-numbers', title: 'Conflict', status: 409, detail: e.message }, 409);
      }
      throw e;
    }
  });

  app.get('/numbers/:id', async (c) => {
    const userId = c.get('user')!.id;
    const number = await services.numbers.getNumberDetail(userId, c.req.param('id'));
    if (!number) return c.json({ type: 'https://iprn.online/problems/not-found', title: 'Not Found', status: 404, detail: 'Number not found' }, 404);
    return c.json(number);
  });

  app.delete('/numbers/:id/release', async (c) => {
    const userId = c.get('user')!.id;
    const numberId = c.req.param('id');
    const before = await services.numbers.getNumberDetail(userId, numberId);
    if (!before) return c.json({ type: 'https://iprn.online/problems/not-found', title: 'Not Found', status: 404, detail: 'Number not found' }, 404);
    try {
      await services.numbers.releaseNumber(userId, numberId);
      await services.logging.audit(userId, 'number.release', 'number', numberId, null, null, null, 'info');
      await services.webhooks.queueDelivery(userId, 'number.released', {
        type: 'number.released', userId, numberId, e164: before.e164, releasedAt: nowIso(),
      });
      return c.json({ success: true });
    } catch (e: any) {
      if (e.code === 'NOT_FOUND') return c.json({ type: 'https://iprn.online/problems/not-found', title: 'Not Found', status: 404, detail: e.message }, 404);
      throw e;
    }
  });
}

import { nowIso } from '../config';
