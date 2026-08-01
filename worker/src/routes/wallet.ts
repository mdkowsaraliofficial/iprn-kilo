import { createApp } from '../middleware';
import { zValidator } from '@hono/zod-validator';
import { WalletTransactionsQuerySchema, WithdrawalRequestSchema, WithdrawalListQuerySchema } from '@iprn/validators';
import { okList } from '../lib/helpers';
import type { Services } from '../services';
import { nowIso, uuid } from '../config';

export function registerWalletRoutes(app: ReturnType<typeof createApp>, services: Services): void {
  app.get('/wallet', async (c) => {
    const userId = c.get('user')!.id;
    const balance = await services.wallet.getBalance(userId);
    const withdrawable = services.wallet.getWithdrawableCents(balance);
    return c.json({
      pendingCents: balance.pendingCents,
      approvedCents: balance.approvedCents,
      frozenCents: balance.frozenCents,
      lifetimeEarnedCents: balance.lifetimeEarnedCents,
      lifetimeWithdrawnCents: balance.lifetimeWithdrawnCents,
      withdrawableCents: withdrawable,
      updatedAt: balance.updatedAt,
    });
  });

  app.get('/wallet/transactions', zValidator('query', WalletTransactionsQuerySchema), async (c) => {
    const userId = c.get('user')!.id;
    const q = c.req.valid('query');
    const result = await services.wallet.listTransactions(userId, {
      limit: q.limit, cursor: q.cursor ?? null, type: q.type, from: q.from, to: q.to,
    });
    return okList(c, result.data, {
      total: result.meta.total, nextCursor: result.meta.nextCursor,
      cursor: q.cursor ?? null, limit: q.limit,
      hasNext: !!result.meta.nextCursor, hasPrev: !!q.cursor,
    });
  });

  app.post('/withdrawals', zValidator('json', WithdrawalRequestSchema), async (c) => {
    const userId = c.get('user')!.id;
    const data = c.req.valid('json');
    const minCents = await services.getSetting<number>('min_withdrawal_cents');
    if (data.amountCents < Number(minCents)) {
      return c.json({ type: 'https://iprn.online/problems/bad-request', title: 'Bad Request', status: 400, detail: `Minimum withdrawal is $${Number(minCents) / 100}` }, 400);
    }
    const balance = await services.wallet.getBalance(userId);
    const withdrawable = services.wallet.getWithdrawableCents(balance);
    if (data.amountCents > withdrawable) {
      return c.json({ type: 'https://iprn.online/problems/bad-request', title: 'Bad Request', status: 400, detail: 'Insufficient withdrawable balance' }, 400);
    }
    const { balance: newBal, transaction } = await services.wallet.adjust(
      userId, 'manual_debit', data.amountCents, 'withdrawal_request', `wdr_${uuid()}`, null, null
    );
    await services.db.run(
      'INSERT INTO withdrawal_requests (id, user_id, amount_cents, method, address, status, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [`wdr_${uuid()}`, userId, data.amountCents, data.method, data.address, 'pending', null, nowIso()]
    );
    await services.logging.audit(userId, 'withdrawal.request', 'withdrawal', null, { amountCents: data.amountCents, method: data.method }, null, null, 'info');
    await services.notifications.create(userId, 'info', 'Withdrawal Requested', `Your withdrawal of $${(data.amountCents / 100).toFixed(2)} has been submitted and is pending review.`, { amountCents: data.amountCents });
    return c.json({ success: true, message: 'Withdrawal request submitted', balanceAfterCents: newBal.approvedCents + newBal.pendingCents }, 201);
  });

  app.get('/withdrawals', zValidator('query', WithdrawalListQuerySchema), async (c) => {
    const userId = c.get('user')!.id;
    const q = c.req.valid('query');
    const rows = await services.db.query<{
      id: string; user_id: string; amount_cents: number; method: string; address: string; status: string;
      reviewed_by: string | null; reason: string | null; created_at: string; processed_at: string | null;
    }>(
      `SELECT id, user_id, amount_cents, method, address, status, reviewed_by, reason, created_at, processed_at
       FROM withdrawal_requests WHERE user_id = ? ${q.status ? 'AND status = ?' : ''} ORDER BY created_at DESC LIMIT ?`,
      q.status ? [userId, q.status, q.limit + 1] : [userId, q.limit + 1]
    );
    const limit = Math.min(q.limit, 100);
    const hasNext = rows.length > limit;
    const data = rows.slice(0, limit).map((r) => ({
      id: r.id, userId: r.user_id, amountCents: r.amount_cents, method: r.method as any, address: r.address,
      status: r.status as any, reviewedBy: r.reviewed_by, reason: r.reason, createdAt: r.created_at, processedAt: r.processed_at,
    }));
    return okList(c, data, {
      total: rows.length, nextCursor: hasNext ? (data[data.length - 1]?.createdAt ?? null) : null,
      cursor: q.cursor ?? null, limit, hasNext, hasPrev: !!q.cursor,
    });
  });

  app.get('/withdrawals/:id', async (c) => {
    const userId = c.get('user')!.id;
    const row = await services.db.first<{
      id: string; user_id: string; amount_cents: number; method: string; address: string; status: string;
      reviewed_by: string | null; reason: string | null; created_at: string; processed_at: string | null;
    }>('SELECT * FROM withdrawal_requests WHERE id = ? AND user_id = ?', [c.req.param('id'), userId]);
    if (!row) return c.json({ type: 'https://iprn.online/problems/not-found', title: 'Not Found', status: 404, detail: 'Withdrawal not found' }, 404);
    return c.json({
      id: row.id, userId: row.user_id, amountCents: row.amount_cents, method: row.method, address: row.address,
      status: row.status, reviewedBy: row.reviewed_by, reason: row.reason, createdAt: row.created_at, processedAt: row.processed_at,
    });
  });
}

