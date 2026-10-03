import { PublicShell } from '@/components/public-shell';
import { ActionLink, EmptyState } from '@/components/ui';
export default function NotFound() {
  return (
    <PublicShell>
      <main id="main" style={{ padding: '70px 20px' }}>
        <EmptyState title="Здесь пока тихо" action={<ActionLink href="/">На главную</ActionLink>}>
          Такой страницы нет. Вернёмся к знакомым маршрутам.
        </EmptyState>
      </main>
    </PublicShell>
  );
}
