import { ApiError } from '@/lib/errors';
let refreshFlight: Promise<boolean> | undefined;
async function refresh() {
  refreshFlight ??= fetch('/api/v1/auth/refresh', { method: 'POST' })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshFlight = undefined;
    });
  return refreshFlight;
}
export async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
      cache: 'no-store',
    });
  } catch {
    throw new ApiError('BACKEND_UNAVAILABLE');
  }
  if (response.status === 401 && retry && !path.startsWith('/auth/')) {
    if (await refresh()) return request<T>(path, options, false);
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('session-expired'));
  }
  if (response.status === 401 && !retry && typeof window !== 'undefined')
    window.dispatchEvent(new Event('session-expired'));
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error = new ApiError(data.code ?? `HTTP_${response.status}`, response.status);
    if (error.code === 'USER_BANNED' && typeof window !== 'undefined')
      window.dispatchEvent(new Event('account-banned'));
    throw error;
  }
  return response.json() as Promise<T>;
}
export async function downloadConfig(id: string) {
  const get = () => fetch(`/api/v1/profiles/${encodeURIComponent(id)}/config`, { cache: 'no-store' });
  let response = await get();
  if (response.status === 401 && (await refresh())) response = await get();
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    if (data.code === 'USER_BANNED') window.dispatchEvent(new Event('account-banned'));
    if (response.status === 401) window.dispatchEvent(new Event('session-expired'));
    throw new ApiError(data.code ?? `HTTP_${response.status}`, response.status);
  }
  const { downloadFilename } = await import('@/lib/domain');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = downloadFilename(response.headers.get('Content-Disposition'), `kukareku-${id}.ovpn`);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
