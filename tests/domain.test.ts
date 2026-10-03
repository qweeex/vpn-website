import { describe, expect, it } from 'vitest';
import {
  activeSubscription,
  downloadFilename,
  money,
  occupiedCount,
  safeReturn,
} from '../src/lib/domain';
import { ApiError, errorMessage } from '../src/lib/errors';
import type { Profile, Subscription } from '../src/api/types';
describe('backend-derived rules', () => {
  it('formats kopecks as rubles', () => expect(money(29900, 'RUB')).toMatch(/^299/));
  it('counts pending reconciliation but not revocations', () => {
    const data = [
      { status: 'ACTIVE' },
      { status: 'CREATING' },
      { status: 'FAILED', needsReconcile: true },
      { status: 'FAILED', needsReconcile: false },
      { status: 'REVOKING' },
      { status: 'REVOKED' },
    ] as Profile[];
    expect(occupiedCount(data)).toBe(3);
  });
  it('rejects expired or cancelled subscriptions', () => {
    expect(activeSubscription(null)).toBe(false);
    expect(activeSubscription({ status: 'ACTIVE', expiresAt: '2020-01-01' } as Subscription)).toBe(
      false,
    );
    expect(
      activeSubscription({ status: 'CANCELLED', expiresAt: '2099-01-01' } as Subscription),
    ).toBe(false);
    expect(activeSubscription({ status: 'ACTIVE', expiresAt: '2099-01-01' } as Subscription)).toBe(
      true,
    );
  });
  it.each([
    'INVALID_CREDENTIALS',
    'PROFILE_LIMIT_REACHED',
    'NO_ACTIVE_SUBSCRIPTION',
    'SUBSCRIPTION_EXPIRED',
    'USER_BANNED',
    'NODE_OFFLINE',
    'NODE_DISABLED',
    'NODE_MAINTENANCE',
    'NODE_PROFILE_LIMIT_REACHED',
    'VPN_AGENT_UNAVAILABLE',
  ])('maps %s without leaking codes', (code) => {
    expect(errorMessage(new ApiError(code))).not.toContain(code);
    expect(errorMessage(new ApiError(code))).not.toContain('Request failed');
  });
  it('does not expose arbitrary server messages', () =>
    expect(errorMessage(new Error('password=secret'))).not.toContain('secret'));
  it('preserves safe destinations only', () => {
    expect(safeReturn('/app/vpn')).toBe('/app/vpn');
    expect(safeReturn('/checkout/123')).toBe('/checkout/123');
    for (const url of [
      '//evil.com',
      '/\\evil.com',
      'https://evil.com',
      '/app/\nheader',
      '/api/auth/logout',
    ])
      expect(safeReturn(url)).toBe('/app');
  });
  it('honors download filenames and strips traversal', () => {
    expect(downloadFilename('attachment; filename="actual.ovpn"', 'fallback.ovpn')).toBe(
      'actual.ovpn',
    );
    expect(downloadFilename("attachment; filename*=UTF-8''My%20VPN.ovpn", 'fallback.ovpn')).toBe(
      'My VPN.ovpn',
    );
    expect(downloadFilename('attachment; filename="../../private.ovpn"', 'fallback.ovpn')).toBe(
      '.._.._private.ovpn',
    );
  });
});
