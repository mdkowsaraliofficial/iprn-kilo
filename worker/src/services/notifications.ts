import type { Db } from '../db';
import type { Env } from '../config';
import type { Notification, NotificationType } from '@iprn/types';
import { uuid, nowIso } from '../config';
import type { LoggingService } from './logging';

export class NotificationsService {
  constructor(private db: Db, private env: Env, private logging: LoggingService) {}

  async create(userId: string, type: NotificationType, title: string, body: string, data: Record<string, unknown> = {}): Promise<Notification> {
    const id = `notif_${uuid()}`;
    const now = nowIso();
    await this.db.run(
      'INSERT INTO notifications (id, user_id, type, title, body, read, data, created_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)',
      [id, userId, type, title, body, JSON.stringify(data), now]
    );
    return { id, userId, type, title, body, read: false, data, createdAt: now };
  }

  async list(userId: string, opts: { limit?: number; cursor?: string | null; unreadOnly?: boolean }): Promise<{ data: Notification[]; meta: { total: number; nextCursor: string | null } }> {
    const limit = Math.min(opts.limit ?? 25, 100);
    const wheres: string[] = ['user_id = ?'];
    const params: unknown[] = [userId];
    if (opts.unreadOnly) { wheres.push('read = 0'); }
    if (opts.cursor) { wheres.push('created_at < ?'); params.push(opts.cursor); }
    const whereClause = wheres.join(' AND ');
    const totalRes = await this.db.first<{ c: number }>('SELECT COUNT(*) as c FROM notifications WHERE ' + whereClause, params);
    const rows = await this.db.query<{
      id: string; user_id: string; type: string; title: string; body: string; read: number; data: string; created_at: string;
    }>(
      `SELECT id, user_id, type, title, body, read, data, created_at FROM notifications WHERE ${whereClause} ORDER BY created_at DESC LIMIT ?`,
      [...params, limit + 1]
    );
    const hasNext = rows.length > limit;
    const data = rows.slice(0, limit);
    const nextCursor = hasNext ? (data[data.length - 1]?.created_at ?? null) : null;
    const formatted: Notification[] = data.map((r) => ({
      id: r.id, userId: r.user_id, type: r.type as NotificationType, title: r.title, body: r.body,
      read: r.read === 1, data: r.data ? JSON.parse(r.data) : {}, createdAt: r.created_at,
    }));
    return { data: formatted, meta: { total: totalRes ? Number(totalRes.c) : 0, nextCursor } };
  }

  async markRead(id: string, userId: string): Promise<void> {
    await this.db.run('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?', [id, userId]);
  }

  async markAllRead(userId: string): Promise<void> {
    await this.db.run('UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0', [userId]);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.db.run('DELETE FROM notifications WHERE id = ? AND user_id = ?', [id, userId]);
  }

  async sendToUsers(data: { type: string; title: string; body: string; userIds?: string[]; eventData?: Record<string, unknown> }): Promise<number> {
    const now = nowIso();
    let sent = 0;
    if (data.userIds && data.userIds.length > 0) {
      for (const uid of data.userIds) {
        await this.db.run(
          'INSERT INTO notifications (id, user_id, type, title, body, read, data, created_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)',
          [`notif_${uuid()}`, uid, data.type, data.title, data.body, JSON.stringify(data.eventData ?? {}), now]
        );
        sent++;
      }
    } else {
      const res = await this.db.run(
        `INSERT INTO notifications (id, user_id, type, title, body, read, data, created_at)
         SELECT ?, id, ?, ?, ?, 0, ?, ? FROM users WHERE status = 'active'`,
        [`notif_${uuid()}`, data.type, data.title, data.body, JSON.stringify(data.eventData ?? {}), now]
      );
      sent = (res.meta as any)?.changes ?? 0;
    }
    this.logging.info('notifications', 'Bulk notification sent', { sent, type: data.type });
    return sent;
  }

  async unreadCount(userId: string): Promise<number> {
    const row = await this.db.first<{ c: number }>('SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND read = 0', [userId]);
    return row ? Number(row.c) : 0;
  }
}
