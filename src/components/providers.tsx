'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ApiError } from '@/lib/errors';
import { keys } from '@/api/services';
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30000,
            retry: (count, e) =>
              !(e instanceof ApiError && e.status >= 400 && e.status < 500) && count < 1,
          },
          mutations: { retry: false },
        },
      }),
  );
  useEffect(() => {
    const expired = () => {
      void client.cancelQueries();
      client.removeQueries({ predicate: (query) => query.queryKey[0] !== keys.session[0] });
      client.setQueryData(keys.session, { authenticated: false });
    };
    const banned = () => client.setQueryData(['banned'], true);
    window.addEventListener('session-expired', expired);
    window.addEventListener('account-banned', banned);
    return () => {
      window.removeEventListener('session-expired', expired);
      window.removeEventListener('account-banned', banned);
    };
  }, [client]);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
