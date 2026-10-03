import 'server-only';
export async function backend(path: string, options: RequestInit = {}) {
  const base = process.env.BACKEND_URL ?? 'http://127.0.0.1:3000';
  return fetch(`${base.replace(/\/$/, '')}/api/v1${path}`, {
    ...options,
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(30000),
  });
}
