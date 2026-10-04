'use client';
import { ArrowUpRight, CalendarDays, Laptop } from 'lucide-react';
import Link from 'next/link';
import type { Subscription } from '@/api/types';
import { activeSubscription, date, money, occupiedCount } from '@/lib/domain';
import { ActionLink, EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { useProfiles, useSubscription } from './queries';
import s from './workspace.module.scss';
export function NoSubscription({ subscription }: { subscription?: Subscription | null }) {
  return (
    <EmptyState
      title={subscription ? 'Подписка закончилась' : 'Подключений пока нет'}
      action={<ActionLink href="/pricing">Выбрать тариф</ActionLink>}
    >
      {subscription
        ? `Подписка «${subscription.tariffName}» недоступна. Дата окончания: ${date(subscription.expiresAt)}. сетевые подключения недоступны.`
        : 'Выберите тариф, чтобы начать. Если подписка была раньше, её срок мог закончиться.'}
    </EmptyState>
  );
}
export function SubscriptionCard({
  subscription,
  used,
}: {
  subscription: Subscription;
  used: number;
}) {
  return (
    <section className={s.subscriptionCard}>
      <div className={s.cardHeading}>
        <span>ВАША ПОДПИСКА</span>
        <span className={s.status}>Активна</span>
      </div>
      <h2>{subscription.tariffName}</h2>
      <div className={s.subscriptionDetails}>
        <div>
          <CalendarDays size={19} />
          <span>
            Активна до<strong>{date(subscription.expiresAt)}</strong>
          </span>
        </div>
        <div>
          <Laptop size={19} />
          <span>
            Подключения
            <strong>
              {used} из {subscription.profileLimit}
            </strong>
          </span>
        </div>
      </div>
      <div className={s.usageTrack}>
        <span style={{ width: `${Math.min(100, (used / subscription.profileLimit) * 100)}%` }} />
      </div>
      <div className={s.cardFoot}>
        <span>Осталось подключений: {Math.max(0, subscription.profileLimit - used)}</span>
        <Link href="/app/subscription">
          Условия тарифа
          <ArrowUpRight size={16} />
        </Link>
      </div>
    </section>
  );
}
export function SubscriptionPage() {
  const sub = useSubscription();
  const profiles = useProfiles();
  return (
    <>
      <PageHeading
        eyebrow="ВАШ ПЛАН"
        title="Подписка"
        description="Условия, срок и доступные подключения."
      />
      {sub.isPending || profiles.isPending ? (
        <Skeleton />
      ) : sub.isError ? (
        <ErrorState error={sub.error} retry={() => void sub.refetch()} />
      ) : profiles.isError ? (
        <ErrorState error={profiles.error} retry={() => void profiles.refetch()} />
      ) : !activeSubscription(sub.data) ? (
        <NoSubscription subscription={sub.data} />
      ) : (
        sub.data && (
          <>
            <SubscriptionCard subscription={sub.data} used={occupiedCount(profiles.data)} />
            <section className={s.panel}>
              <h2>Условия вашей подписки</h2>
              <dl className={s.facts}>
                <div>
                  <dt>Дата начала</dt>
                  <dd>{date(sub.data.startedAt)}</dd>
                </div>
                <div>
                  <dt>Период тарифа</dt>
                  <dd>{sub.data.durationDays} дней</dd>
                </div>
                <div>
                  <dt>Стоимость</dt>
                  <dd>{money(sub.data.price, sub.data.currency)}</dd>
                </div>
                <div>
                  <dt>Устройства</dt>
                  <dd>До {sub.data.profileLimit}</dd>
                </div>
              </dl>
              <p className={s.note}>
                Условия зафиксированы при оформлении подписки. Индивидуальный лимит, если он
                назначен администратором, проверяется при добавлении устройства.
              </p>
              <ActionLink href="/pricing">Тарифы и продление</ActionLink>
              <p className={s.note}>
                Онлайн-оплата и самостоятельная смена тарифа пока недоступны.
              </p>
            </section>
          </>
        )
      )}
    </>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={s.pageHeading}>
      <div>
        <span className={s.eyebrow}>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
