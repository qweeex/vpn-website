import { Suspense } from 'react';
import { AuthForm } from '@/features/auth';
import { Skeleton } from '@/components/ui';
export const metadata = { title: 'Регистрация', robots: { index: false, follow: false } };
export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <AuthForm register />
    </Suspense>
  );
}