export function registerRewardsRoutes(app: ReturnType<typeof createApp>, services: Services): void {
  app.get('/rewards', zValidator('query', WalletTransactionsQuerySchema), async (c) => {
    const userId = c.get('user')!.id;
    const q = c.req.valid('query');
    const result = await services.rewards.listUserRewards(userId, {
      limit: q.limit, cursor: q.cursor ?? null, status: q.type as any, from: q.from, to: q.to,
    });
    return okList(c, result.data, {
      total: result.meta.total, nextCursor: result.meta.nextCursor,
      cursor: q.cursor ?? null, limit: q.limit,
      hasNext: !!result.meta.nextCursor, hasPrev: !!q.cursor,
    });
  });

  app.get('/rewards/summary', async (c) => {
    const userId = c.get('user')!.id;
    const summary = await services.rewards.summary(userId);
    return c.json(summary);
  });

  app.get('/transactions', zValidator('query', WalletTransactionsQuerySchema), async (c) => {
    const userId = c.get('user')!.id;
    const q = c.req.valid('query');
    const result = await services.wallet.listTransactions(userId, {
      limit: q.limit, cursor: q.cursor ?? null, type: q.type, from: q.from, to: q.to,
    });
    return okList(c, result.data, {
      total: result.meta.total, nextCursor: result.meta.nextCursor,
      cursor: q.cursor ?? null, limit: q.limit,
      hasNext: !!result.meta.nextCursor, hasPrev: !!q.cursor,
    });
  });

  app.get('/rewards/:id', async (c) => {
    const userId = c.get('user')!.id;
    const row = await services.db.first<{
      id: string; sms_id: string; user_id: string; rule_id: string; base_amount_cents: number;
      country_multiplier: number; operator_multiplier: number; user_tier_multiplier: number;
      final_amount_cents: number; status: string; created_at: string;
    }>('SELECT * FROM reward_events WHERE id = ? AND user_id = ?', [c.req.param('id'), userId]);
    if (!row) return c.json({ type: 'https://iprn.online/problems/not-found', title: 'Not Found', status: 404, detail: 'Reward event not found' }, 404);
    const rule = await services.db.first<{ id: string; level: string; target: string | null; base_amount_cents: number; multiplier: number }>(
      'SELECT id, level, target, base_amount_cents, multiplier FROM reward_rules WHERE id = ?', [row.rule_id]
    );
    return c.json({
      id: row.id, smsId: row.sms_id, userId: row.user_id, ruleId: row.rule_id,
      baseAmountCents: row.base_amount_cents, countryMultiplier: row.country_multiplier,
      operatorMultiplier: row.operator_multiplier, userTierMultiplier: row.user_tier_multiplier,
      finalAmountCents: row.final_amount_cents, status: row.status, createdAt: row.created_at,
      rule: rule ? { id: rule.id, level: rule.level, target: rule.target, baseAmountCents: rule.base_amount_cents, multiplier: rule.multiplier } : null,
    });
  });
}
