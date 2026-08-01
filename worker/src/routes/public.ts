import { createApp } from '../middleware';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { notFound } from '../lib/helpers';
import { nowIso } from '../config';
import type { Services } from '../services';

export function registerPublic(app: ReturnType<typeof createApp>, services: Services): void {
  app.get('/health', async (c) => {
    const checks: Array<{ name: string; status: 'healthy' | 'degraded' | 'down'; latencyMs: number | null; detail: string | null }> = [];

    const t0 = Date.now();
    try {
      await services.db.first<{ a: number }>('SELECT 1 as a');
      checks.push({ name: 'Database (D1)', status: 'healthy', latencyMs: Date.now() - t0, detail: null });
    } catch (e) {
      checks.push({ name: 'Database (D1)', status: 'down', latencyMs: Date.now() - t0, detail: (e as Error).message });
    }

    const t1 = Date.now();
    try {
      await services.cache.get('health:check');
      await services.cache.set('health:check', 'ok');
      checks.push({ name: 'Cache (KV)', status: 'healthy', latencyMs: Date.now() - t1, detail: null });
    } catch (e) {
      checks.push({ name: 'Cache (KV)', status: 'degraded', latencyMs: Date.now() - t1, detail: (e as Error).message });
    }

    const t2 = Date.now();
    try {
      await services.env.ANALYTICS_QUEUE.send({ type: 'health.check' });
      checks.push({ name: 'Analytics Queue', status: 'healthy', latencyMs: Date.now() - t2, detail: null });
    } catch (e) {
      checks.push({ name: 'Analytics Queue', status: 'down', latencyMs: Date.now() - t2, detail: (e as Error).message });
    }

    const overall = checks.every((c) => c.status === 'healthy') ? 'healthy'
      : checks.some((c) => c.status === 'down') ? 'down' : 'degraded';

    return c.json({ status: overall, timestamp: nowIso(), components: checks, version: services.env.APP_VERSION });
  });

  app.get('/countries', zValidator('query', z.object({})), async (c) => {
    const rows = await services.db.query<{ code: string; name: string; active: number; base_reward_multiplier: number }>(
      'SELECT code, name, active, base_reward_multiplier FROM countries WHERE active = 1 ORDER BY name'
    );
    return c.json(rows.map((r) => ({ code: r.code, name: r.name, active: r.active === 1, baseRewardMultiplier: Number(r.base_reward_multiplier) })));
  });

  app.get('/operators/:country', async (c) => {
    const country = c.req.param('country');
    const rows = await services.db.query<{ id: string; country_code: string; name: string; active: number; reward_multiplier: number }>(
      'SELECT id, country_code, name, active, reward_multiplier FROM operators WHERE country_code = ? ORDER BY name',
      [country]
    );
    if (rows.length === 0) {
      const countryExists = await services.db.first<{ code: string }>('SELECT code FROM countries WHERE code = ?', [country]);
      if (!countryExists) return notFound(c, `Country ${country} not found`);
    }
    return c.json(rows.map((r) => ({ id: r.id, countryCode: r.country_code, name: r.name, active: r.active === 1, rewardMultiplier: Number(r.reward_multiplier) })));
  });
}
