import { request } from './client';
import type { CreateProfile, Location, Profile, Session, Subscription, Tariff } from './types';
import { ApiError } from '@/lib/errors';
async function allPages<T>(path: string) {
  const result: T[] = [];
  for (let offset = 0; ; offset += 100) {
    const page = await request<T[]>(`${path}?limit=100&offset=${offset}`);
    result.push(...page);
    if (page.length < 100) return result;
  }
}
export const api = {
  session: () => request<Session>('/session'),
  login: (data: { email: string; password: string }, register = false) =>
    request<Session>(`/auth/${register ? 'register' : 'login'}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  tariffs: () => allPages<Tariff>('/tariffs'),
  subscription: () => request<Subscription | null>('/me/subscription'),
  profiles: () => allPages<Profile>('/profiles'),
  profile: (id: string) => request<Profile>(`/profiles/${encodeURIComponent(id)}`),
  locations: () => request<Location[]>('/locations'),
  createProfile: (data: CreateProfile) =>
    request<Profile>('/profiles', { method: 'POST', body: JSON.stringify(data) }),
  deleteProfile: (id: string) =>
    request<Profile>(`/profiles/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
export interface PaymentService {
  available: boolean;
  purchase(tariffId: string): Promise<{ redirectUrl: string }>;
}
export const paymentService: PaymentService = {
  available: false,
  async purchase() {
    throw new ApiError('PAYMENT_UNAVAILABLE');
  },
};
export const keys = {
  session: ['session'] as const,
  tariffs: ['tariffs'] as const,
  subscription: ['subscription'] as const,
  profiles: ['profiles'] as const,
  locations: ['locations'] as const,
};
