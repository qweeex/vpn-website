'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import cn from 'classnames';
import { api, keys } from '@/api/services';
import { platforms, instructions, type Platform } from '@/config/setup';
import { activeSubscription } from '@/lib/domain';
import { ErrorState, Skeleton } from '@/components/ui';
import { PageHeading } from './subscription';
import { DownloadButton } from './devices';
import { useSubscription } from './queries';
import s from './workspace.module.scss';
export function Help({ id }: { id?: string }) {
  const [platform, setPlatform] = useState<Platform>('iOS');
  const sub = useSubscription();
  const profile = useQuery({
    queryKey: [...keys.profiles, id],
    queryFn: () => api.profile(id!),
    enabled: !!id,
    refetchInterval: (q) => (q.state.data?.status === 'CREATING' ? 5000 : false),
  });
  return (
    <>
      <PageHeading
        eyebrow="НА СВЯЗИ ЗА НЕСКОЛЬКО ШАГОВ"
        title="Как подключить VPN"
        description="Вам понадобятся приложение OpenVPN Connect и файл конфигурации."
      />
      {id &&
        (profile.isPending ? (
          <Skeleton rows={1} />
        ) : profile.isError ? (
          <ErrorState error={profile.error} />
        ) : (
          <div className={s.setupDevice}>
            <div>
              <span className={s.eyebrow}>ВАШЕ УСТРОЙСТВО</span>
              <h2>{profile.data.deviceName}</h2>
            </div>
            <DownloadButton
              id={id}
              disabled={!activeSubscription(sub.data) || profile.data.status !== 'ACTIVE'}
            />
          </div>
        ))}
      <section className={s.panel}>
        <h2>На каком устройстве?</h2>
        <div className={s.platforms} role="group" aria-label="Платформа">
          {platforms.map((p) => (
            <button
              key={p}
              className={cn(platform === p && s.selectedPlatform)}
              aria-pressed={platform === p}
              onClick={() => setPlatform(p)}
            >
              {p}
            </button>
          ))}
        </div>
        <ol className={s.instructions}>
          {instructions[platform].map((text, i) => (
            <li key={text}>
              <span>{i + 1}</span>
              <p>{text}</p>
            </li>
          ))}
        </ol>
        <p className={s.note}>
          Названия пунктов могут немного отличаться в зависимости от версии приложения. Не
          передавайте свой файл конфигурации другим людям.
        </p>
      </section>
      <section className={s.faq}>
        <h2>Полезно знать</h2>
        <details>
          <summary>Можно ли использовать один файл на нескольких устройствах?</summary>
          <p>
            Создавайте отдельное подключение для каждого устройства в рамках лимита тарифа. Так ими
            удобнее управлять.
          </p>
        </details>
        <details>
          <summary>Что делать, если подключение не работает?</summary>
          <p>
            Проверьте срок подписки, статус устройства и доступ к интернету. Скачайте актуальную
            конфигурацию. Если локация недоступна, попробуйте позже.
          </p>
        </details>
        <details>
          <summary>Как поменять страну?</summary>
          <p>
            Добавьте новое устройство с нужной локацией. Если лимит исчерпан, сначала удалите старое
            подключение — его файл перестанет работать.
          </p>
        </details>
      </section>
    </>
  );
}
