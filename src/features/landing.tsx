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
              ВАШ ИНТЕРНЕТ. ВАШИ ПРАВИЛА.
            </div>
            <h1>
              VPN без лишнего
              <br />
              <span>кукареканья.</span>
            </h1>
            <p>
              Для работы, любимых сервисов и всего,
              <br className={s.desktopBreak} /> что связывает вас с миром.
            </p>
            <div className={s.heroActions}>
              <ActionLink href="/pricing">Подключить VPN</ActionLink>
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
              НА СВЯЗИ С МИРОМ
            </div>
            <Image
              src="/brand.png"
              alt="Петух КукарекуVPN в солнечных очках на фоне земного шара"
              width={530}
              height={530}
              priority
              className={s.mascot}
            />
            <div className={s.visualBottom}>
              <span>Чуть больше свободы.</span>
              <span>И немного характера. ↗</span>
            </div>
          </div>
        </section>
        <div className={s.compatibility}>
          <span>Один VPN. Привычные устройства.</span>
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
                Интернет — проще.
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
              <span className={s.kicker}>ПЛАНЫ НА СВОБОДНЫЙ ИНТЕРНЕТ</span>
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
                text: 'Скачайте файл настроек и откройте его в OpenVPN Connect.',
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
