import type { Profile, Subscription } from '@/api/types';
export const safeReturn = (value: string | null | undefined) =>
  value && /^\/(?:app(?:\/|$|\?)|checkout\/)/.test(value) && !/[\\\r\n]/.test(value)
    ? value
    : '/app';
export const money = (price: number, currency: string) => {
  try {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price / 100);
  } catch {
    return `${price / 100} ${currency}`;
  }
};
export const date = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(value),
  );
export const activeSubscription = (s: Subscription | null | undefined) =>
  !!s && s.status === 'ACTIVE' && new Date(s.expiresAt).getTime() > Date.now();
export const occupiedCount = (profiles: Profile[]) =>
  profiles.filter(
    (p) =>
      p.status === 'ACTIVE' ||
      p.status === 'CREATING' ||
      (p.status === 'FAILED' && p.needsReconcile),
  ).length;
export const statusText = {
  ACTIVE: 'Активно',
  CREATING: 'Создаётся…',
  REVOKING: 'Удаляется…',
  REVOKED: 'Удалено',
  FAILED: 'Не удалось создать',
};
export function downloadFilename(header: string | null, fallback: string) {
  const encoded = header?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  let name = header?.match(/filename="([^"]+)"/i)?.[1] ?? fallback;
  if (encoded) {
    try {
      name = decodeURIComponent(encoded);
    } catch {}
  }
  name = name.replace(/[\\/\x00-\x1f]/g, '_');
  return name.endsWith('.ovpn') ? name : `${name}.ovpn`;
}
