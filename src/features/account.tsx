'use client';
import { useQuery } from '@tanstack/react-query';
import { api, keys } from '@/api/services';
import { PageHeading } from './subscription';
import { LogoutButton } from './app-shell';
import s from './workspace.module.scss';
export function Account() {
  const session = useQuery({ queryKey: keys.session, queryFn: api.session });
  return (
    <>
      <PageHeading
        eyebrow="ВАШ ПРОФИЛЬ"
        title="Аккаунт"
        description="Данные для входа и управление сессией."
      />
      <section className={s.panel}>
        <h2>Данные аккаунта</h2>
        <dl className={s.facts}>
          <div>
            <dt>Email для входа</dt>
            <dd>{session.data?.email}</dd>
          </div>
        </dl>
        <p className={s.note}>
          Изменение пароля и удаление аккаунта через личный кабинет пока недоступны.
        </p>
        <LogoutButton />
      </section>
    </>
  );
}
