import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createApp, requireAdmin } from '../middleware';
import { okList } from '../lib/helpers';
import { nowIso, uuid } from '../config';
import type { Services } from '../services';
import { RewardRuleCreateSchema, ProviderCreateSchema, UserUpdateSchema, WalletAdjustmentSchema, SystemSettingUpdateSchema } from '@iprn/validators';

export function registerAdminRoutes(app: ReturnType<typeof createApp>, services: Services): void {
  app.use('*', requireAdmin);

  app.get('/stats', async (c) => {
    const stats = await services.analytics.getPlatformStats();
    return c.json(stats);
  });

  // ---- Users ----
  app.get('/users', async (c) => {
    const rows = await services.db.query<{
      id: string; email: string; display_name: string; status: string; role: string;
      number_limit_override: number | null; api_enabled: number; tier: string; created_at: string;
    }>('SELECT id, email, display_name, status, role, number_limit_override, api_enabled, tier, created_at FROM users ORDER BY created_at DESC');
    const limit = parseInt(c.req.query('limit') ?? '100', 10);
    const data = rows.slice(0, limit).map((r) => ({
      id: r.id, email: r.email, displayName: r.display_name, status: r.status, role: r.role,
      numberLimitOverride: r.number_limit_override, apiEnabled: r.api_enabled === 1, tier: r.tier, createdAt: r.created_at,
    }));
    return c.json(data);
  });

  app.get('/users/:id', async (c) => {
    const row = await services.db.first<{
      id: string; email: string; display_name: string; status: string; role: string;
      number_limit_override: number | null; api_enabled: number; tier: string; created_at: string;
    }>('SELECT id, email, display_name, status, role, number_limit_override, api_enabled, tier, created_at FROM users WHERE id = ?', [c.req.param('id')]);
    if (!row) return c.json({ type: 'https://iprn.online/problems/not-found', title: 'Not Found', status: 404, detail: 'User not found' }, 404);
    const wallet = await services.wallet.getBalance(row.id);
    const numbers = await services.numbers.getUserNumbers(row.id);
    return c.json({
      id: row.id, email: row.email, displayName: row.display_name, status: row.status, role: row.role,
      numberLimitOverride: row.number_limit_override, apiEnabled: row.api_enabled === 1, tier: row.tier, createdAt: row.created_at,
      wallet, numbers,
    });
  });

  app.put('/users/:id', zValidator('json', UserUpdateSchema), async (c) => {
    const userId = c.req.param('id');
    const data = c.req.valid('json');
    const sets: string[] = [];
    const params: unknown[] = [];
    if (data.displayName !== undefined) { sets.push('display_name = ?'); params.push(data.displayName); }
    if (data.status !== undefined) { sets.push('status = ?'); params.push(data.status); }
    if (data.role !== undefined) { sets.push('role = ?'); params.push(data.role); }
    if (data.numberLimitOverride !== undefined) { sets.push('number_limit_override = ?'); params.push(data.numberLimitOverride); }
    if (data.apiEnabled !== undefined) { sets.push('api_enabled = ?'); params.push(data.apiEnabled ? 1 : 0); }
    if (data.tier !== undefined) { sets.push('tier = ?'); params.push(data.tier); }
    if (sets.length > 0) {
      params.push(userId);
      await services.db.run(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params);
    }
    await services.logging.audit(c.get('user')!.id, 'admin.user_update', 'user', userId, data, null, null, 'warning');
    return c.json({ success: true });
  });

  app.post('/wallet/:userId/adjust', zValidator('json', WalletAdjustmentSchema), async (c) => {
    const data = c.req.valid('json');
    const { balance, transaction } = await services.wallet.adjust(
      c.req.param('userId'), data.type, data.amountCents, data.type, `adj_${uuid()}`, c.get('user')!.id, data.reason
    );
    await services.logging.audit(c.get('user')!.id, `wallet.${data.type}`, 'wallet', c.req.param('userId'), { amountCents: data.amountCents, reason: data.reason }, null, null, 'warning');
    return c.json({ success: true, balanceAfterCents: transaction.balanceAfterCents, approvedCents: balance.approvedCents });
  });

  app.patch('/wallet/:userId/freeze', zValidator('json', z.object({ amountCents: z.number().int(), action: z.enum(['freeze', 'unfreeze']) })), async (c) => {
    const data = c.req.valid('json');
    if (data.action === 'freeze') {
      await services.wallet.freeze(c.req.param('userId'), data.amountCents, 'admin freeze');
    } else {
      await services.wallet.unfreeze(c.req.param('userId'), data.amountCents);
    }
    return c.json({ success: true });
  });

  // ---- Numbers ----
  app.get('/numbers', async (c) => {
    const limit = parseInt(c.req.query('limit') ?? '100', 10);
    const rows = await services.db.query<{
      id: string; e164: string; country_code: string; operator: string; provider_id: string; status: string;
      quality_score: number; notes: string | null; last_sms_at: string | null; created_at: string; assigned_user_id: string | null;
    }>('SELECT * FROM numbers ORDER BY created_at DESC LIMIT ?', [limit]);
    return c.json(rows.map((r) => ({
      id: r.id, e164: r.e164, countryCode: r.country_code, operator: r.operator, providerId: r.provider_id,
      status: r.status, qualityScore: r.quality_score, notes: r.notes, lastSmsAt: r.last_sms_at, createdAt: r.created_at, assignedUserId: r.assigned_user_id,
    })));
  });

  app.post('/numbers', zValidator('json', z.object({
    e164: z.string().min(5), countryCode: z.string().min(2), operator: z.string().min(1),
    providerId: z.string().optional(), qualityScore: z.number().min(0).max(100).optional(),
    notes: z.string().optional(), status: z.enum(['available', 'assigned', 'suspended', 'expired']).optional(),
  })), async (c) => {
    const data = c.req.valid('json');
    const providerId = data.providerId ?? 'manual-pool-001';
    const numberId = `num_${uuid()}`;
    await services.db.run(
      'INSERT INTO numbers (id, e164, country_code, operator, provider_id, status, quality_score, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [numberId, data.e164, data.countryCode, data.operator, providerId, data.status ?? 'available', data.qualityScore ?? 0, data.notes ?? null, nowIso()]
    );
    await services.logging.audit(c.get('user')!.id, 'admin.number_create', 'number', numberId, { e164: data.e164 }, null, null, 'info');
    return c.json({ id: numberId, e164: data.e164, countryCode: data.countryCode, operator: data.operator, status: data.status ?? 'available' }, 201);
  });

  app.post('/numbers/import', async (c) => {
    const contentType = c.req.header('content-type') ?? '';
    if (contentType.includes('multipart/form-data')) {
      const body = await c.req.parseBody();
      const file = body.file as File;
      const csv = await file.text();
      const lines = csv.split('\n').filter((l) => l.trim());
      const imported = { count: 0 };
      const errors: string[] = [];
      for (const line of lines) {
        const [e164, countryCode, operator, providerId] = line.split(',').map((s) => s.trim());
        if (!e164 || !countryCode || !operator) { errors.push(`Invalid line: ${line}`); continue; }
        try {
          await services.db.run(
            'INSERT INTO numbers (id, e164, country_code, operator, provider_id, status, quality_score, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [`num_${uuid()}`, e164, countryCode, operator, providerId ?? 'manual-pool-001', 'available', 0, null, nowIso()]
          );
          imported.count++;
        } catch (e) { errors.push(`${e164}: ${(e as Error).message}`); }
      }
      return c.json({ imported: imported.count, errors });
    }
    const data = await c.req.json<{ numbers: Array<{ e164: string; countryCode: string; operator: string; providerId?: string; qualityScore?: number; notes?: string }> }>();
    const nums = data.numbers.map((n) => ({ e164: n.e164, countryCode: n.countryCode, operator: n.operator, providerId: n.providerId ?? 'manual-pool-001', qualityScore: n.qualityScore, notes: n.notes }));
    const result = await services.numbers.importNumbers(nums);
    return c.json(result);
  });

  app.put('/numbers/:id', async (c) => {
    const data = await c.req.json<{ status?: string; notes?: string; qualityScore?: number; assignedUserId?: string }>();
    const sets: string[] = [];
    const params: unknown[] = [];
    if (data.status) { sets.push('status = ?'); params.push(data.status); }
    if (data.notes !== undefined) { sets.push('notes = ?'); params.push(data.notes); }
    if (data.qualityScore !== undefined) { sets.push('quality_score = ?'); params.push(data.qualityScore); }
    if (data.assignedUserId !== undefined) { sets.push('assigned_user_id = ?'); params.push(data.assignedUserId); }
    if (sets.length === 0) return c.json({ success: true });
    params.push(c.req.param('id'));
    await services.db.run(`UPDATE numbers SET ${sets.join(', ')} WHERE id = ?`, params);
    return c.json({ success: true });
  });

  app.delete('/numbers/:id', async (c) => {
    await services.db.run('DELETE FROM numbers WHERE id = ?', [c.req.param('id')]);
    return c.json({ success: true });
  });

  // ---- Reward Rules ----
  app.get('/reward-rules', zValidator('query', z.object({ limit: z.coerce.number().int().max(1000).default(1000) })), async (c) => {
    const rows = await services.db.query<{
      id: string; level: string; target: string | null; base_amount_cents: number; multiplier: number;
      priority: number; active: number; valid_from: string | null; valid_to: string | null; notes: string | null;
      created_at: string; updated_at: string;
    }>('SELECT * FROM reward_rules ORDER BY level, priority DESC, active DESC');
    return c.json(rows.map((r) => ({
      id: r.id, level: r.level, target: r.target, baseAmountCents: r.base_amount_cents, multiplier: r.multiplier,
      priority: r.priority, active: r.active === 1, validFrom: r.valid_from, validTo: r.valid_to, notes: r.notes,
      createdAt: r.created_at, updatedAt: r.updated_at,
    })));
  });

  app.post('/reward-rules', zValidator('json', RewardRuleCreateSchema), async (c) => {
    const data = c.req.valid('json');
    const id = `rule_${uuid()}`;
    await services.db.run(
      'INSERT INTO reward_rules (id, level, target, base_amount_cents, multiplier, priority, active, valid_from, valid_to, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, data.level, data.target, data.baseAmountCents, data.multiplier, data.priority, data.active ? 1 : 0, data.validFrom ?? null, data.validTo ?? null, data.notes ?? null, nowIso(), nowIso()]
    );
    await services.rewards.invalidateRulesCache();
    await services.logging.audit(c.get('user')!.id, 'reward_rule.create', 'reward_rule', id, data, null, null, 'info');
    return c.json({ id }, 201);
  });

  app.put('/reward-rules/:id', zValidator('json', RewardRuleCreateSchema.partial()), async (c) => {
    const data = c.req.valid('json');
    const sets: string[] = [];
    const params: unknown[] = [];
    if (data.level !== undefined) { sets.push('level = ?'); params.push(data.level); }
    if (data.target !== undefined) { sets.push('target = ?'); params.push(data.target); }
    if (data.baseAmountCents !== undefined) { sets.push('base_amount_cents = ?'); params.push(data.baseAmountCents); }
    if (data.multiplier !== undefined) { sets.push('multiplier = ?'); params.push(data.multiplier); }
    if (data.priority !== undefined) { sets.push('priority = ?'); params.push(data.priority); }
    if (data.active !== undefined) { sets.push('active = ?'); params.push(data.active ? 1 : 0); }
    if (data.validFrom !== undefined) { sets.push('valid_from = ?'); params.push(data.validFrom); }
    if (data.validTo !== undefined) { sets.push('valid_to = ?'); params.push(data.validTo); }
    if (data.notes !== undefined) { sets.push('notes = ?'); params.push(data.notes); }
    if (sets.length > 0) {
      params.push(nowIso(), c.req.param('id'));
      await services.db.run(`UPDATE reward_rules SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`, params);
      await services.rewards.invalidateRulesCache();
    }
    return c.json({ success: true });
  });

  app.delete('/reward-rules/:id', async (c) => {
    await services.db.run('DELETE FROM reward_rules WHERE id = ?', [c.req.param('id')]);
    await services.rewards.invalidateRulesCache();
    return c.json({ success: true });
  });

  // ---- Countries ----
  app.get('/countries', async (c) => {
    const rows = await services.db.query<{ id: string; code: string; name: string; active: number; base_reward_multiplier: number }>(
      'SELECT id, code, name, active, base_reward_multiplier FROM countries ORDER BY name'
    );
    return c.json(rows.map((r) => ({ id: r.id, code: r.code, name: r.name, active: r.active === 1, baseRewardMultiplier: Number(r.base_reward_multiplier) })));
  });

  app.put('/countries/:code', zValidator('json', z.object({ name: z.string().optional(), active: z.boolean().optional(), baseRewardMultiplier: z.number().positive().optional() })), async (c) => {
    const data = c.req.valid('json');
    const sets: string[] = [];
    const params: unknown[] = [];
    if (data.name !== undefined) { sets.push('name = ?'); params.push(data.name); }
    if (data.active !== undefined) { sets.push('active = ?'); params.push(data.active ? 1 : 0); }
    if (data.baseRewardMultiplier !== undefined) { sets.push('base_reward_multiplier = ?'); params.push(data.baseRewardMultiplier); }
    params.push(c.req.param('code'));
    await services.db.run(`UPDATE countries SET ${sets.join(', ')} WHERE code = ?`, params);
    return c.json({ success: true });
  });

  // ---- Operators ----
  app.get('/operators', async (c) => {
    const rows = await services.db.query<{ id: string; country_code: string; name: string; active: number; reward_multiplier: number }>(
      'SELECT * FROM operators ORDER BY country_code, name'
    );
    return c.json(rows.map((r) => ({ id: r.id, countryCode: r.country_code, name: r.name, active: r.active === 1, rewardMultiplier: Number(r.reward_multiplier) })));
  });

  app.post('/operators', zValidator('json', z.object({ countryCode: z.string().min(2), name: z.string().min(1), active: z.boolean().optional(), rewardMultiplier: z.number().positive().optional() })), async (c) => {
    const data = c.req.valid('json');
    await services.db.run(
      'INSERT INTO operators (id, country_code, name, active, reward_multiplier) VALUES (?, ?, ?, ?, ?)',
      [`op_${uuid()}`, data.countryCode, data.name, data.active ? 1 : 0, data.rewardMultiplier ?? 1]
    );
    return c.json({ success: true }, 201);
  });

  app.put('/operators/:id', zValidator('json', z.object({ name: z.string().min(1).optional(), active: z.boolean().optional(), rewardMultiplier: z.number().positive().optional() })), async (c) => {
    const data = c.req.valid('json');
    const sets: string[] = [];
    const params: unknown[] = [];
    if (data.name !== undefined) { sets.push('name = ?'); params.push(data.name); }
    if (data.active !== undefined) { sets.push('active = ?'); params.push(data.active ? 1 : 0); }
    if (data.rewardMultiplier !== undefined) { sets.push('reward_multiplier = ?'); params.push(data.rewardMultiplier); }
    params.push(c.req.param('id'));
    await services.db.run(`UPDATE operators SET ${sets.join(', ')} WHERE id = ?`, params);
    return c.json({ success: true });
  });

  // ---- Providers ----
  app.get('/providers', async (c) => {
    const providers = await services.providers.list();
    return c.json(providers);
  });

  app.post('/providers', zValidator('json', ProviderCreateSchema), async (c) => {
    const data = c.req.valid('json');
    const provider = await services.providers.create(data);
    return c.json(provider, 201);
  });

  app.put('/providers/:id', zValidator('json', ProviderCreateSchema.partial()), async (c) => {
    const data = c.req.valid('json');
    const updated = await services.providers.update(c.req.param('id'), data);
    if (!updated) return c.json({ type: 'https://iprn.online/problems/not-found', title: 'Not Found', status: 404, detail: 'Provider not found' }, 404);
    return c.json(updated);
  });

  // ---- Withdrawals ----
  app.get('/withdrawals', async (c) => {
    const limit = parseInt(c.req.query('limit') ?? '100', 10);
    const status = c.req.query('status');
    const wheres: string[] = [];
    const params: unknown[] = [];
    if (status) { wheres.push('status = ?'); params.push(status); }
    const where = wheres.length ? 'WHERE ' + wheres.join(' AND ') : '';
    const rows = await services.db.query<{
      id: string; user_id: string; amount_cents: number; method: string; address: string; status: string;
      reason: string | null; reviewed_by: string | null; created_at: string; processed_at: string | null;
    }>(`SELECT id, user_id, amount_cents, method, address, status, reason, reviewed_by, created_at, processed_at FROM withdrawal_requests ${where} ORDER BY created_at DESC LIMIT ?`, [...params, limit]);
    return c.json(rows.map((r) => ({
      id: r.id, userId: r.user_id, amountCents: r.amount_cents, method: r.method, address: r.address,
      status: r.status, reason: r.reason, reviewedBy: r.reviewed_by, createdAt: r.created_at, processedAt: r.processed_at,
    })));
  });

  app.post('/withdrawals/:id/review', zValidator('json', z.object({ status: z.enum(['pending', 'processing', 'approved', 'rejected', 'completed']), reason: z.string().optional() })), async (c) => {
    const data = c.req.valid('json');
    const id = c.req.param('id');
    const row = await services.db.first<{ user_id: string; amount_cents: number; status: string }>(
      'SELECT user_id, amount_cents, status FROM withdrawal_requests WHERE id = ?', [id]
    );
    if (!row) return c.json({ type: 'https://iprn.online/problems/not-found', title: 'Not Found', status: 404, detail: 'Withdrawal not found' }, 404);
    const now = nowIso();
    await services.db.run(
      'UPDATE withdrawal_requests SET status = ?, reason = ?, reviewed_by = ?, processed_at = ? WHERE id = ?',
      [data.status, data.reason ?? null, c.get('user')!.id, now, id]
    );
    if (data.status === 'approved' || data.status === 'completed') {
      await services.notifications.create(row.user_id, 'success', 'Withdrawal Approved', `Your withdrawal of $${(row.amount_cents / 100).toFixed(2)} has been approved.`, { withdrawalId: id });
      await services.webhooks.queueDelivery(row.user_id, 'withdrawal.approved', { type: 'withdrawal.approved', userId: row.user_id, withdrawalId: id, status: data.status, amountCents: row.amount_cents });
    } else if (data.status === 'rejected') {
      await services.notifications.create(row.user_id, 'error', 'Withdrawal Rejected', `Your withdrawal of $${(row.amount_cents / 100).toFixed(2)} was rejected.`, { withdrawalId: id });
      await services.webhooks.queueDelivery(row.user_id, 'withdrawal.rejected', { type: 'withdrawal.rejected', userId: row.user_id, withdrawalId: id, status: data.status, amountCents: row.amount_cents });
    }
    await services.logging.audit(c.get('user')!.id, 'withdrawal.review', 'withdrawal', id, { status: data.status, reason: data.reason }, null, null, 'warning');
    return c.json({ success: true });
  });

  // ---- Webhooks (platform-wide) ----
  app.get('/webhooks', async (c) => {
    const rows = await services.db.query<{ id: string; user_id: string; url: string; events: string; created_at: string }>(
      'SELECT id, user_id, url, events, created_at FROM webhooks ORDER BY created_at DESC'
    );
    return c.json(rows.map((r) => ({ id: r.id, userId: r.user_id, url: r.url, events: JSON.parse(r.events), createdAt: r.created_at })));
  });

  app.get('/webhook-deliveries', async (c) => {
    const limit = parseInt(c.req.query('limit') ?? '100', 10);
    const rows = await services.db.query<{
      id: string; user_id: string; event_type: string; url: string; status: string; attempts: number;
      last_attempt_at: string | null; response_status: number | null; created_at: string;
    }>('SELECT id, user_id, event_type, url, status, attempts, last_attempt_at, response_status, created_at FROM webhook_deliveries ORDER BY created_at DESC LIMIT ?', [limit]);
    return c.json(rows.map((r) => ({
      id: r.id, userId: r.user_id, eventType: r.event_type, url: r.url, status: r.status,
      attempts: r.attempts, lastAttemptAt: r.last_attempt_at, responseStatus: r.response_status, createdAt: r.created_at,
    })));
  });

  // ---- API Keys (platform-wide) ----
  app.get('/api-keys', async (c) => {
    const rows = await services.db.query<{ id: string; user_id: string; key_prefix: string; last_used_at: string | null; created_at: string; status: string }>(
      'SELECT id, user_id, key_prefix, last_used_at, created_at FROM api_keys ORDER BY created_at DESC'
    );
    return c.json(rows.map((r) => ({ id: r.id, userId: r.user_id, keyPrefix: r.key_prefix, lastUsedAt: r.last_used_at, createdAt: r.created_at })));
  });

  app.delete('/api-keys/:id', async (c) => {
    await services.db.run('DELETE FROM api_keys WHERE id = ?', [c.req.param('id')]);
    return c.json({ success: true });
  });

  app.patch('/api-keys/:id', zValidator('json', z.object({ rateLimitOverride: z.number().int().positive().nullable().optional(), revoked: z.boolean().optional() })), async (c) => {
    const data = c.req.valid('json');
    if (data.rateLimitOverride !== undefined) {
      await services.db.run('UPDATE api_keys SET rate_limit_override = ? WHERE id = ?', [data.rateLimitOverride, c.req.param('id')]);
    }
    return c.json({ success: true });
  });

  // ---- Audit System Logs ----
  app.get('/audit-logs', zValidator('query', z.object({
    limit: z.coerce.number().int().min(1).max(500).default(100),
    severity: z.enum(['info', 'warning', 'critical']).optional(),
    action: z.string().optional(),
    userId: z.string().optional(),
  })), async (c) => {
    const q = c.req.valid('query');
    const wheres: string[] = [];
    const params: unknown[] = [];
    if (q.severity) { wheres.push('severity = ?'); params.push(q.severity); }
    if (q.action) { wheres.push('action = ?'); params.push(q.action); }
    if (q.userId) { wheres.push('user_id = ?'); params.push(q.userId); }
    const where = wheres.length ? 'WHERE ' + wheres.join(' AND ') : '';
    const rows = await services.db.query<{
      id: string; user_id: string | null; action: string; resource_type: string; resource_id: string | null;
      changes: string | null; ip: string | null; user_agent: string | null; severity: string; created_at: string;
    }>(`SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT ?`, [...params, q.limit]);
    return c.json(rows.map((r) => ({
      id: r.id, userId: r.user_id, action: r.action, resourceType: r.resource_type, resourceId: r.resource_id,
      changes: r.changes ? JSON.parse(r.changes) : null, ip: r.ip, userAgent: r.user_agent, severity: r.severity as any, createdAt: r.created_at,
    })));
  });

  app.get('/system-logs', zValidator('query', z.object({
    limit: z.coerce.number().int().min(1).max(500).default(100),
    level: z.enum(['debug', 'info', 'warn', 'error']).optional(),
    category: z.string().optional(),
  })), async (c) => {
    const q = c.req.valid('query');
    const wheres: string[] = [];
    const params: unknown[] = [];
    if (q.level) { wheres.push('level = ?'); params.push(q.level); }
    if (q.category) { wheres.push('category = ?'); params.push(q.category); }
    const where = wheres.length ? 'WHERE ' + wheres.join(' AND ') : '';
    const rows = await services.db.query<{ id: string; level: string; category: string; message: string; context: string | null; created_at: string }>(
      `SELECT * FROM system_logs ${where} ORDER BY created_at DESC LIMIT ?`, [...params, q.limit]
    );
    return c.json(rows.map((r) => ({ id: r.id, level: r.level, category: r.category, message: r.message, context: r.context ? JSON.parse(r.context) : null, createdAt: r.created_at })));
  });

  // ---- System Settings ----
  app.get('/system-settings', async (c) => {
    const rows = await services.db.query<{ key: string; value: string; description: string | null; category: string; updated_by: string | null; updated_at: string }>(
      'SELECT key, value, description, category, updated_by, updated_at FROM system_settings ORDER BY category, key'
    );
    return c.json(rows.map((r) => ({
      key: r.key, value: r.value, description: r.description, category: r.category,
      updatedBy: r.updated_by, updatedAt: r.updated_at,
    })));
  });

  app.put('/system-settings/:key', zValidator('json', SystemSettingUpdateSchema), async (c) => {
    const data = c.req.valid('json');
    await services.settings.set(c.req.param('key'), data.value, data.description, data.category, c.get('user')!.id);
    return c.json({ success: true });
  });

  // ---- Platform Notification ----
  app.post('/notifications/send', zValidator('json', z.object({ type: z.string(), title: z.string(), body: z.string(), userIds: z.array(z.string()).optional(), data: z.record(z.string(), z.unknown()).optional() })), async (c) => {
    const data = c.req.valid('json');
    const sent = await services.notifications.sendToUsers({ type: data.type, title: data.title, body: data.body, userIds: data.userIds, eventData: data.data });
    return c.json({ sent });
  });
}
