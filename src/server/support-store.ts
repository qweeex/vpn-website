import { DatabaseSync } from 'node:sqlite';
import { randomBytes, createHash, randomUUID } from 'node:crypto';
import { mkdirSync, chmodSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
export interface TicketMessage {
  role: 'customer' | 'support';
  body: string;
  createdAt: string;
}
export interface Ticket {
  id: string;
  subject: string;
  status: 'open' | 'answered';
  createdAt: string;
  messages: TicketMessage[];
}
const hash = (s: string) => createHash('sha256').update(s).digest('hex');
function database() {
  // Runtime data lives on the deployment's persistent volume, never in the build bundle.
  const path = resolve(/* turbopackIgnore: true */ process.env.SUPPORT_DB_PATH || './data/support.sqlite');
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(path);
  chmodSync(path, 0o600);
  db.exec(`PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS tickets(id TEXT PRIMARY KEY, access_hash TEXT NOT NULL, email TEXT NOT NULL, email_hash TEXT NOT NULL, subject TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open', created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS messages(id TEXT PRIMARY KEY, ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE, role TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS ticket_messages ON messages(ticket_id, created_at);
 CREATE INDEX IF NOT EXISTS ticket_email_created ON tickets(email_hash, created_at);`);
  db.prepare('DELETE FROM tickets WHERE updated_at < ?').run(
    new Date(Date.now() - 180 * 86400000).toISOString(),
  );
  return db;
}
export function createTicket(email: string, subject: string, message: string) {
  const db = database();
  try {
    db.exec('BEGIN IMMEDIATE');
    const since = new Date(Date.now() - 3600000).toISOString();
    const count = db
      .prepare('SELECT count(*) as n FROM tickets WHERE email_hash=? AND created_at>?')
      .get(hash(email), since) as { n: number };
    const total = db.prepare('SELECT count(*) as n FROM tickets WHERE created_at>?').get(since) as {
      n: number;
    };
    if (count.n >= 5 || total.n >= 200) throw new Error('RATE_LIMIT');
    const id = randomUUID();
    const accessKey = randomBytes(32).toString('hex');
    const now = new Date().toISOString();
    db.prepare(
      'INSERT INTO tickets(id,access_hash,email,email_hash,subject,created_at,updated_at) VALUES(?,?,?,?,?,?,?)',
    ).run(id, hash(accessKey), email, hash(email), subject, now, now);
    db.prepare('INSERT INTO messages VALUES(?,?,?,?,?)').run(
      randomUUID(),
      id,
      'customer',
      message,
      now,
    );
    db.exec('COMMIT');
    return { id, accessKey };
  } catch (error) {
    if (db.isTransaction) db.exec('ROLLBACK');
    throw error;
  } finally {
    db.close();
  }
}
function ticketFromDb(db: DatabaseSync, id: string): Ticket | null {
  const row = db
    .prepare('SELECT id,subject,status,created_at as createdAt FROM tickets WHERE id=?')
    .get(id);
  if (!row) return null;
  const messages = db
    .prepare(
      'SELECT role,body,created_at as createdAt FROM messages WHERE ticket_id=? ORDER BY created_at,rowid',
    )
    .all(id);
  return { ...row, messages } as unknown as Ticket;
}
export function readTicket(id: string, accessKey: string) {
  const db = database();
  try {
    if (!db.prepare('SELECT id FROM tickets WHERE id=? AND access_hash=?').get(id, hash(accessKey)))
      return null;
    return ticketFromDb(db, id);
  } finally {
    db.close();
  }
}
export function addTicketMessage(id: string, body: string, accessKey?: string) {
  const db = database();
  try {
    db.exec('BEGIN IMMEDIATE');
    if (!db.prepare('SELECT id FROM tickets WHERE id=?').get(id)) throw new Error('NOT_FOUND');
    if (
      accessKey !== undefined &&
      !db.prepare('SELECT id FROM tickets WHERE id=? AND access_hash=?').get(id, hash(accessKey))
    )
      throw new Error('NOT_FOUND');
    const role = accessKey === undefined ? 'support' : 'customer';
    const count = db
      .prepare('SELECT count(*) as n FROM messages WHERE ticket_id=? AND role=? AND created_at>?')
      .get(id, role, new Date(Date.now() - 60000).toISOString()) as { n: number };
    if (count.n >= 10) throw new Error('RATE_LIMIT');
    const now = new Date().toISOString();
    db.prepare('INSERT INTO messages VALUES(?,?,?,?,?)').run(randomUUID(), id, role, body, now);
    db.prepare('UPDATE tickets SET status=?,updated_at=? WHERE id=?').run(
      role === 'support' ? 'answered' : 'open',
      now,
      id,
    );
    db.exec('COMMIT');
    return ticketFromDb(db, id);
  } catch (error) {
    if (db.isTransaction) db.exec('ROLLBACK');
    throw error;
  } finally {
    db.close();
  }
}
export function staffTickets(id?: string) {
  const db = database();
  try {
    return id
      ? ticketFromDb(db, id)
      : db
          .prepare(
            'SELECT id,email,subject,status,updated_at FROM tickets ORDER BY updated_at DESC LIMIT 100',
          )
          .all();
  } finally {
    db.close();
  }
}
