import type { Db } from '../db';
import type { Env, NumberRecord, NumberAssignment, CountryOperatorSummary } from '../config';
import { uuid, nowIso } from '../config';
import type { NumberRequestInput } from '@iprn/types';
import type { SettingsService } from './settings';

export class NumbersService {
  constructor(
    private db: Db,
    private env: Env,
    private settings: SettingsService
  ) {}

  async getAvailableSummary(): Promise<CountryOperatorSummary[]> {
    const rows = await this.db.query<{
      country_code: string;
      country_name: string;
      available: number;
      assigned: number;
      total: number;
    }>(`
      SELECT c.code AS country_code, c.name AS country_name,
             COUNT(CASE WHEN n.status='available' THEN 1 END) AS available,
             COUNT(CASE WHEN n.status='assigned' THEN 1 END) AS assigned,
             COUNT(*) AS total
      FROM numbers n
      JOIN countries c ON n.country_code = c.code
      GROUP BY c.code, c.name
      ORDER BY c.name
    `);
    return rows.map((r) => ({
      countryCode: r.country_code,
      countryName: r.country_name,
      available: r.available,
      assigned: r.assigned,
      total: r.total,
    }));
  }

  async getUserNumbers(userId: string): Promise<NumberRecord[]> {
    const rows = await this.db.query<{
      id: string; e164: string; country_code: string; operator: string; provider_id: string;
      status: string; quality_score: number; notes: string | null; last_sms_at: string | null;
      created_at: string; assigned_user_id: string | null;
    }>(
      'SELECT id, e164, country_code, operator, provider_id, status, quality_score, notes, last_sms_at, created_at, assigned_user_id FROM numbers WHERE assigned_user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return rows.map((r) => ({
      id: r.id, e164: r.e164, countryCode: r.country_code, operator: r.operator,
      providerId: r.provider_id, status: r.status as NumberRecord['status'],
      qualityScore: r.quality_score, notes: r.notes, lastSmsAt: r.last_sms_at,
      createdAt: r.created_at, assignedUserId: r.assigned_user_id,
    }));
  }

  async assignNumbers(userId: string, input: NumberRequestInput): Promise<{ assigned: NumberRecord[] }> {
    const minQuality = await this.settings.get<number>('number_quality_min');
    const minQualityNum = Number(minQuality) || 0;

    const rows = await this.db.query<{
      id: string; e164: string; country_code: string; operator: string; provider_id: string;
      status: string; quality_score: number; notes: string | null; last_sms_at: string | null;
      created_at: string;
    }>(
      `SELECT id, e164, country_code, operator, provider_id, status, quality_score, notes, last_sms_at, created_at
       FROM numbers
       WHERE status = 'available' AND country_code = ? AND operator = ? AND quality_score >= ?
       ORDER BY quality_score DESC, last_sms_at ASC, created_at ASC
       LIMIT ?`,
      [input.countryCode, input.operator, minQualityNum, input.quantity]
    );

    if (rows.length === 0) {
      const err: any = new Error(`No available numbers in ${input.countryCode} / ${input.operator}`);
      err.code = 'NO_NUMBERS_AVAILABLE';
      err.status = 409;
      throw err;
    }

    const assigned: NumberRecord[] = [];
    await this.db.batch(async (tx) => {
      for (const row of rows) {
        const assignmentId = `assign_${uuid()}`;
        await tx.run(
          'UPDATE numbers SET status = ?, assigned_user_id = ? WHERE id = ?',
          ['assigned', userId, row.id]
        );
        await tx.run(
          'INSERT INTO number_assignments (id, number_id, user_id, assigned_at, released_at, status) VALUES (?, ?, ?, ?, NULL, ?)',
          [assignmentId, row.id, userId, nowIso(), 'active']
        );
        assigned.push({
          id: row.id, e164: row.e164, countryCode: row.country_code,
          operator: row.operator, providerId: row.provider_id, status: 'assigned',
          qualityScore: row.quality_score, notes: row.notes, lastSmsAt: row.last_sms_at,
          createdAt: row.created_at, assignedUserId: userId,
        });
      }
    });

    return { assigned };
  }

  async releaseNumber(userId: string, numberId: string): Promise<boolean> {
    const existing = await this.db.first<{ user_id: string }>(
      'SELECT user_id FROM numbers WHERE id = ? AND assigned_user_id = ?',
      [numberId, userId]
    );
    if (!existing) {
      const err: any = new Error('Number not assigned to user');
      err.code = 'NOT_FOUND';
      err.status = 404;
      throw err;
    }
    await this.db.batch(async (tx) => {
      await tx.run(
        'UPDATE numbers SET status = ?, assigned_user_id = NULL, last_sms_at = NULL WHERE id = ?',
        ['available', numberId]
      );
      await tx.run(
        'UPDATE number_assignments SET status = ?, released_at = datetime(\'now\') WHERE number_id = ? AND user_id = ? AND status = ?',
        ['released', numberId, userId, 'active']
      );
    });
    return true;
  }

  async getNumberDetail(userId: string, numberId: string): Promise<NumberRecord | null> {
    const row = await this.db.first<{
      id: string; e164: string; country_code: string; operator: string; provider_id: string;
      status: string; quality_score: number; notes: string | null; last_sms_at: string | null;
      created_at: string; assigned_user_id: string | null;
    }>(
      'SELECT id, e164, country_code, operator, provider_id, status, quality_score, notes, last_sms_at, created_at, assigned_user_id FROM numbers WHERE id = ? AND assigned_user_id = ?',
      [numberId, userId]
    );
    if (!row) return null;
    return {
      id: row.id, e164: row.e164, countryCode: row.country_code, operator: row.operator,
      providerId: row.provider_id, status: row.status as NumberRecord['status'],
      qualityScore: row.quality_score, notes: row.notes, lastSmsAt: row.last_sms_at,
      createdAt: row.created_at, assignedUserId: row.assigned_user_id,
    };
  }

  async importNumbers(numbers: Array<{ e164: string; countryCode: string; operator: string; providerId: string; qualityScore?: number; notes?: string }>): Promise<{ imported: number; errors: string[] }> {
    const imported = { count: 0 };
    const errors: string[] = [];
    const providerExists = await this.db.first<{ id: string }>('SELECT id FROM providers WHERE id = ?', [numbers[0]?.providerId ?? 'manual-pool-001']);
    if (!providerExists) {
      errors.push(`Provider ${numbers[0]?.providerId} does not exist`);
      return { imported: 0, errors };
    }
    await this.db.batch(async (tx) => {
      for (const n of numbers) {
        try {
          await tx.run(
            'INSERT INTO numbers (id, e164, country_code, operator, provider_id, status, quality_score, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [`num_${uuid()}`, n.e164, n.countryCode, n.operator, n.providerId, 'available',
              n.qualityScore ?? 0, n.notes ?? null, nowIso()]
          );
          imported.count++;
        } catch (e) {
          errors.push(`${n.e164}: ${(e as Error).message}`);
        }
      }
    });
    return { imported: imported.count, errors };
  }

  async getAvailableCountByCountryOperator(): Promise<CountryOperatorSummary[]> {
    return this.getAvailableSummary();
  }
}
