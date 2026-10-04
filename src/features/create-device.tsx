'use client';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Check, Globe2 } from 'lucide-react';
import cn from 'classnames';
import Link from 'next/link';
import { api } from '@/api/services';
import { activeSubscription, occupiedCount, statusText } from '@/lib/domain';
import { track } from '@/lib/analytics';
import { ActionLink, Button, EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { useInvalidateVpn, useLocations, useProfiles, useSubscription } from './queries';
import { NoSubscription, PageHeading } from './subscription';
import { DownloadButton } from './devices';
import s from './workspace.module.scss';
const schema = z.object({
  nodeId: z.string().uuid('Выберите локацию'),
  deviceName: z
    .string()
    .trim()
    .min(1, 'Укажите название устройства')
    .max(100, 'Не больше 100 символов'),
});
export function CreateDevice() {
  const [step, setStep] = useState(1);
  const sub = useSubscription();
  const profiles = useProfiles();
  const locations = useLocations();
  const invalidate = useInvalidateVpn();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { nodeId: '', deviceName: '' },
  });
  const create = useMutation({
    mutationFn: api.createProfile,
    onSuccess: (p) => {
      track('vpn_profile_created', { profileId: p.id });
      setStep(3);
    },
    onSettled: invalidate,
  });
  const countries = [
    ...new Map((locations.data ?? []).map((l) => [l.countryCode, l.countryName])).entries(),
  ];
  const selectedId = useWatch({ control: form.control, name: 'nodeId' });
  const location = locations.data?.find((l) => l.id === selectedId);
  return (
    <>
      <Link href="/app/connections" className={s.back}>
        <ArrowLeft size={16} />К моим устройствам
      </Link>
      <PageHeading
        eyebrow="НОВОЕ ПОДКЛЮЧЕНИЕ"
        title="Добавим ваше устройство"
        description="Выберите локацию. Всё остальное — пара простых шагов."
      />
      {sub.isPending || profiles.isPending || locations.isPending ? (
        <Skeleton />
      ) : sub.isError ? (
        <ErrorState error={sub.error} retry={() => void sub.refetch()} />
      ) : profiles.isError ? (
        <ErrorState error={profiles.error} retry={() => void profiles.refetch()} />
      ) : !activeSubscription(sub.data) ? (
        <NoSubscription subscription={sub.data} />
      ) : locations.isError ? (
        <ErrorState error={locations.error} retry={() => void locations.refetch()} />
      ) : !locations.data.length ? (
        <EmptyState
          title="Локации пока недоступны"
          action={
            <Button variant="secondary" onClick={() => void locations.refetch()}>
              Обновить локации
            </Button>
          }
        >
          Пока не получается выбрать страну для подключения. Попробуйте немного позже.
        </EmptyState>
      ) : (
        <>
          <ol className={s.stepper} aria-label="Этапы подключения">
            {['Локация', 'Устройство', 'Готово'].map((text, i) => (
              <li
                key={text}
                className={cn(step >= i + 1 && s.currentStep)}
                aria-current={step === i + 1 ? 'step' : undefined}
              >
                <span>{i + 1 < step ? <Check size={14} /> : i + 1}</span>
                {text}
              </li>
            ))}
          </ol>
          {step === 3 && create.data ? (
            <section className={s.success}>
              <span className={s.successIcon}>
                <Check size={30} />
              </span>
              <h2>
                {create.data.status === 'ACTIVE'
                  ? 'Готово. Можно подключаться!'
                  : statusText[create.data.status]}
              </h2>
              <p>
                Подключение для «{create.data.deviceName}»{location && ` · ${location.countryName}`}
              </p>
              <DownloadButton id={create.data.id} disabled={create.data.status !== 'ACTIVE'} />
              <ActionLink href={`/app/connections/${create.data.id}/setup`} secondary>
                Как подключить
              </ActionLink>
              <Link href="/app">Перейти в личный кабинет →</Link>
            </section>
          ) : (
            <form
              className={s.panel}
              onSubmit={form.handleSubmit((data) => create.mutate(data))}
              noValidate
            >
              {step === 1 ? (
                <fieldset>
                  <legend>Где подключимся?</legend>
                  <p className={s.note}>
                    Выберите страну. Доступную локацию внутри страны мы подставим автоматически.
                  </p>
                  <div className={s.locations}>
                    {countries.map(([code, name]) => {
                      const first = locations.data.find((l) => l.countryCode === code)!;
                      return (
                        <label
                          key={code}
                          className={cn(
                            s.location,
                            location?.countryCode === code && s.selectedLocation,
                          )}
                        >
                          <input type="radio" value={first.id} {...form.register('nodeId')} />
                          <Globe2 size={23} />
                          <span>
                            <strong>{name}</strong>
                            <small>{first.city || 'сетевое подключение'}</small>
                          </span>
                          <span className={s.radioMark} />
                        </label>
                      );
                    })}
                  </div>
                  {form.formState.errors.nodeId && (
                    <p className={s.fieldError} role="alert">
                      {form.formState.errors.nodeId.message}
                    </p>
                  )}
                  <div className={s.formActions}>
                    <Button
                      type="button"
                      onClick={async () => {
                        if (await form.trigger('nodeId')) setStep(2);
                      }}
                    >
                      Продолжить →
                    </Button>
                  </div>
                </fieldset>
              ) : (
                <>
                  <h2>Как назовём устройство?</h2>
                  <p className={s.note}>
                    Локация: {location?.countryName}. По названию будет проще найти подключение в
                    списке.
                  </p>
                  {sub.data && occupiedCount(profiles.data) >= sub.data.profileLimit && (
                    <div className={s.notice}>
                      <strong>Все подключения по тарифу используются</strong>
                      <p>
                        Удалите одно из устройств. Если вам назначен индивидуальный лимит, сервис
                        проверит его при создании.
                      </p>
                      <Link href="/app/connections">Мои устройства →</Link>
                    </div>
                  )}
                  <div className={s.field}>
                    <label htmlFor="deviceName">Название устройства</label>
                    <input
                      id="deviceName"
                      placeholder="Например, MacBook"
                      autoComplete="off"
                      {...form.register('deviceName')}
                      aria-invalid={!!form.formState.errors.deviceName}
                      aria-describedby="device-error"
                      disabled={create.isPending}
                    />
                    <small id="device-error" className={s.fieldError}>
                      {form.formState.errors.deviceName?.message}
                    </small>
                  </div>
                  {create.isError && <ErrorState error={create.error} />}
                  <div className={s.formActions}>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={create.isPending}
                      onClick={() => {
                        setStep(1);
                        create.reset();
                      }}
                    >
                      Другая локация
                    </Button>
                    <Button type="submit" busy={create.isPending}>
                      {create.isPending ? 'Создаём подключение…' : 'Создать подключение'}
                    </Button>
                  </div>
                  <p className={s.note}>
                    Создание может занять несколько секунд. Дождитесь результата перед повторной
                    попыткой.
                  </p>
                </>
              )}
            </form>
          )}
        </>
      )}
    </>
  );
}
