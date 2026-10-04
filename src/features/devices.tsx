'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { Download, Laptop, Plus, Smartphone, Trash2 } from 'lucide-react';
import type { Location, Profile } from '@/api/types';
import { api } from '@/api/services';
import { downloadConfig } from '@/api/client';
import { activeSubscription, date, occupiedCount, statusText } from '@/lib/domain';
import { track } from '@/lib/analytics';
import {
  ActionLink,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Skeleton,
} from '@/components/ui';
import { useInvalidateVpn, useLocations, useProfiles, useSubscription } from './queries';
import { NoSubscription, PageHeading, SubscriptionCard } from './subscription';
import s from './workspace.module.scss';
export function DownloadButton({ id, disabled = false }: { id: string; disabled?: boolean }) {
  const download = useMutation({
    mutationFn: () => downloadConfig(id),
    onSuccess: () => track('vpn_config_downloaded', { profileId: id }),
  });
  return (
    <div>
      <Button
        variant="secondary"
        disabled={disabled}
        busy={download.isPending}
        onClick={() => download.mutate()}
      >
        <Download size={16} />
        Скачать конфигурацию
      </Button>
      {download.isError && <ErrorState error={download.error} />}
    </div>
  );
}
export function DeviceCard({
  profile,
  locations,
  entitled,
}: {
  profile: Profile;
  locations: Location[];
  entitled: boolean;
}) {
  const [confirm, setConfirm] = useState(false);
  const invalidate = useInvalidateVpn();
  const remove = useMutation({
    mutationFn: () => api.deleteProfile(profile.id),
    onSuccess: () => {
      setConfirm(false);
    },
    onSettled: invalidate,
  });
  const location = locations.find((n) => n.id === profile.nodeId);
  const busy = ['CREATING', 'REVOKING'].includes(profile.status);
  const Icon = /phone|телефон|android|iphone/i.test(profile.deviceName) ? Smartphone : Laptop;
  return (
    <article className={s.device}>
      <div className={s.deviceMain}>
        <span className={s.deviceIcon}>
          <Icon size={24} />
        </span>
        <div>
          <h3>{profile.deviceName}</h3>
          <p>
            {location
              ? `${location.countryName}${location.city ? `, ${location.city}` : ''}`
              : 'сетевое подключение'}
            <span>·</span>
            {date(profile.createdAt)}
          </p>
        </div>
        <span className={profile.status === 'ACTIVE' && entitled ? s.status : s.neutralStatus}>
          {profile.status === 'ACTIVE' && !entitled
            ? 'Подписка недоступна'
            : statusText[profile.status]}
        </span>
      </div>
      <div className={s.deviceActions}>
        <DownloadButton id={profile.id} disabled={!entitled || profile.status !== 'ACTIVE'} />
        <Link href={`/app/connections/${profile.id}/setup`}>Как подключить ↗</Link>
        <Button
          variant="ghost"
          disabled={busy || remove.isPending}
          onClick={() => {
            remove.reset();
            setConfirm(true);
          }}
          aria-label={`Удалить ${profile.deviceName}`}
        >
          <Trash2 size={17} />
        </Button>
      </div>
      {profile.status === 'FAILED' && profile.needsReconcile && (
        <p className={s.note}>
          Подключение не создано. Освобождаем занятое место — это может занять некоторое время.
        </p>
      )}
      {confirm && (
        <ConfirmDialog
          title={`Удалить подключение для «${profile.deviceName}»?`}
          onClose={() => setConfirm(false)}
          onConfirm={() => remove.mutate()}
          busy={remove.isPending}
          error={remove.error}
        >
          После удаления эта конфигурация перестанет работать. Для повторного подключения
          потребуется добавить устройство заново.
        </ConfirmDialog>
      )}
    </article>
  );
}
export function DevicesPage({ dashboard = false }: { dashboard?: boolean }) {
  const sub = useSubscription();
  const profiles = useProfiles();
  const locations = useLocations();
  const visible = profiles.data?.filter((p) => p.status !== 'REVOKED') ?? [];
  const used = occupiedCount(profiles.data ?? []);
  const entitled = activeSubscription(sub.data);
  const limit = sub.data?.profileLimit ?? 0;
  const ready = sub.isSuccess && profiles.isSuccess;
  return (
    <>
      <PageHeading
        eyebrow={dashboard ? 'ХОРОШИЙ ДЕНЬ ДЛЯ ПОДКЛЮЧЕНИЯ' : 'ВАШИ ПОДКЛЮЧЕНИЯ'}
        title={dashboard ? 'Добро пожаловать 👋' : 'Мои устройства'}
        description={
          dashboard
            ? 'Всё, что нужно для ваших подключений, — здесь.'
            : 'Добавляйте устройства и управляйте их подключениями.'
        }
        action={
          ready && entitled ? (
            <ActionLink href="/app/connections/new">
              <Plus size={16} />
              Добавить устройство
            </ActionLink>
          ) : undefined
        }
      />
      {!ready ? (
        sub.isError ? (
          <ErrorState error={sub.error} retry={() => void sub.refetch()} />
        ) : profiles.isError ? (
          <ErrorState error={profiles.error} retry={() => void profiles.refetch()} />
        ) : (
          <Skeleton />
        )
      ) : (
        <>
          {!entitled ? (
            <NoSubscription subscription={sub.data} />
          ) : (
            sub.data && dashboard && <SubscriptionCard subscription={sub.data} used={used} />
          )}
          {entitled && used >= limit && (
            <div className={s.notice}>
              <strong>
                Вы используете все подключения по тарифу — {used} из {limit}
              </strong>
              <p>
                Удалите одно из устройств, чтобы освободить место. Если у вас индивидуальный лимит,
                он будет проверен при создании.
              </p>
              <Link href="/pricing">Посмотреть тарифы ↗</Link>
            </div>
          )}
          <div className={s.sectionTitle}>
            <h2>{dashboard ? 'Мои устройства' : `Устройства · ${visible.length}`}</h2>
            {dashboard && visible.length > 0 && <Link href="/app/connections">Все устройства ↗</Link>}
          </div>
          {!visible.length ? (
            <EmptyState
              title="Здесь будут ваши устройства"
              action={
                entitled ? (
                  <ActionLink href="/app/connections/new">Добавить первое устройство</ActionLink>
                ) : undefined
              }
            >
              {entitled
                ? 'Подписка активна. Выберите локацию и создайте своё первое подключение.'
                : 'После активации подписки вы сможете подключить телефон или компьютер.'}
            </EmptyState>
          ) : (
            <div className={s.deviceList}>
              {(dashboard ? visible.slice(0, 3) : visible).map((p) => (
                <DeviceCard
                  key={p.id}
                  profile={p}
                  locations={locations.data ?? []}
                  entitled={entitled}
                />
              ))}
            </div>
          )}
          <div className={s.helpStrip}>
            <span>Впервые настраиваете подключение?</span>
            <Link href="/app/help">Пошаговая инструкция ↗</Link>
          </div>
        </>
      )}
    </>
  );
}
