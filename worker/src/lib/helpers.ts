import type { Context } from 'hono';

export function parsePagination(c: Context, opts: { limitDefault?: number; limitMax?: number } = {}) {
  const limit = Math.min(parseInt(c.req.query('limit') ?? '', 10) || (opts.limitDefault ?? 25), opts.limitMax ?? 100);
  const cursor = c.req.query('cursor') ?? null;
  const search = c.req.query('search') ?? undefined;
  const sortBy = c.req.query('sort_by') ?? 'created_at';
  const sortDir = (c.req.query('sort_dir') ?? 'desc') as 'asc' | 'desc';
  return { limit, cursor, search, sortBy, sortDir };
}

export function okList(c: Context, data: unknown[], meta: { total: number; nextCursor: string | null; cursor: string | null; limit: number; hasNext: boolean; hasPrev: boolean }) {
  const result = { data, meta: { ...meta } };
  return c.json(result);
}

export function ok(c: Context, data: unknown) {
  return c.json({ data });
}

export function okMessage(c: Context, message: string, extra: Record<string, unknown> = {}) {
  return c.json({ success: true, message, ...extra }, 200);
}

export function notFound(c: Context, message: string) {
  return c.json({ type: 'https://iprn.online/problems/not-found', title: 'Not Found', status: 404, detail: message }, 404);
}

export async function getUserId(c: Context): Promise<string> {
  const user = c.get('user');
  if (!user) {
    throw new Error('No user in context');
  }
  return user.id;
}
