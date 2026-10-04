// Local operator tool: requires filesystem access to the deployment's SUPPORT_DB_PATH.
import { readFileSync } from 'node:fs';
import { staffTickets, addTicketMessage } from '../src/server/support-store.ts';
const [command, id, file] = process.argv.slice(2);
try {
  if (command === 'list') console.log(JSON.stringify(staffTickets(), null, 2));
  else if (command === 'read' && id) console.log(JSON.stringify(staffTickets(id), null, 2));
  else if (command === 'reply' && id && file) {
    const body = readFileSync(file, 'utf8').trim();
    if (!body || body.length > 5000) throw new Error('Reply must contain 1–5000 characters');
    addTicketMessage(id, body);
    console.log('Reply saved. Customer can read it on their private ticket page.');
  } else {
    console.error('Usage: npm run support -- list | read <id> | reply <id> <text-file>');
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Support command failed');
  process.exitCode = 1;
}
