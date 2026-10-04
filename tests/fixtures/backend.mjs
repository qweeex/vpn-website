// Test-only upstream. Never imported by the application or production scripts.
import { createServer } from 'node:http';
const tariff = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Тестовый тариф API',
  description: 'Тариф из тестового backend',
  price: 29900,
  currency: 'RUB',
  durationDays: 30,
  profileLimit: 3,
  isActive: true,
  isPublic: true,
  sortOrder: 0,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};
const nodeId = '22222222-2222-4222-8222-222222222222';
const tickets = new Map();
const sessions = new Map();
const profiles = new Map();
function profile(i = 1) {
  return {
    id: `33333333-3333-4333-8333-${String(i).padStart(12, '0')}`,
    nodeId,
    deviceName: i === 1 ? 'MacBook Pro' : `Устройство ${i}`,
    status: 'ACTIVE',
    needsReconcile: false,
    createdAt: '2026-10-01T10:00:00Z',
    updatedAt: '2026-10-01T10:00:00Z',
    revokedAt: null,
    clientName: 'INTERNAL_CLIENT_SHOULD_NOT_LEAK',
    lastError: null,
  };
}
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname.slice('/api/v1'.length);
  let raw = '';
  for await (const chunk of req) raw += chunk;
  const body = raw ? JSON.parse(raw) : {};
  const reply = (data, status = 200) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };
  const fail = (code, status = 409) => reply({ code, statusCode: status, message: code }, status);
  if (!url.pathname.startsWith('/api/v1/')) return fail('HTTP_404', 404);
  if (path === '/support/create') {
    const id = crypto.randomUUID();
    const accessKey =
      crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
    tickets.set(id, {
      accessKey,
      ticket: {
        id,
        subject: body.subject,
        status: 'open',
        createdAt: new Date().toISOString(),
        messages: [{ role: 'customer', body: body.message, createdAt: new Date().toISOString() }],
      },
    });
    return reply({ id, accessKey }, 201);
  }
  if (path === '/support/read' || path === '/support/message') {
    const entry = tickets.get(body.id);
    if (!entry || entry.accessKey !== body.accessKey) return fail('TICKET_NOT_FOUND', 404);
    if (path.endsWith('/message')) {
      entry.ticket.messages.push({
        role: 'customer',
        body: body.message,
        createdAt: new Date().toISOString(),
      });
      entry.ticket.status = 'open';
    }
    return reply(entry.ticket);
  }
  // Test-only staff endpoint. Production authorization is covered by backend integration tests.
  if (path.startsWith('/admin/support/tickets/') && path.endsWith('/messages')) {
    if (req.headers.authorization !== 'Bearer test-staff') return fail('HTTP_401', 401);
    const entry = tickets.get(path.split('/')[4]);
    if (!entry) return fail('TICKET_NOT_FOUND', 404);
    entry.ticket.messages.push({
      role: 'support',
      body: body.message,
      createdAt: new Date().toISOString(),
    });
    entry.ticket.status = 'answered';
    return reply(entry.ticket);
  }
  if (path === '/tariffs') return reply(Number(url.searchParams.get('offset')) > 0 ? [] : [tariff]);
  if (path === '/auth/login' || path === '/auth/register') {
    if (body.password === 'wrong-password') return fail('INVALID_CREDENTIALS', 401);
    const key = body.email;
    const refresh = `refresh-${crypto.randomUUID()}`;
    sessions.set(refresh, key);
    const count = key.startsWith('limit')
      ? 3
      : key.startsWith('none') || key.startsWith('create')
        ? 0
        : 1;
    profiles.set(
      key,
      Array.from({ length: count }, (_, i) => profile(i + 1)),
    );
    return reply({
      accessToken: `${key.startsWith('refresh') || key.startsWith('invalidrefresh') ? 'expired' : 'access'}:${key}`,
      refreshToken: refresh,
    });
  }
  if (path === '/auth/refresh') {
    const email = sessions.get(body.refreshToken);
    if (!email || email.startsWith('invalidrefresh')) return fail('INVALID_REFRESH_TOKEN', 401);
    sessions.delete(body.refreshToken);
    const refresh = `refresh-${crypto.randomUUID()}`;
    sessions.set(refresh, email);
    return reply({ accessToken: `access:${email}`, refreshToken: refresh });
  }
  if (path === '/auth/logout') {
    sessions.delete(body.refreshToken);
    return reply({ ok: true });
  }
  const auth = req.headers.authorization ?? '';
  if (!auth.startsWith('Bearer access:')) return fail('HTTP_401', 401);
  const email = auth.replace('Bearer access:', '');
  if (path === '/locations') {
    if (email.startsWith('locationsdown')) return fail('BACKEND_UNAVAILABLE', 503);
    if (email.startsWith('locationsnone')) return reply([]);
    return reply([
      {
        id: nodeId,
        countryCode: 'DE',
        countryName: 'Германия',
        city: 'Франкфурт',
        agentUrl: 'INTERNAL_URL',
        credentials: 'INTERNAL_SECRET',
      },
    ]);
  }
  if (path === '/me/subscription')
    return reply(
      email.startsWith('none')
        ? null
        : {
            id: '44444444-4444-4444-8444-444444444444',
            userId: '55555555-5555-4555-8555-555555555555',
            tariffId: tariff.id,
            tariffName: tariff.name,
            price: tariff.price,
            currency: tariff.currency,
            profileLimit: 3,
            durationDays: 30,
            status: email.startsWith('expired') ? 'EXPIRED' : 'ACTIVE',
            startedAt: '2026-10-01T00:00:00Z',
            expiresAt: email.startsWith('expired')
              ? '2020-01-01T00:00:00Z'
              : '2099-01-01T00:00:00Z',
          },
    );
  let list = profiles.get(email) ?? [];
  if (path === '/profiles' && req.method === 'GET') {
    const offset = Number(url.searchParams.get('offset')) || 0;
    return reply(list.slice(offset, offset + (Number(url.searchParams.get('limit')) || 25)));
  }
  if (path === '/profiles' && req.method === 'POST') {
    if (email.startsWith('banned')) return fail('USER_BANNED', 403);
    if (email.startsWith('limit')) return fail('PROFILE_LIMIT_REACHED');
    if (body.deviceName === 'Offline') return fail('NODE_OFFLINE');
    const p = { ...profile(list.length + 1), nodeId: body.nodeId, deviceName: body.deviceName };
    list = [p, ...list];
    profiles.set(email, list);
    return reply(p, 201);
  }
  const id = path.split('/')[2];
  const p = list.find((p) => p.id === id);
  if (!p) return fail('PROFILE_NOT_FOUND', 404);
  if (path.endsWith('/config')) {
    if (email.startsWith('banned')) return fail('USER_BANNED', 403);
    res.writeHead(200, {
      'Content-Type': 'application/x-openvpn-profile',
      'Content-Disposition': 'attachment; filename="from-backend.ovpn"',
    });
    return res.end('client\n# test fixture only\n');
  }
  if (req.method === 'DELETE') p.status = 'REVOKED';
  return reply(p);
});
server.listen(4321, '127.0.0.1');
