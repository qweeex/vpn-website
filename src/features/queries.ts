'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, keys } from '@/api/services';
export function useSubscription() {
  return useQuery({
    queryKey: keys.subscription,
    queryFn: api.subscription,
    refetchInterval: 30000,
  });
}
export function useProfiles() {
  return useQuery({
    queryKey: keys.profiles,
    queryFn: api.profiles,
    refetchInterval: (q) =>
      q.state.data?.some(
        (p) =>
          p.status === 'CREATING' ||
          p.status === 'REVOKING' ||
          (p.status === 'FAILED' && p.needsReconcile),
      )
        ? 5000
        : 30000,
  });
}
export function useLocations() {
  return useQuery({ queryKey: keys.locations, queryFn: api.locations });
}
export function useInvalidateVpn() {
  const client = useQueryClient();
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: keys.profiles }),
      client.invalidateQueries({ queryKey: keys.subscription }),
    ]);
}
