import type { D1Database, D1PreparedStatement } from '@cloudflare/workers-types';

export type Row = Record<string, unknown>;

export function toCamelCase(snake: string): string {
  return snake.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

export function rowToCamel(row: Row): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[toCamelCase(k)] = v;
  }
  return out;
}

export function mapRows<T extends Record<string, unknown>>(rows: T[]): T[] {
  return rows.map((r) => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(r)) {
      out[toCamelCase(k)] = v;
    }
    return out as T;
  });
}

export interface Tx {
  run(sql: string, params?: unknown[]): Promise<{ success: boolean; meta?: unknown }>;
  query<T extends Row = Row>(sql: string, params?: unknown[]): Promise<T[]>;
  first<T extends Row = Row>(sql: string, params?: unknown[]): Promise<T | null>;
}

export class Db {
  constructor(public readonly db: D1Database) {}

  prepare(sql: string): D1PreparedStatement {
    return this.db.prepare(sql);
  }

  async query<T extends Row = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
    const res = await this.db.prepare(sql).bind(...params).all<T>();
    if (res.error) {
      throw new Error(`D1 query error: ${res.error}`);
    }
    return mapRows(res.results ?? []);
  }

  async first<T extends Row = Row>(sql: string, params: unknown[] = []): Promise<T | null> {
    const res = (await this.db.prepare(sql).bind(...params).first()) as T | undefined | null;
    if (res === undefined || res === null) return null;
    return rowToCamel(res as unknown as Row) as T;
  }

  async run(sql: string, params: unknown[] = []): Promise<{ success: boolean; meta?: unknown }> {
    const res = await this.db.prepare(sql).bind(...params).run();
    if (!res.success) {
      throw new Error(`D1 run error: ${res.error ?? 'unknown'}`);
    }
    return { success: res.success, meta: res.meta };
  }

  async batch(stmts: Array<{ sql: string; params?: unknown[] }>): Promise<void> {
    const prepared = stmts.map((s) => this.db.prepare(s.sql).bind(...(s.params ?? [])));
    const results = await this.db.batch(prepared);
    for (const r of results) {
      const d1res = r as any;
      if (d1res?.error || d1res?.success === false) {
        throw new Error(`D1 batch error: ${d1res?.error ?? 'unknown'}`);
      }
    }
  }

  async tx<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    const collected: Array<{ sql: string; params?: unknown[] }> = [];
    const tx: Tx = {
      run: (sql: string, params: unknown[] = []) => {
        collected.push({ sql, params });
        return Promise.resolve({ success: true });
      },
      query: async (sql: string, params: unknown[] = []) => {
        const res = await this.db.prepare(sql).bind(...params).all<Row>();
        if (res.error) throw new Error(`D1 tx query error: ${res.error}`);
        return mapRows(res.results ?? []);
      },
      first: async (sql: string, params: unknown[] = []) => {
        const res = (await this.db.prepare(sql).bind(...params).first()) as Row | undefined | null;
        if (res === undefined || res === null) return null;
        return rowToCamel(res as unknown as Row) as Row;
      },
    };
    const result = await fn(tx);
    if (collected.length > 0) {
      await this.batch(collected);
    }
    return result;
  }

  async exec(sql: string): Promise<void> {
    const res = await this.db.prepare(sql).run();
    if (res.error) {
      throw new Error(`D1 exec error: ${res.error}`);
    }
  }
}
