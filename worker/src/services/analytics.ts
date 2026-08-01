import type { Db } from '../db';
import type { Env } from '../config';
import type { AnalyticsDay, CountryOperatorSummary } from '@iprn/types';
import type { CacheService } from './logging';

export interface DayAnalytics {
  date: string;
  smsCount: number;
  otpCount: number;
  earningsCents: number;
}

export class AnalyticsService {
  constructor(private db: Db, private env: Env, private cache: CacheService) {}

  async incrementSms(userId: string, country: string, operator: string, providerId: string, isOtp: boolean, rewardCents: number): Promise<void> {
    const day = new Date().toISOString().slice(0, 10);
    const hour = new Date().toISOString().slice(0, 13);
    await this.db.run(
      `INSERT INTO analytics_day (bucket_day, country_code, operator, provider_id, sms_count, otp_count, reward_total_cents, unique_users, new_users)
       VALUES (?, ?, ?, ?, 1, ?, ?, 1, 0)
       ON CONFLICT(bucket_day, country_code, operator, provider_id) DO UPDATE SET sms_count = sms_count + 1, otp_count = otp_count + ?, reward_total_cents = reward_total_cents + ?`,
      [day, country, operator, providerId, isOtp ? 1 : 0, rewardCents, isOtp ? 1 : 0, rewardCents]
    );
    await this.db.run(
      `INSERT INTO analytics_hour (bucket_hour, country_code, operator, provider_id, sms_count, otp_count, reward_total_cents, unique_users)
       VALUES (?, ?, ?, ?, 1, ?, ?, 1)
       ON CONFLICT(bucket_hour, country_code, operator, provider_id) DO UPDATE SET sms_count = sms_count + 1, otp_count = otp_count + ?, reward_total_cents = reward_total_cents + ?`,
      [hour, country, operator, providerId, isOtp ? 1 : 0, rewardCents, isOtp ? 1 : 0, rewardCents]
    );
    await this.cache.delete(`iprn:analytics:user:${userId}`);
  }

  async getUserSummary(userId: string): Promise<{ smsToday: number; otpToday: number; earningsTodayCents: number; earnings7dCents: number; earnings30dCents: number; lifetimeEarningCents: number }> {
    const cached = await this.cache.get<{ smsToday: number; otpToday: number; earningsTodayCents: number; earnings7dCents: number; earnings30dCents: number; lifetimeEarningCents: number }>(`iprn:analytics:user:${userId}`);
    if (cached) return cached;

    const [smsToday, otpToday, earnings, lifetime] = await Promise.all([
      this.db.first<{ c: number }>("SELECT COUNT(*) as c FROM sms_messages WHERE user_id = ? AND date(created_at) = date('now')", [userId]),
      this.db.first<{ c: number }>("SELECT COUNT(*) as c FROM otps WHERE user_id = ? AND date(extracted_at) = date('now')", [userId]),
      this.db.first<{ s: number }>(`SELECT SUM(final_amount_cents) as s FROM reward_events WHERE user_id = ? AND status = 'approved' AND date(created_at) >= date('now','-30 days')`, [userId]),
      this.db.first<{ s: number }>('SELECT SUM(final_amount_cents) as s FROM reward_events WHERE user_id = ? AND status = ?', [userId, 'approved']),
    ]);
    const result = {
      smsToday: smsToday ? Number(smsToday.c) : 0,
      otpToday: otpToday ? Number(otpToday.c) : 0,
      earningsTodayCents: 0,
      earnings7dCents: 0,
      earnings30dCents: earnings && earnings.s ? Number(earnings.s) : 0,
      lifetimeEarningCents: lifetime && lifetime.s ? Number(lifetime.s) : 0,
    };
    await this.cache.set(`iprn:analytics:user:${userId}`, result, 60);
    return result;
  }

  async getSmsByDay(userId: string, from?: string, to?: string): Promise<DayAnalytics[]> {
    const dateFrom = from ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const dateTo = to ?? new Date().toISOString().slice(0, 10);
    const rows = await this.db.query<{ date: string; sms: number; otp: number; earnings: number }>(
      `SELECT substr(created_at, 1, 10) as date, COUNT(*) as sms,
              SUM(CASE WHEN extracted_otp IS NOT NULL THEN 1 ELSE 0 END) as otp,
              0 as earnings
       FROM sms_messages WHERE user_id = ? AND substr(created_at,1,10) >= ? AND substr(created_at,1,10) <= ?
       GROUP BY date ORDER BY date DESC`,
      [userId, dateFrom, dateTo]
    );
    return rows.map((r) => ({
      date: r.date, smsCount: Number(r.sms), otpCount: Number(r.otp), earningsCents: Number(r.earnings),
    }));
  }

