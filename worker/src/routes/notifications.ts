import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createApp } from '../middleware';
import { okList } from '../lib/helpers';
import type { Services } from '../services';

const NotificationListQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().optional(),
  unreadOnly: z.coerce.boolean().optional(),
});

export function registerNotificationsRoutes(app: ReturnType<typeof createApp>, services: Services): void {
  app.get('/notifications', zValidator('query', NotificationListQuery), async (c) => {
    const userId = c.get('user')!.id;
    const q = c.req.valid('query');
    const result = await services.notifications.list(userId, { limit: q.limit, cursor: q.cursor ?? null, unreadOnly: q.unreadOnly ?? false });
    return okList(c, result.data, {
      total: result.meta.total, nextCursor: result.meta.nextCursor,
      cursor: q.cursor ?? null, limit: q.limit, hasNext: !!result.meta.nextCursor, hasPrev: !!q.cursor,
    });
  });

  app.put('/notifications/:id/read', async (c) => {
    const userId = c.get('user')!.id;
    await services.notifications.markRead(c.req.param('id'), userId);
    return c.json({ success: true });
  });

  app.put('/notifications/read-all', async (c) => {
    const userId = c.get('user')!.id;
    await services.notifications.markAllRead(userId);
    return c.json({ success: true });
  });

  app.delete('/notifications/:id', async (c) => {
    const userId = c.get('user')!.id;
    await services.notifications.delete(c.req.param('id'), userId);
    return c.json({ success: true });
  });
}
