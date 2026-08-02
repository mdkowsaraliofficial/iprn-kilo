import type { Db } from '../db';
import type { Env } from '../config';
import { uuid, nowIso } from '../config';
import { evaluateReward } from '@iprn/reward-engine';
import type { RewardRule, RewardEvent, UserTier } from '@iprn/types';
import type { WalletService } from './wallet';
import type { LoggingService, CacheService } from './logging';
import type { SettingsService } from './settings';

const RULES_CACHE_KEY = 'iprn:reward_rules';
const RULES_CACHE_TTL = 30;

export class RewardsService {
  constructor(
    private db: Db,
    private env: Env,
    private logging: LoggingService,
    private cache: CacheService,
    private wallet: WalletService,
    private settings: SettingsService
  ) {}

  private async loadRules(): Promise<RewardRule[]> {
    const cached = await this.cache.get<RewardRule[]>(RULES_CACHE_KEY);
    if (cached) return cached;

    const rows = await this.db.query<{
      id: string; level: string; target: string | null; base_amount_cents: number; multiplier: number;
      priority: number; active: number; valid_from: string | null; valid_to: string | null; notes: string | null;
      created_at: string; updated_at: string;
    }>('SELECT id, level, target, base_amount_cents, multiplier, priority, active, valid_from, valid_to, notes, created_at, updated_at FROM reward_rules ORDER BY level, priority DESC');

    const rules: RewardRule[] = rows.map((r) => ({
      id: r.id,
      level: r.level as RewardRule['level'],
      target: r.target,
      baseAmountCents: r.base_amount_cents,
      multiplier: r.multiplier,
      priority: r.priority,
      active: r.active === 1,
      validFrom: r.valid_from,
      validTo: r.valid_to,
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    await this.cache.set(RULES_CACHE_KEY, rules, RULES_CACHE_TTL);
    return rules;
  }

  async invalidateRulesCache(): Promise<void> {
    await this.cache.delete(RULES_CACHE_KEY);
  }

  private async getCountryMultiplier(countryCode: string): Promise<number> {
    const key = `iprn:country_mult:${countryCode}`;
    const cached = await this.cache.get<number>(key);
    if (cached !== null) return cached;
    const row = await this.db.first<{ base_reward_multiplier: number }>(
      'SELECT base_reward_multiplier FROM countries WHERE code = ?',
      [countryCode]
    );
    const mult = row ? Number(row.base_reward_multiplier) : 1;
    await this.cache.set(key, mult, 30);
    return mult;
  }

  private async getOperatorMultiplier(countryCode: string, operator: string): Promise<number> {
    const key = `iprn:operator_mult:${countryCode}:${operator}`;
    const cached = await this.cache.get<number>(key);
    if (cached !== null) return cached;
    const row = await this.db.first<{ reward_multiplier: number }>(
      'SELECT reward_multiplier FROM operators WHERE country_code = ? AND name = ?',
      [countryCode, operator]
    );
    const mult = row ? Number(row.reward_multiplier) : 1;
    await this.cache.set(key, mult, 30);
    return mult;
  }

  private async getUserTier(userId: string): Promise<UserTier> {
    const row = await this.db.first<{ tier: string }>('SELECT tier FROM users WHERE id = ?', [userId]);
    return (row?.tier ?? 'bronze') as UserTier;
  }

  async processSmsReward(sms: {
    id: string;
    numberId: string;
    userId: string;
    country: string;
    operator: string;
    providerId: string;
    extractedOtp: string | null;
  }): Promise<RewardEvent | null> {
    const rules = await this.loadRules();
    const [countryMult, operatorMult, tier] = await Promise.all([
      this.getCountryMultiplier(sms.country),
      this.getOperatorMultiplier(sms.country, sms.operator),
      this.getUserTier(sms.userId),
    ]);

    const result = evaluateReward(rules, {
      numberId: sms.numberId,
      providerId: sms.providerId,
      countryCode: sms.country,
      operator: sms.operator,
      isOtp: sms.extractedOtp !== null,
      hasOtp: sms.extractedOtp !== null,
      userTier: tier,
      countryMultiplier: countryMult,
      operatorMultiplier: operatorMult,
    });

    if (!result) {
      this.logging.warn('rewards', 'No matching reward rule', { smsId: sms.id });
      return null;
    }

    const eventId = `rev_${uuid()}`;
    const now = nowIso();
    const autoApprove = await this.settings.get<number>('reward_auto_approve');
    const status: RewardEvent['status'] = Number(autoApprove ?? 1) === 1 ? 'approved' : 'pending';

    await this.db.run(
      `INSERT INTO reward_events (id, sms_id, user_id, rule_id, base_amount_cents, country_multiplier, operator_multiplier, user_tier_multiplier, final_amount_cents, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [eventId, sms.id, sms.userId, result.rule.id, result.baseAmountCents,
        result.countryMultiplier, result.operatorMultiplier, result.userTierMultiplier,
        result.finalAmountCents, status, now]
    );

    await this.wallet.creditReward(sms.userId, result.finalAmountCents, eventId);

    await this.db.run('UPDATE sms_messages SET reward_event_id = ?, status = ? WHERE id = ?', [eventId, 'processed', sms.id]);

    this.logging.info('rewards', 'Reward credited', {
      smsId: sms.id, userId: sms.userId, amountCents: result.finalAmountCents, ruleId: result.rule.id, eventId,
    });

    const event: RewardEvent = {
      id: eventId,
      smsId: sms.id,
      userId: sms.userId,
      ruleId: result.rule.id,
      baseAmountCents: result.baseAmountCents,
      countryMultiplier: result.countryMultiplier,
      operatorMultiplier: result.operatorMultiplier,
      userTierMultiplier: result.userTierMultiplier,
      finalAmountCents: result.finalAmountCents,
      status,
      createdAt: now,
    };
    return event;
  }

  async listUserRewards(userId: string, opts: {
    limit?: number; cursor?: string | null; status?: RewardEvent['status']; country?: string; operator?: string; from?: string; to?: string; sortDir?: 'asc' | 'desc';
  }): Promise<{ data: RewardEvent[]; meta: { total: number; nextCursor: string | null } }> {
    const limit = Math.min(opts.limit ?? 25, 100);
    const wheres: string[] = ['user_id = ?'];
    const params: unknown[] = [userId];
    if (opts.status) { wheres.push('status = ?'); params.push(opts.status); }
    if (opts.from) { wheres.push('created_at >= ?'); params.push(opts.from); }
    if (opts.to) { wheres.push('created_at <= ?'); params.push(opts.to); }
    if (opts.cursor) { wheres.push('created_at < ?'); params.push(opts.cursor); }

    const whereClause = wheres.join(' AND ');
    const totalRes = await this.db.first<{ c: number }>('SELECT COUNT(*) as c FROM reward_events WHERE ' + whereClause, params);
    const total = totalRes ? Number(totalRes.c) : 0;
    const rows = await this.db.query<{
      id: string; sms_id: string; user_id: string; rule_id: string; base_amount_cents: number;
      country_multiplier: number; operator_multiplier: number; user_tier_multiplier: number;
      final_amount_cents: number; status: string; created_at: string;
    }>(
      `SELECT id, sms_id, user_id, rule_id, base_amount_cents, country_multiplier, operator_multiplier, user_tier_multiplier, final_amount_cents, status, created_at
       FROM reward_events WHERE ${whereClause} ORDER BY created_at DESC LIMIT ?`,
      [...params, limit + 1]
    );
    const hasNext = rows.length > limit;
    const data = rows.slice(0, limit);
    const nextCursor = hasNext ? (data[data.length - 1]?.created_at ?? null) : null;
    const formatted: RewardEvent[] = data.map((r) => ({
      id: r.id,
      smsId: r.sms_id,
      userId: r.user_id,
      ruleId: r.rule_id,
      baseAmountCents: r.base_amount_cents,
      countryMultiplier: r.country_multiplier,
      operatorMultiplier: r.operator_multiplier,
      userTierMultiplier: r.user_tier_multiplier,
      finalAmountCents: r.final_amount_cents,
      status: r.status as RewardEvent['status'],
      createdAt: r.created_at,
    }));
    return { data: formatted, meta: { total, nextCursor } };
  }

  async summary(userId: string): Promise<{ today: number; yesterday: number; last7Days: number; last30Days: number; lifetime: number }> {
    const dayStart = (d: Date): string => new Date(d).toISOString().slice(0, 10).replace('T', ' ');
    const now = new Date();
    const todayStart = dayStart(now);
    const yesterdayStart = dayStart(new Date(now.getTime() - 86400000));
    const sevenAgo = dayStart(new Date(now.getTime() - 6 * 86400000));
    const thirtyAgo = dayStart(new Date(now.getTime() - 29 * 86400000));

    const [today, yesterday, last7, last30, lifetime] = await Promise.all([
      this.db.first<{ s: number }>('SELECT SUM(final_amount_cents) as s FROM reward_events WHERE user_id = ? AND status = ? AND created_at >= ?', [userId, 'approved', todayStart]),
      this.db.first<{ s: number }>('SELECT SUM(final_amount_cents) as s FROM reward_events WHERE user_id = ? AND status = ? AND created_at >= ? AND created_at < ?', [userId, 'approved', yesterdayStart, todayStart]),
      this.db.first<{ s: number }>('SELECT SUM(final_amount_cents) as s FROM reward_events WHERE user_id = ? AND status = ? AND created_at >= ?', [userId, 'approved', sevenAgo]),
      this.db.first<{ s: number }>('SELECT SUM(final_amount_cents) as s FROM reward_events WHERE user_id = ? AND status = ? AND created_at >= ?', [userId, 'approved', thirtyAgo]),
      this.db.first<{ s: number }>('SELECT SUM(final_amount_cents) as s FROM reward_events WHERE user_id = ? AND status = ?', [userId, 'approved']),
    ]);

    return {
      today: today && today.s ? Number(today.s) : 0,
      yesterday: yesterday && yesterday.s ? Number(yesterday.s) : 0,
      last7Days: last7 && last7.s ? Number(last7.s) : 0,
      last30Days: last30 && last30.s ? Number(last30.s) : 0,
      lifetime: lifetime && lifetime.s ? Number(lifetime.s) : 0,
    };
  }
}
