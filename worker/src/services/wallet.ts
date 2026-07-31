import type { Db } from '../db';
import type { Env, WalletBalance, WalletTransaction, WalletTransactionType } from '../config';
import { uuid, nowIso } from '../config';
import type { SettingsService } from './settings';
import type { LoggingService } from './logging';

export class WalletService {
  constructor(
    private db: Db,
    private env: Env,
    private settings: SettingsService,
    private logging: LoggingService
  ) {}

  async getBalance(userId: string): Promise<WalletBalance> {
    const row = await this.db.first<{
      pending_cents: number; approved_cents: number; frozen_cents: number;
      lifetime_earned_cents: number; lifetime_withdrawn_cents: number; updated_at: string;
    }>('SELECT pending_cents, approved_cents, frozen_cents, lifetime_earned_cents, lifetime_withdrawn_cents, updated_at FROM wallet_balances WHERE user_id = ?', [userId]);
    if (!row) {
      await this.db.run(
        'INSERT INTO wallet_balances (user_id, pending_cents, approved_cents, frozen_cents, lifetime_earned_cents, lifetime_withdrawn_cents, updated_at) VALUES (?, 0, 0, 0, 0, 0, ?)',
        [userId, nowIso()]
      );
      return {
        userId, pendingCents: 0, approvedCents: 0, frozenCents: 0,
        lifetimeEarnedCents: 0, lifetimeWithdrawnCents: 0, updatedAt: nowIso(),
      };
    }
    return {
      userId,
      pendingCents: Number(row.pending_cents),
      approvedCents: Number(row.approved_cents),
      frozenCents: Number(row.frozen_cents),
      lifetimeEarnedCents: Number(row.lifetime_earned_cents),
      lifetimeWithdrawnCents: Number(row.lifetime_withdrawn_cents),
      updatedAt: row.updated_at,
    };
  }

  getWithdrawableCents(balance: WalletBalance): number {
    return balance.approvedCents;
  }

  async adjust(
    userId: string,
    type: 'manual_credit' | 'manual_debit',
    amountCents: number,
    sourceType: string | null,
    sourceId: string | null,
    performedByUserId: string | null,
    reason: string | null
  ): Promise<{ balance: WalletBalance; transaction: WalletTransaction }> {
    return this.db.tx(async (tx) => {
      const balance = await tx.first<{
        pending_cents: number; approved_cents: number; frozen_cents: number;
        lifetime_earned_cents: number; lifetime_withdrawn_cents: number;
      }>('SELECT pending_cents, approved_cents, frozen_cents, lifetime_earned_cents, lifetime_withdrawn_cents FROM wallet_balances WHERE user_id = ?', [userId]);

      let pending = balance ? Number(balance.pending_cents) : 0;
      let approved = balance ? Number(balance.approved_cents) : 0;
      let frozen = balance ? Number(balance.frozen_cents) : 0;
      let lifetimeEarned = balance ? Number(balance.lifetime_earned_cents) : 0;
      let lifetimeWithdrawn = balance ? Number(balance.lifetime_withdrawn_cents) : 0;

      if (type === 'manual_credit') {
        approved += amountCents;
        lifetimeEarned += amountCents;
      } else {
        const available = approved + pending;
        if (amountCents > available + frozen) {
          throw new Error('Insufficient balance');
        }
        if (amountCents <= approved) {
          approved -= amountCents;
        } else {
          const remaining = amountCents - approved;
          approved = 0;
          pending = Math.max(0, pending - remaining);
        }
        lifetimeWithdrawn += amountCents;
      }

      const balanceAfterCents = approved + pending + frozen;
      const txId = `tx_${uuid()}`;
      const now = nowIso();

      if (!balance) {
        await tx.run(
          'INSERT INTO wallet_balances (user_id, pending_cents, approved_cents, frozen_cents, lifetime_earned_cents, lifetime_withdrawn_cents, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [userId, pending, approved, frozen, lifetimeEarned, lifetimeWithdrawn, now]
        );
      } else {
        await tx.run(
          'UPDATE wallet_balances SET pending_cents = ?, approved_cents = ?, frozen_cents = ?, lifetime_earned_cents = ?, lifetime_withdrawn_cents = ?, updated_at = ? WHERE user_id = ?',
          [pending, approved, frozen, lifetimeEarned, lifetimeWithdrawn, now, userId]
        );
      }

      await tx.run(
        'INSERT INTO wallet_transactions (id, user_id, type, amount_cents, balance_after_cents, source_type, source_id, performed_by_user_id, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [txId, userId, type, amountCents, balanceAfterCents, sourceType, sourceId, performedByUserId, reason, now]
      );

      const newBalance: WalletBalance = {
        userId, pendingCents: pending, approvedCents: approved, frozenCents: frozen,
        lifetimeEarnedCents: lifetimeEarned, lifetimeWithdrawnCents: lifetimeWithdrawn, updatedAt: now,
      };
      const transaction: WalletTransaction = {
        id: txId, userId, type: type as WalletTransactionType, amountCents, balanceAfterCents,
        sourceType, sourceId, performedByUserId, reason, createdAt: now,
      };

      return { balance: newBalance, transaction };
    });
  }

