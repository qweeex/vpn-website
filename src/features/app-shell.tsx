'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { House, Laptop, CreditCard, CircleHelp, User, LogOut } from 'lucide-react';
import cn from 'classnames';
import { api, keys } from '@/api/services';
import { Brand } from '@/components/brand';
import { Button, EmptyState, ErrorState, Skeleton } from '@/components/ui';
import s from './workspace.module.scss';
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const session = useQuery({ queryKey: keys.session, queryFn: api.session });
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  useEffect(() => {
    if (session.data && !session.data.authenticated)
      router.replace(`/login?next=${encodeURIComponent(path + (params.size ? `?${params}` : ''))}`);
  }, [session.data, router, path, params]);
  if (session.isError)
    return (
      <main id="main" className={s.guard}>
        <ErrorState error={session.error} retry={() => void session.refetch()} />
      </main>
    );
  if (!session.data?.authenticated)
    return (
      <main id="main" className={s.guard}>
        <Skeleton />
      </main>
    );
  return children;
}
export function LogoutButton() {
  const client = useQueryClient();
  const router = useRouter();
  const logout = useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      client.clear();
      client.setQueryData(keys.session, { authenticated: false });
      router.replace('/login');
    },
  });
  return (
    <>
      <Button variant="ghost" busy={logout.isPending} onClick={() => logout.mutate()}>
        <LogOut size={18} />
        Выйти
      </Button>
      {logout.isError && <ErrorState error={logout.error} />}
    </>
  );
}
const nav = [
  { href: '/app', label: 'Главная', icon: House },
  { href: '/app/vpn', label: 'Мои VPN', icon: Laptop },
  { href: '/app/subscription', label: 'Подписка', icon: CreditCard },
  { href: '/app/help', label: 'Помощь', icon: CircleHelp },
];
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const banned = useQuery({
    queryKey: ['banned'],
    queryFn: () => false,
    enabled: false,
    initialData: false,
  });
  return (
    <AuthGuard>
      <div className={s.layout}>
        <aside className={s.sidebar}>
          <Brand />
          <span className={s.navLabel}>ЛИЧНЫЙ КАБИНЕТ</span>
          <nav aria-label="Личный кабинет">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={
                  (n.href === '/app' ? path === n.href : path.startsWith(n.href))
                    ? 'page'
                    : undefined
                }
                className={cn(
                  s.navLink,
                  (n.href === '/app' ? path === n.href : path.startsWith(n.href)) && s.active,
                )}
              >
                <n.icon size={19} />
                {n.label}
              </Link>
            ))}
          </nav>
          <div className={s.sidebarBottom}>
            <div className={s.sidebarNote}>
              <span>На связи с миром ↗</span>
              <p>
                Ваши подключения.
                <br />В одном месте.
              </p>
            </div>
            <Link
              className={cn(s.navLink, path === '/app/account' && s.active)}
              href="/app/account"
            >
              <User size={19} />
              Аккаунт
            </Link>
            <LogoutButton />
          </div>
        </aside>
        <div className={s.appBody}>
          <header className={s.appHeader}>
            <span>
              Личный кабинет <span className={s.headerDot}>/</span> КукарекуVPN
            </span>
            <Link href="/app/account">
              <User size={17} />
              <span>Мой аккаунт</span>
            </Link>
          </header>
          <main id="main" className={s.content}>
            {banned.data && path !== '/app/account' && path !== '/app/help' ? (
              <EmptyState title="Доступ к VPN ограничен">
                Для этого аккаунта создание и скачивание подключений недоступны. Обратитесь к
                администратору сервиса.
              </EmptyState>
            ) : (
              children
            )}
          </main>
          <footer className={s.appFooter}>
            КукарекуVPN <span>Меньше хлопот. Больше интернета.</span>
          </footer>
        </div>
        <nav className={s.mobileNav} aria-label="Мобильная навигация">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                (n.href === '/app' ? path === n.href : path.startsWith(n.href)) && s.active,
              )}
            >
              <n.icon size={20} />
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </AuthGuard>
  );
}
