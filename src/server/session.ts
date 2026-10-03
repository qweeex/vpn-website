import 'server-only';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import type { NextRequest, NextResponse } from 'next/server';
export const COOKIE = 'kukareku_session';
export interface ServerSession {
  accessToken: string;
  refreshToken: string;
  email: string;
  expiresAt: number;
}
const local = globalThis as typeof globalThis & { developmentSessionKey?: Buffer };
function key() {
  const secret = process.env.SESSION_SECRET;
  if (secret && /^[a-f\d]{64}$/i.test(secret)) return Buffer.from(secret, 'hex');
  if (process.env.NODE_ENV === 'production')
    throw new Error('SESSION_SECRET must contain 64 hex characters');
  return (local.developmentSessionKey ??= randomBytes(32));
}
export function readSession(req: NextRequest): ServerSession | null {
  const value = req.cookies.get(COOKIE)?.value;
  if (!value) return null;
  try {
    const [iv, tag, encrypted] = value.split('.').map((s) => Buffer.from(s, 'base64url'));
    const decipher = createDecipheriv('aes-256-gcm', key(), iv);
    decipher.setAuthTag(tag);
    const session = JSON.parse(
      Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(),
    ) as ServerSession;
    return session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}
export function writeSession(res: NextResponse, session: ServerSession | null) {
  let value = '';
  if (session) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key(), iv);
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(session)), cipher.final()]);
    value = [iv, cipher.getAuthTag(), encrypted].map((b) => b.toString('base64url')).join('.');
  }
  res.cookies.set(COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: session ? Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000)) : 0,
  });
  return res;
}
