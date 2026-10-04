import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import './globals.scss';
export const metadata: Metadata = {
  title: { default: 'Кукареку Онлайн — Связь без лишнего кукареканья', template: '%s · Кукареку Онлайн' },
  description:
    'Подключайте свои устройства, выбирайте локацию и управляйте подключениями в одном личном кабинете.',
  openGraph: {
    title: 'Кукареку Онлайн',
    description: 'Ваши устройства. Ваши подключения. Один кабинет.',
    locale: 'ru_RU',
    type: 'website',
  },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" data-scroll-behavior="smooth">
      <body>
        <a href="#main" className="skip">
          К основному содержимому
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