  async getEarningsByDay(userId: string, from?: string, to?: string): Promise<DayAnalytics[]> {
    const dateFrom = from ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const dateTo = to ?? new Date().toISOString().slice(0, 10);
    const rows = await this.db.query<{ date: string; earnings: number }>(
      `SELECT substr(created_at, 1, 10) as date, SUM(final_amount_cents) as earnings
       FROM reward_events WHERE user_id = ? AND status = 'approved' AND substr(created_at,1,10) >= ? AND substr(created_at,1,10) <= ?
       GROUP BY date ORDER BY date DESC`,
      [userId, dateFrom, dateTo]
    );
    return rows.map((r) => ({
      date: r.date, smsCount: 0, otpCount: 0, earningsCents: r.earnings ? Number(r.earnings) : 0,
    }));
  }

  async getByCountry(userId: string, from?: string, to?: string): Promise<CountryOperatorSummary[]> {
    const rows = await this.db.query<{ country_code: string; country_name: string; sms_count: number; earnings: number }>(
      `SELECT s.country as country_code, s.country as country_name, COUNT(*) as sms_count, 0 as earnings
       FROM sms_messages s WHERE s.user_id = ? GROUP BY s.country ORDER BY sms_count DESC`,
      [userId]
    );
    const earningRows = await this.db.query<{ country_code: string; earnings: number }>(
      `SELECT s.country as country_code, SUM(re.final_amount_cents) as earnings
       FROM reward_events re JOIN sms_messages s ON re.sms_id = s.id
       WHERE re.user_id = ? AND re.status = 'approved' GROUP BY s.country`,
      [userId]
    );
    const earningsMap = new Map(earningRows.map((r) => [r.country_code, Number(r.earnings ?? 0)]));
    return rows.map((r) => ({
      countryCode: r.country_code,
      countryName: r.country_name,
      available: 0,
      assigned: Number(r.sms_count),
      total: Number(r.sms_count),
    }));
  }

  async getByOperator(userId: string): Promise<{ operator: string; countryCode: string; smsCount: number; earningsCents: number }[]> {
    const rows = await this.db.query<{ operator: string; country_code: string; sms_count: number }>(
      `SELECT s.operator, s.country as country_code, COUNT(*) as sms_count
       FROM sms_messages s WHERE s.user_id = ? GROUP BY s.operator ORDER BY sms_count DESC`,
      [userId]
    );
    const earningRows = await this.db.query<{ operator: string; earnings: number }>(
      `SELECT s.operator, SUM(re.final_amount_cents) as earnings
       FROM reward_events re JOIN sms_messages s ON re.sms_id = s.id
       WHERE re.user_id = ? AND re.status = 'approved' GROUP BY s.operator`,
      [userId]
    );
    const earningsMap = new Map(earningRows.map((r) => [r.operator, Number(r.earnings ?? 0)]));
    return rows.map((r) => ({ operator: r.operator, countryCode: r.country_code, smsCount: Number(r.sms_count), earningsCents: earningsMap.get(r.operator) ?? 0 }));
  }

  async getPlatformStats(): Promise<{ totalUsers: number; totalNumbers: number; totalSms: number; totalOtp: number; totalEarningsCents: number; totalRewardsCents: number }> {
    const cached = await this.cache.get<any>('iprn:analytics:platform');
    if (cached) return cached;
    const [totalUsers, totalNumbers, totalSms, totalOtp, totalRewards] = await Promise.all([
      this.db.first<{ c: number }>('SELECT COUNT(*) as c FROM users'),
      this.db.first<{ c: number }>('SELECT COUNT(*) as c FROM numbers'),
      this.db.first<{ c: number }>('SELECT COUNT(*) as c FROM sms_messages'),
      this.db.first<{ c: number }>('SELECT COUNT(*) as c FROM otps'),
      this.db.first<{ s: number }>('SELECT SUM(final_amount_cents) as s FROM reward_events WHERE status = ?', ['approved']),
    ]);
    const result = {
      totalUsers: totalUsers ? Number(totalUsers.c) : 0,
      totalNumbers: totalNumbers ? Number(totalNumbers.c) : 0,
      totalSms: totalSms ? Number(totalSms.c) : 0,
      totalOtp: totalOtp ? Number(totalOtp.c) : 0,
      totalEarningsCents: totalRewards && totalRewards.s ? Number(totalRewards.s) : 0,
      totalRewardsCents: totalRewards && totalRewards.s ? Number(totalRewards.s) : 0,
    };
    await this.cache.set('iprn:analytics:platform', result, 60);
    return result;
  }
}
