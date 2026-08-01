import type { SseEvent } from '@iprn/types';
import type { LoggingService } from './logging';

interface Connection {
  userId: string;
  writer: WritableStreamDefaultWriter;
  closed: boolean;
}

export class SseService {
  private connections: Map<string, Set<Connection>> = new Map();

  constructor(private logging: LoggingService) {}

  subscribe(userId: string): { stream: ReadableStream; dispose: () => void } {
    const { readable, writable } = new TransformStream<any, any>();
    const writer = writable.getWriter();
    const conn: Connection = { userId, writer, closed: false };

    const conns = this.connections.get(userId) ?? new Set<Connection>();
    conns.add(conn);
    this.connections.set(userId, conns);

    const dispose = () => {
      if (conn.closed) return;
      conn.closed = true;
      conns.delete(conn);
      void writer.close();
      if (conns.size === 0) this.connections.delete(userId);
      this.logging.debug('sse', 'Connection closed', { userId });
    };

    return { stream: readable as ReadableStream, dispose };
  }

  async broadcast(userId: string, event: SseEvent): Promise<void> {
    const conns = this.connections.get(userId);
    if (!conns || conns.size === 0) return;
    const data = `event: ${event.eventType}\ndata: ${JSON.stringify(event.payload)}\nid: ${event.id}\n\n`;
    const dead: Connection[] = [];
    for (const conn of conns) {
      if (conn.closed) { dead.push(conn); continue; }
      try {
        await conn.writer.write(data);
      } catch {
        dead.push(conn);
      }
    }
    for (const conn of dead) {
      conns.delete(conn);
      if (conns.size === 0) this.connections.delete(userId);
    }
  }

  broadcastToAll(event: Omit<SseEvent, 'id'>): void {
    for (const [userId] of this.connections) {
      const evt: SseEvent = { id: Date.now(), userId, eventType: event.eventType, payload: event.payload, createdAt: event.createdAt };
      void this.broadcast(userId, evt);
    }
  }

  connectionCount(userId: string): number {
    return this.connections.get(userId)?.size ?? 0;
  }
}
