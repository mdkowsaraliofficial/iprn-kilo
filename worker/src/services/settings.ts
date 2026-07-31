import type { Db } from '../db';
import type { Env, SystemSetting, SettingCategory } from '../config';
import type { CacheService } from './logging';

const SETTINGS_CACHE_TTL = 60;
const SETTINGS_CACHE_KEY = 'iprn:settings:all';

export type SettingSchema = {
  category: SettingCategory;
  description: string;
  defaultValue: unknown;
  parse: (raw: string) => unknown;
  stringify: (val: unknown) => string;
};

export const SETTING_SCHEMAS: Record<string, SettingSchema> = {
  maintenance_mode: { category: 'maintenance', description: 'When 1, platform is in maintenance mode', defaultValue: 0, parse: (r) => parseInt(r, 10), stringify: (v) => String(v ?? 0) },
  maintenance_message: { category: 'maintenance', description: 'Maintenance mode message shown to users', defaultValue: 'Platform is under maintenance.', parse: (r) => r, stringify: (v) => String(v) },
  otp_regex: { category: 'sms_validation', description: 'Regex pattern to extract OTP codes', defaultValue: '[0-9]{4,8}', parse: (r) => r, stringify: (v) => String(v) },
  otp_min_length: { category: 'sms_validation', description: 'Minimum OTP length', defaultValue: 4, parse: (r) => parseInt(r, 10), stringify: (v) => String(v ?? 4) },
  otp_max_length: { category: 'sms_validation', description: 'Maximum OTP length', defaultValue: 8, parse: (r) => parseInt(r, 10), stringify: (v) => String(v ?? 8) },
  min_withdrawal_cents: { category: 'wallet', description: 'Minimum withdrawal amount in cents', defaultValue: 5000, parse: (r) => parseInt(r, 10), stringify: (v) => String(v ?? 5000) },
  default_number_limit: { category: 'numbers', description: 'Default number assignment limit per user', defaultValue: 50, parse: (r) => parseInt(r, 10), stringify: (v) => String(v ?? 50) },
  rate_limit_default: { category: 'api', description: 'Default requests per hour per API key', defaultValue: 3600, parse: (r) => parseInt(r, 10), stringify: (v) => String(v ?? 3600) },
  rate_limit_sms_ingest: { category: 'api', description: 'Max SMS ingest per minute per IP', defaultValue: 60, parse: (r) => parseInt(r, 10), stringify: (v) => String(v ?? 60) },
  auto_assign_numbers: { category: 'numbers', description: 'Auto-assign numbers from pool', defaultValue: 1, parse: (r) => parseInt(r, 10), stringify: (v) => String(v ?? 1) },
  reward_auto_approve: { category: 'rewards', description: 'Auto-approve rewards', defaultValue: 1, parse: (r) => parseInt(r, 10), stringify: (v) => String(v ?? 1) },
  webhook_max_attempts: { category: 'providers', description: 'Max webhook delivery attempts', defaultValue: 3, parse: (r) => parseInt(r, 10), stringify: (v) => String(v ?? 3) },
  webhook_retry_schedule: { category: 'providers', description: 'Webhook retry delays in seconds', defaultValue: '10,60,300', parse: (r) => r, stringify: (v) => String(v) },
  default_user_tier: { category: 'rewards', description: 'Default user tier', defaultValue: 'bronze', parse: (r) => r, stringify: (v) => String(v) },
  analytics_past_days: { category: 'analytics', description: 'Days to retain analytics', defaultValue: 90, parse: (r) => parseInt(r, 10), stringify: (v) => String(v ?? 90) },
  platform_name: { category: 'general', description: 'Platform display name', defaultValue: 'IPRN Online', parse: (r) => r, stringify: (v) => String(v) },
  reward_pending_seconds: { category: 'rewards', description: 'Seconds before pending rewards auto-approve', defaultValue: 30, parse: (r) => parseInt(r, 10), stringify: (v) => String(v ?? 30) },
  fraud_threshold_ots_per_minute: { category: 'fraud', description: 'OTP threshold per minute per number before flagging', defaultValue: 10, parse: (r) => parseInt(r, 10), stringify: (v) => String(v ?? 10) },
  number_quality_min: { category: 'numbers', description: 'Minimum quality score for number assignment', defaultValue: 0, parse: (r) => parseInt(r, 10), stringify: (v) => String(v ?? 0) },
};

export class SettingsService {
  constructor(private db: Db, private cache: CacheService, private logging: { warn: (cat: string, msg: string, ctx?: Record<string, unknown>) => void }) {}

  private async loadAllRaw(): Promise<Record<string, SystemSetting>> {
    const cached = await this.cache.get<Record<string, SystemSetting>>(SETTINGS_CACHE_KEY);
    if (cached) return cached;

    const rows = await this.db.query<{ key: string; value: string; description: string; category: string; updated_by: string | null; updated_at: string }>(
      'SELECT key, value, description, category, updated_by, updated_at FROM system_settings'
    );

    const settings: Record<string, SystemSetting> = {};
    for (const row of rows) {
      settings[row.key] = {
        key: row.key,
        value: row.value,
        description: row.description ?? '',
        category: row.category,
        updatedBy: row.updated_by,
        updatedAt: row.updated_at,
      };
    }

    for (const [key, schema] of Object.entries(SETTING_SCHEMAS)) {
      if (!settings[key]) {
        settings[key] = {
          key,
          value: schema.defaultValue,
          description: schema.description,
          category: schema.category,
          updatedBy: null,
          updatedAt: new Date().toISOString(),
        };
      }
    }

    await this.cache.set(SETTINGS_CACHE_KEY, settings, SETTINGS_CACHE_TTL);
    return settings;
  }

  async getAll(): Promise<Record<string, SystemSetting>> {
    return this.loadAllRaw();
  }

  async get<T = unknown>(key: string): Promise<T> {
    const all = await this.loadAllRaw();
    const schema = SETTING_SCHEMAS[key];
    const raw = all[key];
    if (!raw) {
      return (schema?.defaultValue ?? null) as T;
    }
    if (schema) {
      return schema.parse(raw.value as string) as T;
    }
    try {
      return JSON.parse(raw.value as string) as T;
    } catch {
      return raw.value as T;
    }
  }

  async set(key: string, value: unknown, description?: string, category?: string, updatedBy?: string): Promise<SystemSetting> {
    const schema = SETTING_SCHEMAS[key];
    if (!schema) {
      throw new Error(`Unknown setting: ${key}`);
    }
    const rawValue = schema.stringify(value);
    const cat = (category ?? schema.category) as string;
    const desc = description ?? schema.description;

    await this.db.run(
      `INSERT INTO system_settings (key, value, description, category, updated_by, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value=excluded.value, description=excluded.description, category=excluded.category, updated_by=excluded.updated_by, updated_at=datetime('now')`,
      [key, rawValue, desc, cat, updatedBy ?? null]
    );

    await this.cache.delete(SETTINGS_CACHE_KEY);
    const updated: SystemSetting = {
      key,
      value,
      description: desc,
      category: cat as SettingCategory,
      updatedBy: updatedBy ?? null,
      updatedAt: new Date().toISOString(),
    };
    return updated;
  }

  isMaintenance(): Promise<boolean> {
    return this.get<number>('maintenance_mode').then((v) => v === 1);
  }
}
