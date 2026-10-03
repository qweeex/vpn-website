'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { api, keys } from '@/api/services';
import { money } from '@/lib/domain';
import { track } from '@/lib/analytics';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui';
import s from './marketing.module.scss';
export function Tariffs() {
  const tariffs = useQuery({ queryKey: keys.tariffs, queryFn: api.tariffs });
  useEffect(() => {
    if (tariffs.data?.length) track('tariff_viewed');
  }, [tariffs.data]);
  if (tariffs.isPending) return <Skeleton rows={3} />;
  if (tariffs.isError)
    return <ErrorState error={tariffs.error} retry={() => void tariffs.refetch()} />;
  if (!tariffs.data.length)
    return (
      <EmptyState title="Тарифы скоро появятся">
        Пока нет доступных предложений. Загляните немного позже.
      </EmptyState>
    );
  return (
    <div className={s.tariffs}>
      {tariffs.data.map((t, i) => (
        <article key={t.id} className={`${s.tariff} ${i === 1 ? s.featured : ''}`}>
          <div className={s.tariffTop}>
            <span className={s.planIcon}>{['↗', '✳', '◎'][i % 3]}</span>
            <span>{t.durationDays} дней</span>
          </div>
          <h3>{t.name}</h3>
          <p className={s.description}>{t.description || 'Для ваших повседневных подключений'}</p>
          <div className={s.price}>
            {money(t.price, t.currency)}
            <span> / {t.durationDays} дней</span>
          </div>
          <ul>
            <li>
              <Check size={17} />
              До {t.profileLimit} {t.profileLimit === 1 ? 'устройства' : 'устройств'}
            </li>
            <li>
              <Check size={17} />
              Выбор доступной локации
            </li>
            <li>
              <Check size={17} />
              Управление в личном кабинете
            </li>
          </ul>
          <Link
            className={s.choose}
            href={`/checkout/${t.id}`}
            onClick={() => track('tariff_selected', { tariffId: t.id })}
          >
            Выбрать тариф
            <ArrowUpRight size={19} />
          </Link>
        </article>
      ))}
    </div>
  );
}
