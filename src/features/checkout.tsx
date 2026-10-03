'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api, keys, paymentService } from '@/api/services';
import { track } from '@/lib/analytics';
import { money } from '@/lib/domain';
import { ActionLink, Button, EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { PublicShell } from '@/components/public-shell';
import s from './workspace.module.scss';
export function Checkout({ tariffId }: { tariffId: string }) {
  const tariffs = useQuery({ queryKey: keys.tariffs, queryFn: api.tariffs });
  const session = useQuery({ queryKey: keys.session, queryFn: api.session });
  useEffect(() => track('checkout_started', { tariffId }), [tariffId]);
  const tariff = tariffs.data?.find((t) => t.id === tariffId);
  return (
    <PublicShell>
      <main id="main" className={s.checkout}>
        <Link href="/pricing" className={s.back}>
          ← Все тарифы
        </Link>
        <span className={s.eyebrow}>ВАШ ВЫБОР</span>
        <h1>Всё готово к знакомству</h1>
        <p>Проверьте условия выбранного тарифа.</p>
        {tariffs.isPending ? (
          <Skeleton />
        ) : tariffs.isError ? (
          <ErrorState error={tariffs.error} retry={() => void tariffs.refetch()} />
        ) : !tariff ? (
          <EmptyState
            title="Тариф недоступен"
            action={<ActionLink href="/pricing">Выбрать другой</ActionLink>}
          >
            Возможно, предложение больше не действует.
          </EmptyState>
        ) : (
          <section className={s.panel}>
            <h2>{tariff.name}</h2>
            <p className={s.note}>{tariff.description}</p>
            <dl className={s.facts}>
              <div>
                <dt>Срок</dt>
                <dd>{tariff.durationDays} дней</dd>
              </div>
              <div>
                <dt>Устройства</dt>
                <dd>До {tariff.profileLimit}</dd>
              </div>
              <div>
                <dt>Итого</dt>
                <dd className={s.total}>{money(tariff.price, tariff.currency)}</dd>
              </div>
            </dl>
            <div className={s.notice}>
              <strong>Онлайн-оплата пока недоступна</strong>
              <p>
                Вы можете познакомиться с тарифом и создать аккаунт. Оформить или продлить подписку
                онлайн сейчас нельзя.
              </p>
            </div>
            {session.isPending ? (
              <Skeleton rows={1} />
            ) : session.isError ? (
              <ErrorState error={session.error} retry={() => void session.refetch()} />
            ) : session.data?.authenticated ? (
              <Button disabled={!paymentService.available}>
                Оплатить {money(tariff.price, tariff.currency)}
              </Button>
            ) : (
              <>
                <ActionLink href={`/register?next=${encodeURIComponent(`/checkout/${tariff.id}`)}`}>
                  Создать аккаунт
                </ActionLink>
                <p className={s.note}>
                  Уже зарегистрированы?{' '}
                  <Link href={`/login?next=${encodeURIComponent(`/checkout/${tariff.id}`)}`}>
                    Войти и продолжить
                  </Link>
                </p>
              </>
            )}
          </section>
        )}
      </main>
    </PublicShell>
  );
}
