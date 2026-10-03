import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import './globals.scss';
export const metadata: Metadata = {
  title: { default: 'КукарекуVPN — VPN без лишнего кукареканья', template: '%s · КукарекуVPN' },
  description:
    'Подключайте свои устройства, выбирайте локацию и управляйте VPN в одном личном кабинете.',
  openGraph: {
    title: 'КукарекуVPN',
    description: 'Ваши устройства. Ваши маршруты. Один VPN.',
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
