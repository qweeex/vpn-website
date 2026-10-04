import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createTicket,
  readTicket,
  addTicketMessage,
  staffTickets,
} from '../src/server/support-store';
let dir: string;
let previous: string | undefined;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'kukareku-support-'));
  previous = process.env.SUPPORT_DB_PATH;
  process.env.SUPPORT_DB_PATH = join(dir, 'tickets.sqlite');
});
afterEach(() => {
  if (previous === undefined) delete process.env.SUPPORT_DB_PATH;
  else process.env.SUPPORT_DB_PATH = previous;
  rmSync(dir, { recursive: true, force: true });
});
describe('persistent support tickets', () => {
  it('persists requests and staff replies across database connections', () => {
    const access = createTicket('test@example.com', 'Тестовая тема', 'Тестовое сообщение');
    expect(readTicket(access.id, access.accessKey)?.messages).toHaveLength(1);
    addTicketMessage(access.id, 'Ответ оператора');
    expect(readTicket(access.id, access.accessKey)).toMatchObject({
      status: 'answered',
      messages: [{ role: 'customer' }, { role: 'support', body: 'Ответ оператора' }],
    });
    addTicketMessage(access.id, 'Спасибо', access.accessKey);
    expect(readTicket(access.id, access.accessKey)?.status).toBe('open');
    expect(staffTickets()).toHaveLength(1);
  });
  it('does not disclose tickets or accept messages with another key', () => {
    const first = createTicket('one@example.com', 'Первый тикет', 'Тестовый вопрос');
    const second = createTicket('two@example.com', 'Второй тикет', 'Другой вопрос');
    expect(readTicket(first.id, second.accessKey)).toBeNull();
    expect(() => addTicketMessage(first.id, 'Чужое сообщение', second.accessKey)).toThrow(
      'NOT_FOUND',
    );
    expect(readTicket(first.id, first.accessKey)?.messages).toHaveLength(1);
  });
  it('limits repeated submissions', () => {
    for (let i = 0; i < 5; i++)
      createTicket('test@example.com', 'Тестовая тема', 'Тестовый вопрос');
    expect(() => createTicket('test@example.com', 'Тестовая тема', 'Тестовый вопрос')).toThrow(
      'RATE_LIMIT',
    );
    expect(staffTickets()).toHaveLength(5);
  });
});
