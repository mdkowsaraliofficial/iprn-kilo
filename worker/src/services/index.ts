import type { Env } from '../config';
import { Db } from '../db';
import { LoggingService, CacheService } from './logging';
import { AuthService } from './auth';
import { SettingsService } from './settings';
import { NumbersService } from './numbers';
import { SmsService } from './sms';
import { WalletService } from './wallet';
import { RewardsService } from './rewards';
import { ProvidersService } from './providers';
import { AnalyticsService } from './analytics';
import { NotificationsService } from './notifications';
import { WebhooksService } from './webhooks';
import { IngestService } from './ingest';
import { SseService } from './sse';
import { SCHEMA_SQL, INDEX_SQL } from '../schema';

export class Services {
  readonly db: Db;
  readonly logging: LoggingService;
  readonly cache: CacheService;
  readonly auth: AuthService;
  readonly settings: SettingsService;
  readonly numbers: NumbersService;
  readonly sms: SmsService;
  readonly wallet: WalletService;
  readonly rewards: RewardsService;
  readonly providers: ProvidersService;
  readonly analytics: AnalyticsService;
  readonly notifications: NotificationsService;
  readonly webhooks: WebhooksService;
  readonly ingest: IngestService;
  readonly sse: SseService;
  readonly initialized: Promise<void>;

  constructor(public readonly env: Env) {
    this.db = new Db(env.DB);
    this.logging = new LoggingService(this.db, env);
    this.cache = new CacheService(env.CACHE_KV, this.logging);
    this.settings = new SettingsService(this.db, this.cache, this.logging);
    this.auth = new AuthService(this.db, env, this.settings, this.logging);
    this.numbers = new NumbersService(this.db, env, this.settings);
    this.sms = new SmsService(this.db, env, this.settings, this.logging);
    this.wallet = new WalletService(this.db, env, this.settings, this.logging);
    this.rewards = new RewardsService(this.db, env, this.logging, this.cache, this.wallet, this.settings);
    this.providers = new ProvidersService(this.db, env, this.cache, this.logging);
    this.analytics = new AnalyticsService(this.db, env, this.cache);
    this.notifications = new NotificationsService(this.db, env, this.logging);
    this.sse = new SseService(this.logging);
    this.webhooks = new WebhooksService(this.db, env, this.logging, this.settings);
    this.ingest = new IngestService(
      this.db, env, this.cache, this.logging,
      this.sms, this.rewards, this.numbers, this.webhooks, this.analytics, this.notifications, this.sse
    );
    this.initialized = this.init();
  }

  private async init(): Promise<void> {
    const migrated = await this.db.first<{ v: number }>('SELECT 1 as v FROM _migrations LIMIT 1');
    if (!migrated) {
      for (const sql of SCHEMA_SQL) {
        await this.db.exec(sql);
      }
      for (const sql of INDEX_SQL) {
        await this.db.exec(sql);
      }
      await this.db.run('INSERT OR IGNORE INTO _migrations (id, name) VALUES (1, \'initial_schema\')');
    }
  }

  async getSetting<T = unknown>(key: string): Promise<T> {
    return this.settings.get<T>(key);
  }

  async getSettingRaw(key: string): Promise<unknown> {
    return this.settings.get(key);
  }
}

export async function createServices(env: Env): Promise<Services> {
  const services = new Services(env);
  await services.initialized;
  return services;
}

let _services: Services | null = null;
let _envRef: Env | null = null;
export function getServices(env: Env): Services {
  if (!_services || _envRef !== env) {
    _services = new Services(env);
    _envRef = env;
  }
  return _services;
}
