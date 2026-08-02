import type { D1Database, KVNamespace, Queue, ExecutionContext, Request } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
  CACHE_KV: KVNamespace;
  RATE_LIMIT_KV: KVNamespace;
  SESSION_KV: KVNamespace;
  ASSETS: Fetcher;
  REWARD_PROCESSING_QUEUE: Queue<any>;
  WEBHOOK_DELIVERY_QUEUE: Queue<any>;
  ANALYTICS_QUEUE: Queue<any>;
  FRAUD_QUEUE: Queue<any>;
  APP_NAME: string;
  APP_VERSION: string;
  ADMIN_TOKEN: string;
}

export interface Session {
  userId: string;
  role: 'user' | 'admin';
  tokenId: string;
}

export const ADMIN_USER_ID = 'admin-user-001';
export const DEMO_USER_ID = 'demo-user-001';

export function nowIso(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

export function uuid(): string {
  return crypto.randomUUID();
}

const HEX = '0123456789abcdef';

function hexByte(b: number): string {
  return (HEX[b >> 4] ?? '0') + (HEX[b & 0x0f] ?? '0');
}

export function generateKeyId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => hexByte(b)).join('');
}

export function generateSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => hexByte(b)).join('');
}

export async function sha256Hex(data: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return Array.from(new Uint8Array(bytes), (b) => hexByte(b)).join('');
}

export async function hmacSha256Hex(key: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const keyBytes = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', keyBytes, enc.encode(data));
  return Array.from(new Uint8Array(sig), (b) => hexByte(b)).join('');
}

export function safeJsonParse(value: string | null): unknown {
  if (value === null || value === undefined) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  const saltHex = Array.from(saltBytes, (b) => b.toString(16).padStart(2, '0')).join('');
  const key = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(saltHex), iterations: 100000, hash: 'SHA-256' }, key, 192);
  const derivedHex = Array.from(new Uint8Array(derived), (b) => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${derivedHex}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, derivedHex] = stored.split(':');
  if (!saltHex || !derivedHex) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(saltHex), iterations: 100000, hash: 'SHA-256' }, key, 192);
  const testHex = Array.from(new Uint8Array(derived), (b) => b.toString(16).padStart(2, '0')).join('');
  const a = new Uint8Array(Array.from(derivedHex, (c, i) => c.charCodeAt(0)));
  const b = new Uint8Array(Array.from(testHex, (c, i) => c.charCodeAt(0)));
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return result === 0;
}

export async function generateToken(): Promise<string> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
