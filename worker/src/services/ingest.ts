import type { Db } from '../db';
import type { Env } from '../config';
import { uuid, nowIso } from '../config';
import type { CacheService } from './logging';
import type { SmsService } from './sms';
import type { RewardsService } from './rewards';
import type { NumbersService } from './numbers';
import type { WebhooksService } from './webhooks';
import type { AnalyticsService } from './analytics';
import type { NotificationsService } from './notifications';
import type { LoggingService } from './logging';
import type { SseService } from './sse';
import type { IngestSmsRequest, IngestSmsResponse, NumberRecord } from '@iprn/types';
const IDEMPOTENCY_TTL = 3600;

export class IngestService {
  constructor(
    private db: Db,
    private env: Env,
    private cache: CacheService,
    private logging: LoggingService,
    private sms: SmsService,
    private rewards: RewardsService,
    private numbers: NumbersService,
    private webhooks: WebhooksService,
    private analytics: AnalyticsService,
    private notifications: NotificationsService,
    private sse: SseService
  ) {}

  async ingestSms(req: IngestSmsRequest): Promise<IngestSmsResponse> {
    const idempotencyKey = `ingest:${await this.hashKey(req.phoneNumber, req.sender, req.message)}`;
    const existing = await this.cache.get<IngestSmsResponse>(idempotencyKey);
    if (existing) {
      this.logging.info('ingest', 'Duplicate SMS ingest skipped', { phoneNumber: req.phoneNumber });
      return existing;
    }

    const number = await this.resolveNumber(req.phoneNumber);
    if (!number) {
      const err: any = new Error(`Number ${req.phoneNumber} not found`);
      err.code = 'NUMBER_NOT_FOUND';
      err.status = 404;
      throw err;
    }

    const userId = number.assignedUserId ?? 'demo-user-001';

    const record = await this.sms.createSms({
      numberId: number.id,
      userId,
      sender: req.sender,
      body: req.message,
      country: number.countryCode,
      operator: number.operator,
      providerId: number.providerId,
    });

    const result = await this.rewards.processSmsReward({
      id: record.id,
      numberId: record.numberId,
      userId: record.userId,
      country: record.country,
      operator: record.operator,
      providerId: record.providerId,
      extractedOtp: record.extractedOtp,
    });

    let rewardAmountCents = 0;
    let rewardEventId: string | null = null;
    if (result) {
      rewardAmountCents = result.finalAmountCents;
      rewardEventId = result.id;
      await this.webhooks.queueDelivery(record.userId, 'reward.credited', {
        type: 'reward.credited',
        smsId: record.id,
        userId: record.userId,
        rewardEventId: result.id,
        amountCents: result.finalAmountCents,
        createdAt: new Date().toISOString(),
      });
    }

    await this.sms.updateStatus(record.id, 'processed', rewardEventId);

    await this.webhooks.queueDelivery(record.userId, 'sms.received', {
      type: 'sms.received',
      smsId: record.id,
      numberId: record.numberId,
      userId: record.userId,
      sender: record.sender,
      body: record.body,
      otp: record.extractedOtp,
      country: record.country,
      operator: record.operator,
      providerId: record.providerId,
      createdAt: record.createdAt,
    });

    if (record.extractedOtp) {
      await this.webhooks.queueDelivery(record.userId, 'otp.extracted', {
        type: 'otp.extracted', smsId: record.id, userId: record.userId, otp: record.extractedOtp, extractedAt: record.createdAt,
      });
      await this.notifications.create(record.userId, 'info', 'New OTP Received', `A new OTP (${record.extractedOtp}) was extracted from an incoming SMS.`, { smsId: record.id });
    }

    await this.analytics.incrementSms(
      record.userId, record.country, record.operator, record.providerId,
      record.extractedOtp !== null, rewardAmountCents
    );

    if (result) {
      void this.sse.broadcast(record.userId, {
        id: Date.now(), userId: record.userId, eventType: 'reward.credited',
        payload: { smsId: record.id, rewardId: result.id, amountCents: result.finalAmountCents },
        createdAt: record.createdAt,
      });
    }
    void this.sse.broadcast(record.userId, {
      id: Date.now() + 1, userId: record.userId, eventType: 'sms.received',
      payload: { smsId: record.id, numberId: record.numberId, sender: record.sender, body: record.body, otp: record.extractedOtp, country: record.country, operator: record.operator },
      createdAt: record.createdAt,
    });
    if (record.extractedOtp) {
      void this.sse.broadcast(record.userId, {
        id: Date.now() + 2, userId: record.userId, eventType: 'otp.extracted',
        payload: { smsId: record.id, numberId: record.numberId, otp: record.extractedOtp }, createdAt: record.createdAt,
      });
    }

    const response: IngestSmsResponse = {
      smsId: record.id,
      rewardAmountCents,
      otp: record.extractedOtp,
      processed: true,
    };

    await this.cache.set(idempotencyKey, response, IDEMPOTENCY_TTL);
    return response;
  }

  private async resolveNumber(phoneNumber: string): Promise<NumberRecord | null> {
    const row = await this.db.first<{
      id: string; e164: string; country_code: string; operator: string; provider_id: string;
      status: string; quality_score: number; notes: string | null; last_sms_at: string | null;
      created_at: string; assigned_user_id: string | null;
    }>('SELECT id, e164, country_code, operator, provider_id, status, quality_score, notes, last_sms_at, created_at, assigned_user_id FROM numbers WHERE e164 = ?', [phoneNumber]);
    if (!row) return null;
    return {
      id: row.id, e164: row.e164, countryCode: row.country_code, operator: row.operator,
      providerId: row.provider_id, status: row.status as NumberRecord['status'], qualityScore: row.quality_score,
      notes: row.notes, lastSmsAt: row.last_sms_at, createdAt: row.created_at,
      assignedUserId: row.assigned_user_id,
    } as NumberRecord;
  }

  private async hashKey(phoneNumber: string, sender: string, message: string): Promise<string> {
    const data = `${phoneNumber}|${sender}|${message}`;
    const bytes = new TextEncoder().encode(data);
    const hash = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
  }
}
