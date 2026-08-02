import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createApp } from '../middleware';
import type { Services } from '../services';

const DateRangeQuery = z.object({ from: z.string().optional(), to: z.string().optional() });

export function registerAnalyticsRoutes(app: ReturnType<typeof createApp>, services: Services): void {
  app.get('/analytics/summary', async (c) => {
    const userId = c.get('user')!.id;
    const [summary, sms] = await Promise.all([services.rewards.summary(userId), services.sms.platformStats()]);
    return c.json({
      smsCountToday: sms.smsToday,
      otpCountToday: sms.otpToday,
      earningsTodayCents: summary.today,
      earnings7dCents: summary.last7Days,
      earnings30dCents: summary.last30Days,
      lifetimeEarningCents: summary.lifetime,
    });
  });

  app.get('/analytics/sms-by-day', zValidator('query', DateRangeQuery), async (c) => {
    const userId = c.get('user')!.id;
    const q = c.req.valid('query');
    const data = await services.analytics.getSmsByDay(userId, q.from, q.to);
    return c.json(data);
  });

  app.get('/analytics/earnings-by-day', zValidator('query', DateRangeQuery), async (c) => {
    const userId = c.get('user')!.id;
    const q = c.req.valid('query');
    const data = await services.analytics.getEarningsByDay(userId, q.from, q.to);
    return c.json(data);
  });

  app.get('/analytics/sms-by-country', zValidator('query', DateRangeQuery), async (c) => {
    const userId = c.get('user')!.id;
    const q = c.req.valid('query');
    const data = await services.analytics.getByCountry(userId);
    return c.json(data);
  });

  app.get('/analytics/sms-by-operator', zValidator('query', DateRangeQuery), async (c) => {
    const userId = c.get('user')!.id;
    const q = c.req.valid('query');
    const data = await services.analytics.getByOperator(userId);
    return c.json(data);
  });
}

const ProfileUpdateSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  timezone: z.string().optional(),
  notificationPreferences: z.record(z.string(), z.unknown()).optional(),
});

export function registerSettingsRoutes(app: ReturnType<typeof createApp>, services: Services): void {
  app.get('/settings/profile', async (c) => {
    const userId = c.get('user')!.id;
    const user = await services.auth.getUser(userId);
    const timezoneSetting = await services.db.first<{ value: string }>('SELECT value FROM system_settings WHERE key = ?', [`user:${userId}:timezone`]);
    const notifSetting = await services.db.first<{ value: string }>('SELECT value FROM system_settings WHERE key = ?', [`user:${userId}:notif_prefs`]);
    const numberLimit = user?.numberLimitOverride ?? (await services.getSetting<number>('default_number_limit'));
    return c.json({
      userId: user?.id, displayName: user?.displayName, email: user?.email,
      timezone: timezoneSetting?.value ?? 'UTC',
      notificationPreferences: notifSetting?.value ? JSON.parse(notifSetting.value) : {},
      numberLimit: Number(numberLimit), apiEnabled: user?.apiEnabled ?? false,
    });
  });

  app.put('/settings/profile', zValidator('json', ProfileUpdateSchema), async (c) => {
    const userId = c.get('user')!.id;
    const data = c.req.valid('json');
    const updates: string[] = [];
    const params: unknown[] = [];
    if (data.displayName !== undefined) { updates.push('display_name = ?'); params.push(data.displayName); }
    if (data.email !== undefined) { updates.push('email = ?'); params.push(data.email); }
    if (updates.length > 0) { params.push(userId); await services.db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params); }
    if (data.timezone !== undefined) {
      await services.db.run('INSERT INTO system_settings (key, value, description, category, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\')) ON CONFLICT(key) DO UPDATE SET value=excluded.value', [ `user:${userId}:timezone`, data.timezone, 'User timezone', 'notifications', userId ]);
    }
    if (data.notificationPreferences !== undefined) {
      await services.db.run('INSERT INTO system_settings (key, value, description, category, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\')) ON CONFLICT(key) DO UPDATE SET value=excluded.value', [ `user:${userId}:notif_prefs`, JSON.stringify(data.notificationPreferences), 'User notification preferences', 'notifications', userId ]);
    }
    await services.logging.audit(userId, 'user.profile_updated', 'user', userId, data, null, null, 'info');
    return c.json({ success: true });
  });

  app.put('/settings/notifications', zValidator('json', z.record(z.string(), z.unknown())), async (c) => {
    const userId = c.get('user')!.id;
    const data = c.req.valid('json');
    await services.db.run('INSERT INTO system_settings (key, value, description, category, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\')) ON CONFLICT(key) DO UPDATE SET value=excluded.value', [ `user:${userId}:notif_prefs`, JSON.stringify(data), 'User notification preferences', 'notifications', userId ]);
    return c.json({ success: true });
  });
}

const IngestSmsQuerySchema = z.object({
  phoneNumber: z.string().min(5),
  sender: z.string().min(1),
  message: z.string().min(1),
  providerId: z.string().optional(),
});

export function registerIngestRoutes(app: ReturnType<typeof createApp>, services: Services): void {
  app.post('/ingest/sms', zValidator('json', IngestSmsQuerySchema), async (c) => {
    const data = c.req.valid('json');
    try {
      const result = await services.ingest.ingestSms(data);
      return c.json(result, 201);
    } catch (e: any) {
      if (e.code === 'NUMBER_NOT_FOUND') return c.json({ type: 'https://iprn.online/problems/not-found', title: 'Not Found', status: 404, detail: e.message }, 404);
      throw e;
    }
  });
}
