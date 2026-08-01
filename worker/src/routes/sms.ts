import { createApp } from '../middleware';
import { zValidator } from '@hono/zod-validator';
import { SmsListQuerySchema } from '@iprn/validators';
import { parsePagination, okList } from '../lib/helpers';
import type { Services } from '../services';

export function registerSmsRoutes(app: ReturnType<typeof createApp>, services: Services): void {
  app.get('/sms', zValidator('query', SmsListQuerySchema), async (c) => {
    const userId = c.get('user')!.id;
    const query = c.req.valid('query');
    const result = await services.sms.listUserSms(userId, {
      limit: query.limit, search: query.search,
      numberId: query.numberId, country: query.country, operator: query.operator,
      status: query.status, from: query.from, to: query.to,
      sortBy: query.sortBy, sortDir: query.sortDir,
    });
    return okList(c, result.data, {
      total: result.meta.total, nextCursor: result.meta.nextCursor,
      cursor: query.cursor ?? null, limit: query.limit,
      hasNext: !!result.meta.nextCursor, hasPrev: !!query.cursor,
    });
  });

  app.get('/sms/latest', async (c) => {
    const userId = c.get('user')!.id;
    const latest = await services.sms.latestUserSms(userId);
    return c.json(latest ?? null);
  });

  app.get('/sms/:id', async (c) => {
    const userId = c.get('user')!.id;
    const row = await services.db.first<{
      id: string; number_id: string; user_id: string; sender: string; body: string; extracted_otp: string | null;
      country: string; operator: string; provider_id: string; status: string; reward_event_id: string | null; created_at: string;
    }>('SELECT * FROM sms_messages WHERE id = ? AND user_id = ?', [c.req.param('id'), userId]);
    if (!row) return c.json({ type: 'https://iprn.online/problems/not-found', title: 'Not Found', status: 404, detail: 'SMS not found' }, 404);
    return c.json({
      id: row.id, numberId: row.number_id, userId: row.user_id, sender: row.sender, body: row.body,
      extractedOtp: row.extracted_otp, country: row.country, operator: row.operator, providerId: row.provider_id,
      status: row.status, rewardEventId: row.reward_event_id, createdAt: row.created_at,
    });
  });

  app.get('/sms/by-number/:numberId', zValidator('query', SmsListQuerySchema), async (c) => {
    const userId = c.get('user')!.id;
    const numberId = c.req.param('numberId');
    const query = c.req.valid('query');
    const result = await services.sms.listUserSms(userId, { limit: query.limit, numberId, search: query.search ?? undefined, status: query.status, from: query.from, to: query.to, sortBy: query.sortBy, sortDir: query.sortDir });
    return okList(c, result.data, {
      total: result.meta.total, nextCursor: result.meta.nextCursor,
      cursor: query.cursor ?? null, limit: query.limit,
      hasNext: !!result.meta.nextCursor, hasPrev: !!query.cursor,
    });
  });

  // OTP routes
  app.get('/otp/latest', async (c) => {
    const userId = c.get('user')!.id;
    const otp = await services.sms.latestUserOtp(userId);
    return c.json(otp ?? null);
  });

  app.get('/otp/history', zValidator('query', SmsListQuerySchema), async (c) => {
    const userId = c.get('user')!.id;
    const query = c.req.valid('query');
    const result = await services.sms.otpHistory(userId, {
      limit: query.limit, cursor: query.cursor ?? null, numberId: query.numberId,
      from: query.from, to: query.to,
    });
    return okList(c, result.data, {
      total: result.meta.total, nextCursor: result.meta.nextCursor ?? null,
      cursor: query.cursor ?? null, limit: query.limit,
      hasNext: !!result.meta.nextCursor, hasPrev: !!query.cursor,
    });
  });

  app.get('/otp/by-number/:numberId', async (c) => {
    const userId = c.get('user')!.id;
    const otp = await services.sms.latestOtpByNumber(c.req.param('numberId'), userId);
    return c.json(otp ?? null);
  });
}
