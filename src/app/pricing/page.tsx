import { PublicShell } from '@/components/public-shell';
import { Tariffs } from '@/features/tariffs';
import s from '@/features/marketing.module.scss';
export const metadata = { title: 'Тарифы' };
export default function Page() {
  return (
    <PublicShell>
      <main id="main" className={`${s.section} ${s.pricingPage}`}>
        <div className={s.centerHeading}>
          <span className={s.kicker}>ВАШ ПЛАН ПОДКЛЮЧЕНИЯ</span>
          <h1>Тариф под ваш ритм</h1>
          <p>Все условия перед вами. Выберите, сколько устройств подключить.</p>
        </div>
        <Tariffs />
      </main>
    </PublicShell>
  );
}
