import type { Db } from '../db';
import type { Env, SmsMessage } from '../config';
import { uuid, nowIso } from '../config';
import type { SettingsService } from './settings';
import type { LoggingService } from './logging';

export interface OtpExtractionResult {
  otp: string | null;
  isOtp: boolean;
}

export class SmsService {
  constructor(
    private db: Db,
    private env: Env,
    private settings: SettingsService,
    private logging: LoggingService
  ) {}

  async extractOtp(body: string): Promise<OtpExtractionResult> {
    const regexStr = await this.settings.get<string>('otp_regex');
    const minLength = await this.settings.get<number>('otp_min_length');
    const maxLength = await this.settings.get<number>('otp_max_length');
    const regex = new RegExp(String(regexStr), 'g');
    let match: RegExpExecArray | null;
    let best: string | null = null;
    while ((match = regex.exec(body)) !== null) {
      const candidate = match[0];
      if (candidate.length >= Number(minLength) && candidate.length <= Number(maxLength)) {
        if (!best || candidate.length > best.length) best = candidate;
      }
    }
    return { otp: best, isOtp: best !== null };
  }

  async createSms(params: {
    numberId: string;
    userId: string;
    sender: string;
    body: string;
    country: string;
    operator: string;
    providerId: string;
  }): Promise<SmsMessage> {
    const id = `sms_${uuid()}`;
    const { otp, isOtp } = await this.extractOtp(params.body);
    await this.db.run(
      `INSERT INTO sms_messages (id, number_id, user_id, sender, body, extracted_otp, country, operator, provider_id, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'received', ?)`,
      [id, params.numberId, params.userId, params.sender, params.body, otp, params.country, params.operator, params.providerId, nowIso()]
    );

    if (otp) {
      const otpId = `otp_${uuid()}`;
      await this.db.run(
        'INSERT INTO otps (id, sms_id, number_id, user_id, code, extracted_at) VALUES (?, ?, ?, ?, ?, ?)',
        [otpId, id, params.numberId, params.userId, otp, nowIso()]
      );
    }

    const record: SmsMessage = {
      id,
      numberId: params.numberId,
      userId: params.userId,
      sender: params.sender,
      body: params.body,
      extractedOtp: otp,
      country: params.country,
      operator: params.operator,
      providerId: params.providerId,
      status: 'received',
      rewardEventId: null,
      createdAt: nowIso(),
    };

    this.logging.info('sms', 'SMS received', { smsId: id, numberId: params.numberId, hasOtp: otp !== null });
    return record;
  }

  async updateStatus(smsId: string, status: SmsMessage['status'], rewardEventId?: string | null): Promise<void> {
    const sets: string[] = ['status = ?'];
    const params: unknown[] = [status];
    if (rewardEventId !== undefined) {
      sets.push('reward_event_id = ?');
      params.push(rewardEventId ?? null);
    }
    params.push(smsId);
    await this.db.run(`UPDATE sms_messages SET ${sets.join(', ')} WHERE id = ?`, params);
  }

  async listUserSms(userId: string, opts: {
    limit?: number; cursor?: string | null; numberId?: string; country?: string; operator?: string;
    status?: string; from?: string; to?: string; search?: string; sortBy?: string; sortDir?: 'asc' | 'desc';
  }): Promise<{ data: SmsMessage[]; meta: { total: number; nextCursor: string | null } }> {
    const limit = Math.min(opts.limit ?? 25, 100);
    const sortCol = opts.sortBy ?? 'created_at';
    const sortDir = opts.sortDir ?? 'desc';
    const allowedSorts = ['created_at', 'sender', 'country', 'operator', 'status'];
    if (!allowedSorts.includes(sortCol)) throw new Error(`Invalid sort: ${sortCol}`);

    const wheres: string[] = ['user_id = ?'];
    const params: unknown[] = [userId];
    if (opts.numberId) { wheres.push('number_id = ?'); params.push(opts.numberId); }
    if (opts.country) { wheres.push('country = ?'); params.push(opts.country); }
    if (opts.operator) { wheres.push('operator = ?'); params.push(opts.operator); }
    if (opts.status && opts.status !== 'all') { wheres.push('status = ?'); params.push(opts.status); }
    if (opts.from) { wheres.push('created_at >= ?'); params.push(opts.from); }
    if (opts.to) { wheres.push('created_at <= ?'); params.push(opts.to); }
    if (opts.search) { wheres.push('(sender LIKE ? OR body LIKE ?)'); params.push(`%${opts.search}%`, `%${opts.search}%`); }

    if (opts.cursor) { wheres.push(`created_at < ?`); params.push(opts.cursor); }

    const whereClause = wheres.join(' AND ');
    const totalRes = await this.db.first<{ c: number }>('SELECT COUNT(*) as c FROM sms_messages WHERE ' + whereClause, params);
    const total = totalRes ? Number(totalRes.c) : 0;

    const rows = await this.db.query<{
      id: string; number_id: string; user_id: string; sender: string; body: string; extracted_otp: string | null;
      country: string; operator: string; provider_id: string; status: string; reward_event_id: string | null; created_at: string;
    }>(
      `SELECT id, number_id, user_id, sender, body, extracted_otp, country, operator, provider_id, status, reward_event_id, created_at
       FROM sms_messages WHERE ${whereClause} ORDER BY ${sortCol} ${sortDir === 'asc' ? 'ASC' : 'DESC'} LIMIT ?`,
      [...params, limit + 1]
    );

    const hasNext = rows.length > limit;
    const data = rows.slice(0, limit);
    const nextCursor = hasNext ? (data[data.length - 1]?.created_at ?? null) as string | null : null;

    const formatted: SmsMessage[] = data.map((r) => ({
      id: r.id, numberId: r.number_id, userId: r.user_id, sender: r.sender, body: r.body,
      extractedOtp: r.extracted_otp, country: r.country, operator: r.operator, providerId: r.provider_id,
      status: r.status as SmsMessage['status'], rewardEventId: r.reward_event_id, createdAt: r.created_at,
    }));

    return { data: formatted, meta: { total, nextCursor } };
  }

