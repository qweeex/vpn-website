import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { backend } from '@/server/backend';
import { readSession, writeSession, type ServerSession } from '@/server/session';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const authSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(12).max(128),
  })
  .strict();
const profileSchema = z
  .object({ nodeId: z.string().uuid(), deviceName: z.string().trim().min(1).max(100) })
  .strict();
const locationsSchema = z.array(
  z.object({
    id: z.string().uuid(),
    countryCode: z.string().regex(/^[A-Z]{2}$/),
    countryName: z.string().min(1),
    city: z.string(),
  }),
);
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const error = (code: string, status: number) => json({ code }, status);
async function relay(response: Response) {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    return error(body.code ?? `HTTP_${response.status}`, response.status);
  }
  const body = await response.text();
  return json(body ? JSON.parse(body) : null);
}
// Coalesce rotated refresh tokens within this server instance, including parallel tabs.
// Multi-instance deployment requires a shared session store/refresh lock (see README).
const refreshes = new Map<string, Promise<{ accessToken: string; refreshToken: string } | null>>();
async function rotate(session: ServerSession) {
  const token = session.refreshToken;
  let flight = refreshes.get(token);
  if (!flight) {
    flight = (async () => {
      const r = await backend('/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: token }),
      });
      if (r.status >= 500) throw new Error('Backend unavailable');
      return r.ok ? ((await r.json()) as { accessToken: string; refreshToken: string }) : null;
    })();
    refreshes.set(token, flight);
    setTimeout(() => refreshes.delete(token), 10000).unref();
  }
  return flight;
}
function publicProfile(value: Record<string, unknown>) {
  const { id, nodeId, deviceName, status, needsReconcile, createdAt, updatedAt, revokedAt } = value;
  return { id, nodeId, deviceName, status, needsReconcile, createdAt, updatedAt, revokedAt };
}
async function handle(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const expectedOrigin =
      process.env.APP_ORIGIN ?? `${req.nextUrl.protocol}//${req.headers.get('host')}`;
    if (req.method !== 'GET' && req.headers.get('origin') !== expectedOrigin)
      return error('HTTP_403', 403);
    const path = '/' + (await context.params).path.join('/');
    const session = readSession(req);
    if (path === '/auth/login' || path === '/auth/register') {
      if (req.method !== 'POST') return error('HTTP_405', 405);
      const parsed = authSchema.safeParse(await req.json().catch(() => null));
      if (!parsed.success) return error('HTTP_400', 400);
      const r = await backend(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      if (!r.ok) return relay(r);
      const tokens = await r.json();
      return writeSession(json({ authenticated: true, email: parsed.data.email }), {
        ...tokens,
        email: parsed.data.email,
        expiresAt: Date.now() + 30 * 86400000,
      });
    }
    if (path === '/auth/refresh' && req.method === 'POST') {
      if (!session) return writeSession(error('HTTP_401', 401), null);
      const tokens = await rotate(session);
      return tokens
        ? writeSession(json({ ok: true }), { ...session, ...tokens })
        : writeSession(error('INVALID_REFRESH_TOKEN', 401), null);
    }
    if (path === '/auth/logout' && req.method === 'POST') {
      if (session) {
        const r = await backend('/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: session.refreshToken }),
        });
        if (!r.ok) return relay(r);
      }
      return writeSession(json({ ok: true }), null);
    }
    if (path === '/session' && req.method === 'GET') {
      if (!session) return json({ authenticated: false });
      const r = await backend('/me/subscription', {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!r.ok) return relay(r);
      return json({ authenticated: true, email: session.email });
    }
    if (path === '/tariffs' && req.method === 'GET')
      return relay(await backend(path + pageQuery(req)));
    if (!session) return error('HTTP_401', 401);
    if (path === '/locations' && req.method === 'GET') {
      const response = await backend('/locations', {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) return relay(response);
      const parsed = locationsSchema.safeParse(await response.json());
      return parsed.success ? json(parsed.data) : error('LOCATIONS_UNAVAILABLE', 503);
    }
    const uuid = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';
    const profilePath = new RegExp(`^/profiles/${uuid}$`).test(path);
    const configPath = new RegExp(`^/profiles/${uuid}/config$`).test(path);
    const allowed =
      (path === '/me/subscription' && req.method === 'GET') ||
      (path === '/profiles' && ['GET', 'POST'].includes(req.method)) ||
      (profilePath && ['GET', 'DELETE'].includes(req.method)) ||
      (configPath && req.method === 'GET');
    if (!allowed) return error('HTTP_404', 404);
    let body: string | undefined;
    if (req.method === 'POST') {
      const parsed = profileSchema.safeParse(await req.json().catch(() => null));
      if (!parsed.success) return error('HTTP_400', 400);
      body = JSON.stringify(parsed.data);
    }
    const r = await backend(
      path + (path === '/profiles' && req.method === 'GET' ? pageQuery(req) : ''),
      {
        method: req.method,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body,
      },
    );
    if (!r.ok) return relay(r);
    if (configPath)
      return new NextResponse(r.body, {
        headers: {
          'Content-Type': 'application/x-openvpn-profile',
          'Content-Disposition':
            r.headers.get('Content-Disposition') ?? 'attachment; filename="kukareku.ovpn"',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    const data = await r.json();
    return json(
      path.startsWith('/profiles')
        ? Array.isArray(data)
          ? data.map(publicProfile)
          : publicProfile(data)
        : data,
    );
  } catch {
    return error('BACKEND_UNAVAILABLE', 503);
  }
}
function pageQuery(req: NextRequest) {
  const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get('limit')) || 25));
  const offset = Math.max(0, Number(req.nextUrl.searchParams.get('offset')) || 0);
  return `?limit=${Math.floor(limit)}&offset=${Math.floor(offset)}`;
}
export const GET = handle;
export const POST = handle;
export const DELETE = handle;
