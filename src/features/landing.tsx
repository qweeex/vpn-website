import Image from 'next/image';
import { ArrowDown, Check, Globe2, Laptop, SlidersHorizontal, ArrowUpRight } from 'lucide-react';
import { PublicShell } from '@/components/public-shell';
import { ActionLink } from '@/components/ui';
import { Tariffs } from './tariffs';
import s from './marketing.module.scss';
export function Landing() {
  return (
    <PublicShell>
      <main id="main">
        <section className={s.hero}>
          <div className={s.heroCopy}>
            <div className={s.eyebrow}>
              <span />
              ПОДКЛЮЧЕНИЯ ДЛЯ ВАШИХ УСТРОЙСТВ
            </div>
            <h1>
              Связь без лишнего
              <br />
              <span>кукареканья.</span>
            </h1>
            <p>
              Подключайте телефон или компьютер
              <br className={s.desktopBreak} /> и управляйте настройками в личном кабинете.
            </p>
            <div className={s.heroActions}>
              <ActionLink href="/pricing">Подключить устройство</ActionLink>
              <a href="#how" className={s.textLink}>
                Как это работает <ArrowUpRight size={17} />
              </a>
            </div>
            <div className={s.heroNote}>
              <Check size={16} />
              Свои устройства <span>·</span> Выбор локации <span>·</span> Всё под рукой
            </div>
          </div>
          <div className={s.heroVisual}>
            <div className={s.orbit} />
            <div className={s.visualLabel}>
              <span />
              ПОДКЛЮЧЕНИЯ ПОД РУКОЙ
            </div>
            <Image
              src="/kukareku-online.png"
              alt="Кукареку Онлайн — петух с щитом на фоне земного шара"
              width={1536}
              height={1024}
              sizes="(max-width: 680px) 340px, (max-width: 1000px) 45vw, 540px"
              preload
              className={s.mascot}
            />
            <div className={s.visualBottom}>
              <span>Понятные настройки.</span>
              <span>Удобное управление. ↗</span>
            </div>
          </div>
        </section>
        <div className={s.compatibility}>
          <span>Один кабинет. Привычные устройства.</span>
          <div>
            <span>macOS</span>
            <span>Windows</span>
            <span>iOS</span>
            <span>Android</span>
          </div>
          <a href="#features" aria-label="К возможностям">
            <ArrowDown size={18} />
          </a>
        </div>
        <section id="features" className={s.section}>
          <div className={s.sectionHeading}>
            <div>
              <span className={s.kicker}>ВСЁ НУЖНОЕ. НИЧЕГО ЛИШНЕГО.</span>
              <h2>
                Подключение — проще.
                <br />
                Управление — тоже.
              </h2>
            </div>
            <p>
              Мы собрали всё в одном месте.
              <br />
              Вам остаётся выбрать, что подключить.
            </p>
          </div>
          <div className={s.benefits}>
            {[
              {
                icon: Laptop,
                title: 'Для ваших устройств',
                text: 'Телефон, ноутбук или домашний ПК. Подключайте устройства в рамках своего тарифа.',
                number: '01',
              },
              {
                icon: Globe2,
                title: 'Выбирайте локацию',
                text: 'Доступные страны — в личном кабинете. Выберите подходящую при создании подключения.',
                number: '02',
              },
              {
                icon: SlidersHorizontal,
                title: 'Всё под контролем',
                text: 'Добавляйте устройства, скачивайте настройки и удаляйте подключения без лишних шагов.',
                number: '03',
              },
            ].map((b) => (
              <article key={b.number}>
                <div className={s.benefitTop}>
                  <b.icon size={25} strokeWidth={1.6} />
                  <span>{b.number}</span>
                </div>
                <h3>{b.title}</h3>
                <p>{b.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className={s.pricingSection} id="pricing">
          <div className={s.section}>
            <div className={s.centerHeading}>
              <span className={s.kicker}>СТОИМОСТЬ И УСЛОВИЯ ПОДПИСКИ</span>
              <h2>Сколько устройств у вас на примете?</h2>
              <p>Выберите тариф под свой ритм жизни.</p>
            </div>
            <Tariffs />
            <p className={s.pricingNote}>
              Условия и доступность тарифов обновляются при загрузке страницы.
            </p>
          </div>
        </section>
        <section className={s.section} id="how">
          <div className={s.sectionHeading}>
            <div>
              <span className={s.kicker}>ПЕРВОЕ ПОДКЛЮЧЕНИЕ</span>
              <h2>
                Раз, два —<br />и вы на связи.
              </h2>
            </div>
            <p>
              Без сложных настроек.
              <br />
              Проведём через каждый шаг.
            </p>
          </div>
          <div className={s.steps}>
            {[
              {
                n: '01',
                title: 'Выберите тариф',
                text: 'Создайте аккаунт и посмотрите условия подписки.',
              },
              {
                n: '02',
                title: 'Добавьте устройство',
                text: 'С активной подпиской выберите локацию и задайте понятное имя.',
              },
              {
                n: '03',
                title: 'Подключайтесь',
                text: 'Скачайте файл настроек и импортируйте его в совместимое приложение.',
              },
            ].map((step) => (
              <article key={step.n}>
                <span>{step.n}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
          <div className={s.bottomCta}>
            <div>
              <h2>
                Пусть утро начинается
                <br />с хорошего подключения.
              </h2>
              <p>Кукареку. И вперёд.</p>
            </div>
            <ActionLink href="/pricing">Выбрать свой тариф</ActionLink>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
