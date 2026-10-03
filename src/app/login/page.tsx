import { Suspense } from 'react';
import { AuthForm } from '@/features/auth';
import { Skeleton } from '@/components/ui';
export const metadata = { title: 'Войти', robots: { index: false, follow: false } };
export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <AuthForm />
    </Suspense>
  );
}
