import Link from 'next/link';
import { project } from '@/config/project';
import s from './legal.module.scss';
export function LegalLinks() {
  return (
    <div className={s.linksWrap}>
      <nav className={s.links} aria-label="Документы и поддержка">
        <Link href="/privacy">Политика конфиденциальности</Link>
        <Link href="/terms">Пользовательское соглашение</Link>
        <Link href="/support">Контакты поддержки</Link>
        <Link href="/pricing">Цены и тарифы</Link>
      </nav>
      {project.approvalCode && <span className={s.code}>Код проверки: {project.approvalCode}</span>}
    </div>
  );
}
export function SupportContact() {
  return (
    <div className={s.contact}>
      <Link href="/support">Написать в поддержку — создать тикет</Link>
      <p>Ответы доступны по закрытой ссылке обращения. Регистрация не требуется.</p>
    </div>
  );
}
