'use client';
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
                  <ActionLink href="/pricing">Подключить VPN</ActionLink>
                </span>
              </>
            )}
          </div>
        </div>
      </header>
      {children}
      <footer className={s.footer}>
        <Brand />
        <span>Меньше хлопот. Больше интернета.</span>
        <Link href="/app/help">Помощь с подключением ↗</Link>
        <small>© {new Date().getFullYear()} КукарекуVPN</small>
      </footer>
    </>
  );
}
