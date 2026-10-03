import { Suspense } from 'react';
import { AppShell } from '@/features/app-shell';
import { Skeleton } from '@/components/ui';
export const metadata = { robots: { index: false, follow: false } };
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Skeleton />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
