import { LegalPage } from '@/components/legal-page';
import { TicketThread } from '@/features/support';
export const metadata = {
  title: 'Обращение в поддержку',
  robots: { index: false, follow: false },
  referrer: 'no-referrer' as const,
};
export default function Page() {
  return (
    <LegalPage title="Ваше обращение">
      <TicketThread />
    </LegalPage>
  );
}
