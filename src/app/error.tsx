'use client';
import { Button } from '@/components/ui';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" style={{ padding: '70px 24px', textAlign: 'center' }}>
      <h1>Не удалось открыть страницу</h1>
      <p>Попробуйте загрузить её ещё раз.</p>
      <Button onClick={reset}>Попробовать снова</Button>
    </main>
  );
}