  async creditReward(userId: string, amountCents: number, rewardEventId: string): Promise<{ balance: WalletBalance; transaction: WalletTransaction }> {
    const autoApprove = await this.settings.get<number>('reward_auto_approve');
    return this.db.tx(async (tx) => {
      const balance = await tx.first<{
        pending_cents: number; approved_cents: number; frozen_cents: number;
        lifetime_earned_cents: number; lifetime_withdrawn_cents: number;
      }>('SELECT pending_cents, approved_cents, frozen_cents, lifetime_earned_cents, lifetime_withdrawn_cents FROM wallet_balances WHERE user_id = ?', [userId]);

      let pending = balance ? Number(balance.pending_cents) : 0;
      let approved = balance ? Number(balance.approved_cents) : 0;
      let frozen = balance ? Number(balance.frozen_cents) : 0;
      let lifetimeEarned = balance ? Number(balance.lifetime_earned_cents) : 0;
      let lifetimeWithdrawn = balance ? Number(balance.lifetime_withdrawn_cents) : 0;

      if (Number(autoApprove) === 1) {
        approved += amountCents;
      } else {
        pending += amountCents;
      }
      lifetimeEarned += amountCents;

      const now = nowIso();
      if (!balance) {
        await tx.run(
          'INSERT INTO wallet_balances (user_id, pending_cents, approved_cents, frozen_cents, lifetime_earned_cents, lifetime_withdrawn_cents, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [userId, pending, approved, frozen, lifetimeEarned, lifetimeWithdrawn, now]
        );
      } else {
        await tx.run(
          'UPDATE wallet_balances SET pending_cents = ?, approved_cents = ?, frozen_cents = ?, lifetime_earned_cents = ?, lifetime_withdrawn_cents = ?, updated_at = ? WHERE user_id = ?',
          [pending, approved, frozen, lifetimeEarned, lifetimeWithdrawn, now, userId]
        );
      }

      const txId = `tx_${uuid()}`;
      const balanceAfterCents = approved + pending + frozen;
      await tx.run(
        'INSERT INTO wallet_transactions (id, user_id, type, amount_cents, balance_after_cents, source_type, source_id, performed_by_user_id, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [txId, userId, 'reward', amountCents, balanceAfterCents, 'reward_event', rewardEventId, null, null, now]
      );

      return {
        balance: { userId, pendingCents: pending, approvedCents: approved, frozenCents: frozen, lifetimeEarnedCents: lifetimeEarned, lifetimeWithdrawnCents: lifetimeWithdrawn, updatedAt: now },
        transaction: { id: txId, userId, type: 'reward', amountCents, balanceAfterCents, sourceType: 'reward_event', sourceId: rewardEventId, performedByUserId: null, reason: null, createdAt: now },
      };
    });
  }

  async listTransactions(userId: string, opts: {
    limit?: number; cursor?: string | null; type?: WalletTransactionType; from?: string; to?: string; sortDir?: 'asc' | 'desc';
  }): Promise<{ data: WalletTransaction[]; meta: { total: number; nextCursor: string | null } }> {
    const limit = Math.min(opts.limit ?? 25, 100);
    const wheres: string[] = ['user_id = ?'];
    const params: unknown[] = [userId];
    if (opts.type) { wheres.push('type = ?'); params.push(opts.type); }
    if (opts.from) { wheres.push('created_at >= ?'); params.push(opts.from); }
    if (opts.to) { wheres.push('created_at <= ?'); params.push(opts.to); }
    if (opts.cursor) { wheres.push('created_at < ?'); params.push(opts.cursor); }

    const whereClause = wheres.join(' AND ');
    const totalRes = await this.db.first<{ c: number }>('SELECT COUNT(*) as c FROM wallet_transactions WHERE ' + whereClause, params);
    const total = totalRes ? Number(totalRes.c) : 0;
    const rows = await this.db.query<{
      id: string; user_id: string; type: string; amount_cents: number; balance_after_cents: number;
      source_type: string | null; source_id: string | null; performed_by_user_id: string | null; reason: string | null; created_at: string;
    }>(
      `SELECT id, user_id, type, amount_cents, balance_after_cents, source_type, source_id, performed_by_user_id, reason, created_at
       FROM wallet_transactions WHERE ${whereClause} ORDER BY created_at DESC LIMIT ?`,
      [...params, limit + 1]
    );
    const hasNext = rows.length > limit;
    const data = rows.slice(0, limit);
    const nextCursor = hasNext ? (data[data.length - 1]?.created_at ?? null) : null;
    const formatted: WalletTransaction[] = data.map((r) => ({
      id: r.id, userId: r.user_id, type: r.type as WalletTransactionType, amountCents: r.amount_cents,
      balanceAfterCents: r.balance_after_cents, sourceType: r.source_type, sourceId: r.source_id,
      performedByUserId: r.performed_by_user_id, reason: r.reason, createdAt: r.created_at,
    }));
    return { data: formatted, meta: { total, nextCursor } };
  }

  async freeze(userId: string, amountCents: number, reason: string): Promise<void> {
    await this.db.run('UPDATE wallet_balances SET frozen_cents = frozen_cents + ?, approved_cents = approved_cents - ?, updated_at = datetime(\'now\') WHERE user_id = ? AND approved_cents >= ?', [amountCents, amountCents, userId, amountCents]);
  }

  async unfreeze(userId: string, amountCents: number): Promise<void> {
    await this.db.run('UPDATE wallet_balances SET frozen_cents = frozen_cents - ?, approved_cents = approved_cents + ?, updated_at = datetime(\'now\') WHERE user_id = ? AND frozen_cents >= ?', [amountCents, amountCents, userId, amountCents]);
  }
}
