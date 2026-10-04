import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { backend } from '@/server/backend';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const access = z.object({ id: z.string().uuid(), accessKey: z.string().regex(/^[a-f0-9]{64}$/) });
const create = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    subject: z.string().trim().min(3).max(150),
    message: z.string().trim().min(10).max(5000),
    privacyAccepted: z.literal(true),
  })
  .strict();
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
  });
async function boundedBody(req: NextRequest) {
  const reader = req.body?.getReader();
  if (!reader) return null;
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.length;
    if (bytes > 24000) {
      await reader.cancel();
      throw new Error('TOO_LARGE');
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
async function forward(action: string, body: unknown) {
  const response = await backend(`/support/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return json(await response.json(), response.status);
}
export async function POST(req: NextRequest, context: { params: Promise<{ action: string }> }) {
  const origin = process.env.APP_ORIGIN ?? `${req.nextUrl.protocol}//${req.headers.get('host')}`;
  if (req.headers.get('origin') !== origin) return json({ code: 'HTTP_403' }, 403);
  try {
    const { action } = await context.params;
    const body = await boundedBody(req);
    if (action === 'create') {
      const parsed = create.safeParse(body);
      if (!parsed.success) return json({ code: 'HTTP_400' }, 400);
      return await forward('create', parsed.data);
    }
    if (action === 'read') {
      const parsed = access.strict().safeParse(body);
      if (!parsed.success) return json({ code: 'HTTP_400' }, 400);
      return await forward('read', parsed.data);
    }
    if (action === 'message') {
      const parsed = access
        .extend({ message: z.string().trim().min(1).max(5000) })
        .strict()
        .safeParse(body);
      if (!parsed.success) return json({ code: 'HTTP_400' }, 400);
      return await forward('message', parsed.data);
    }
    return json({ code: 'HTTP_404' }, 404);
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    if (code === 'RATE_LIMIT') return json({ code: 'HTTP_429' }, 429);
    if (code === 'NOT_FOUND') return json({ code: 'TICKET_NOT_FOUND' }, 404);
    if (code === 'TOO_LARGE') return json({ code: 'HTTP_400' }, 413);
    if (error instanceof SyntaxError) return json({ code: 'HTTP_400' }, 400);
    return json({ code: 'SUPPORT_UNAVAILABLE' }, 503);
  }
}