  async latestUserSms(userId: string): Promise<SmsMessage | null> {
    const row = await this.db.first<{
      id: string; number_id: string; user_id: string; sender: string; body: string; extracted_otp: string | null;
      country: string; operator: string; provider_id: string; status: string; reward_event_id: string | null; created_at: string;
    }>('SELECT id, number_id, user_id, sender, body, extracted_otp, country, operator, provider_id, status, reward_event_id, created_at FROM sms_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [userId]);
    if (!row) return null;
    return {
      id: row.id, numberId: row.number_id, userId: row.user_id, sender: row.sender, body: row.body,
      extractedOtp: row.extracted_otp, country: row.country, operator: row.operator, providerId: row.provider_id,
      status: row.status as SmsMessage['status'], rewardEventId: row.reward_event_id, createdAt: row.created_at,
    };
  }

  async latestUserOtp(userId: string): Promise<{ code: string; smsId: string; numberId: string; createdAt: string } | null> {
    const row = await this.db.first<{
      sms_id: string; number_id: string; code: string; extracted_at: string;
    }>(`SELECT sms_id, number_id, code, extracted_at FROM otps WHERE user_id = ? ORDER BY extracted_at DESC LIMIT 1`, [userId]);
    if (!row) return null;
    return { code: row.code, smsId: row.sms_id, numberId: row.number_id, createdAt: row.extracted_at };
  }

  async latestOtpByNumber(numberId: string, userId: string): Promise<{ code: string; smsId: string; createdAt: string } | null> {
    const row = await this.db.first<{ code: string; sms_id: string; extracted_at: string }>(
      `SELECT o.code, o.sms_id, o.extracted_at FROM otps o
       JOIN numbers n ON o.number_id = n.id
       WHERE o.number_id = ? AND n.assigned_user_id = ? ORDER BY o.extracted_at DESC LIMIT 1`,
      [numberId, userId]
    );
    if (!row) return null;
    return { code: row.code, smsId: row.sms_id, createdAt: row.extracted_at };
  }

  async otpHistory(userId: string, opts: { limit?: number; cursor?: string | null; numberId?: string; from?: string; to?: string }): Promise<{ data: Array<{ code: string; smsId: string; numberId: string; createdAt: string }>; meta: { total: number; nextCursor: string | null } }> {
    const limit = Math.min(opts.limit ?? 25, 100);
    const wheres: string[] = ['user_id = ?'];
    const params: unknown[] = [userId];
    if (opts.numberId) { wheres.push('number_id = ?'); params.push(opts.numberId); }
    if (opts.from) { wheres.push('extracted_at >= ?'); params.push(opts.from); }
    if (opts.to) { wheres.push('extracted_at <= ?'); params.push(opts.to); }
    if (opts.cursor) { wheres.push('extracted_at < ?'); params.push(opts.cursor); }

    const whereClause = wheres.join(' AND ');
    const totalRes = await this.db.first<{ c: number }>('SELECT COUNT(*) as c FROM otps WHERE ' + whereClause, params);
    const total = totalRes ? Number(totalRes.c) : 0;
    const rows = await this.db.query<{ sms_id: string; number_id: string; code: string; extracted_at: string }>(
      `SELECT sms_id, number_id, code, extracted_at FROM otps WHERE ${whereClause} ORDER BY extracted_at DESC LIMIT ?`,
      [...params, limit + 1]
    );
    const hasNext = rows.length > limit;
    const data = rows.slice(0, limit);
    const nextCursor = hasNext ? (data[data.length - 1]?.extracted_at ?? null) : null;
    const formatted = data.map((r) => ({ code: r.code, smsId: r.sms_id, numberId: r.number_id, createdAt: r.extracted_at }));
    return { data: formatted, meta: { total, nextCursor } };
  }

  async platformStats(): Promise<{ totalSms: number; totalOtp: number; smsToday: number; otpToday: number }> {
    const [sms, otp, smsToday, otpToday] = await Promise.all([
      this.db.first<{ c: number }>('SELECT COUNT(*) as c FROM sms_messages'),
      this.db.first<{ c: number }>('SELECT COUNT(*) as c FROM otps'),
      this.db.first<{ c: number }>("SELECT COUNT(*) as c FROM sms_messages WHERE created_at >= datetime('now', '-1 day')"),
      this.db.first<{ c: number }>("SELECT COUNT(*) as c FROM otps WHERE extracted_at >= datetime('now', '-1 day')"),
    ]);
    return {
      totalSms: sms ? Number(sms.c) : 0,
      totalOtp: otp ? Number(otp.c) : 0,
      smsToday: smsToday ? Number(smsToday.c) : 0,
      otpToday: otpToday ? Number(otpToday.c) : 0,
    };
  }
}
