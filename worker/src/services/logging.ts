import type { Db } from '../db';
import type { Env } from '../config';
import { safeJsonParse, uuid, nowIso } from '../config';
import type { LogLevel, AuditSeverity } from '@iprn/types';

export class LoggingService {
  constructor(private db: Db, private env: Env) {}

  async log(level: LogLevel, category: string, message: string, context?: Record<string, unknown>): Promise<void> {
    const values = [uuid(), level, category, message, context ? JSON.stringify(context) : null, nowIso()];
    try {
      await this.db.run(
        'INSERT INTO system_logs (id, level, category, message, context, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        values
      );
    } catch (e) {
      console.error('Failed to write system log', e);
    }
  }

  async audit(
    userId: string | null,
    action: string,
    resourceType: string,
    resourceId: string | null,
    changes: Record<string, unknown> | null,
    ip: string | null,
    userAgent: string | null,
    severity: AuditSeverity = 'info'
  ): Promise<void> {
    const values = [uuid(), userId, action, resourceType, resourceId, changes ? JSON.stringify(changes) : null, ip, userAgent, severity, nowIso()];
    try {
      await this.db.run(
        'INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, changes, ip, user_agent, severity, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        values
      );
    } catch (e) {
      console.error('Failed to write audit log', e);
    }
  }

  info(category: string, message: string, ctx?: Record<string, unknown>) {
    return this.log('info', category, message, ctx);
  }
  warn(category: string, message: string, ctx?: Record<string, unknown>) {
    return this.log('warn', category, message, ctx);
  }
  error(category: string, message: string, ctx?: Record<string, unknown>) {
    return this.log('error', category, message, ctx);
  }
  debug(category: string, message: string, ctx?: Record<string, unknown>) {
    return this.log('debug', category, message, ctx);
  }
}

export function parseSettingValue(raw: string | null): unknown {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export function stringifySettingValue(value: unknown): string {
  if (typeof value === 'string') {
    try {
      JSON.parse(value);
      return value;
    } catch {
      return JSON.stringify(value);
    }
  }
  return JSON.stringify(value);
}

export interface SimpleKV {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export class CacheService {
  constructor(
    private kv: SimpleKV,
    private logging: LoggingService
  ) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.kv.get(key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch (e) {
      this.logging.warn('cache', `cache get failed for ${key}`, { error: String(e) });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.kv.put(key, JSON.stringify(value), { expirationTtl: ttlSeconds });
      } else {
        await this.kv.put(key, JSON.stringify(value));
      }
    } catch (e) {
      this.logging.warn('cache', `cache set failed for ${key}`, { error: String(e) });
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.kv.delete(key);
    } catch (e) {
      this.logging.warn('cache', `cache delete failed for ${key}`, { error: String(e) });
    }
  }
}
