import { createApp } from '../middleware';
import { zValidator } from '@hono/zod-validator';
import { RegisterSchema, LoginSchema, RefreshSchema, UpdateProfileSchema } from '@iprn/validators';
import type { Services } from '../services';

export function registerAuthRoutes(app: ReturnType<typeof createApp>, services: Services): void {
  app.post('/register', zValidator('json', RegisterSchema), async (c) => {
    const data = c.req.valid('json');
    try {
      const result = await services.auth.register(data);
      return c.json({ accessToken: result.accessToken, refreshToken: result.refreshToken, user: result.user }, 201);
    } catch (e: any) {
      if (e.code === 'CONFLICT') return c.json({ type: 'https://iprn.online/problems/conflict', title: 'Conflict', status: 409, detail: e.message }, 409);
      throw e;
    }
  });

  app.post('/login', zValidator('json', LoginSchema), async (c) => {
    const data = c.req.valid('json');
    const result = await services.auth.login(data);
    if (!result) return c.json({ type: 'https://iprn.online/problems/unauthorized', title: 'Unauthorized', status: 401, detail: 'Invalid credentials' }, 401);
    return c.json({ accessToken: result.accessToken, refreshToken: result.refreshToken, user: result.user });
  });

  app.post('/logout', async (c) => {
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    if (token) await services.env.SESSION_KV.delete(`sess:${token}`);
    return c.json({ success: true });
  });

  app.post('/refresh', zValidator('json', RefreshSchema), async (c) => {
    const data = c.req.valid('json');
    const result = await services.auth.refresh(data.refreshToken);
    if (!result) return c.json({ type: 'https://iprn.online/problems/unauthorized', title: 'Unauthorized', status: 401, detail: 'Invalid refresh token' }, 401);
    return c.json(result);
  });

  app.get('/me', async (c) => {
    const user = c.get('user');
    if (!user) return c.json({ type: 'https://iprn.online/problems/unauthorized', title: 'Unauthorized', status: 401, detail: 'Not authenticated' }, 401);
    const numberLimit = user.numberLimitOverride ?? (await services.getSetting<number>('default_number_limit'));
    return c.json({
      userId: user.id, displayName: user.displayName, email: user.email,
      timezone: 'UTC', notificationPreferences: {}, numberLimit: Number(numberLimit), apiEnabled: user.apiEnabled,
    });
  });

  app.put('/me', zValidator('json', UpdateProfileSchema), async (c) => {
    const data = c.req.valid('json');
    const user = c.get('user');
    if (!user) return c.json({ type: 'https://iprn.online/problems/unauthorized', title: 'Unauthorized', status: 401, detail: 'Not authenticated' }, 401);
    const updates: string[] = [];
    const params: unknown[] = [];
    if (data.displayName !== undefined) { updates.push('display_name = ?'); params.push(data.displayName); }
    if (data.timezone !== undefined) {
      await services.db.run('INSERT INTO system_settings (key, value, description, category, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\')) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=datetime(\'now\')',
        [ `user:${user.id}:timezone`, data.timezone, 'User timezone', 'notifications', user.id ]);
    }
    if (data.notificationPreferences !== undefined) {
      await services.db.run('INSERT INTO system_settings (key, value, description, category, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\')) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=datetime(\'now\')',
        [ `user:${user.id}:notif_prefs`, JSON.stringify(data.notificationPreferences), 'User notification preferences', 'notifications', user.id ]);
    }
    if (updates.length > 0) {
      params.push(user.id);
      await services.db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    }
    await services.logging.audit(user.id, 'user.profile_updated', 'user', user.id, data, null, null, 'info');
    return c.json({ success: true });
  });
}
