'use client';
import { LegalLinks } from '@/components/legal-links';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api, keys } from '@/api/services';
import { Brand } from './brand';
import { ActionLink } from './ui';
import s from './public.module.scss';
export function PublicShell({ children }: { children: React.ReactNode }) {
  const session = useQuery({ queryKey: keys.session, queryFn: api.session });
  return (
    <>
      <header className={s.header}>
        <div className={s.headerInner}>
          <Brand />
          <nav className={s.nav} aria-label="Основная навигация">
            <Link href="/#features">Возможности</Link>
            <Link href="/pricing">Тарифы</Link>
            <Link href="/#how">Как подключиться</Link>
          </nav>
          <div className={s.headerActions}>
            {session.data?.authenticated ? (
              <ActionLink href="/app">Личный кабинет</ActionLink>
            ) : (
              <>
                <Link href="/login" className={s.login}>
                  Войти
                </Link>
                <span className={s.headerCta}>
                  <ActionLink href="/pricing">Подключить устройство</ActionLink>
                </span>
              </>
            )}
          </div>
        </div>
      </header>
      {children}
      <footer className={s.footer}>
        <Brand />
        <span>Подключения в одном кабинете.</span>
        <Link href="/app/help">Помощь с подключением ↗</Link>
        <LegalLinks />
        <small>© {new Date().getFullYear()} Кукареку Онлайн</small>
      </footer>
    </>
  );
}
