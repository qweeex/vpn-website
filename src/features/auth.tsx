'use client';
import { LegalLinks } from '@/components/legal-links';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { api, keys } from '@/api/services';
import { safeReturn } from '@/lib/domain';
import { Brand } from '@/components/brand';
import { Button, ErrorState } from '@/components/ui';
import s from './auth.module.scss';
const base = {
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Введите корректный email')
    .max(254, 'Email слишком длинный'),
  password: z.string().min(12, 'Минимум 12 символов').max(128, 'Не больше 128 символов'),
  repeat: z.string().optional(),
};
export function AuthForm({ register = false }: { register?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const client = useQueryClient();
  const next = safeReturn(params.get('next'));
  const schema = z.object(base).refine((d) => !register || d.password === d.repeat, {
    message: 'Пароли не совпадают',
    path: ['repeat'],
  });
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof schema>) =>
      api.login({ email: data.email, password: data.password }, register),
    onSuccess: (session) => {
      client.clear();
      client.setQueryData(keys.session, session);
      router.replace(next);
    },
  });
  return (
    <div className={s.layout}>
      <aside className={s.aside}>
        <Brand />
        <div>
          <Image
            src="/kukareku-online.png"
            alt="Кукареку Онлайн"
            width={1536}
            height={1024}
            sizes="340px"
          />
          <h2>
            Ваши устройства.
            <br />
            Ваши подключения.
            <br />
            <span>Один кабинет.</span>
          </h2>
          <p>
            Всё нужное для подключения —<br />в одном личном кабинете.
          </p>
        </div>
        <small>Подключения в одном кабинете.</small>
      </aside>
      <main id="main" className={s.main}>
        <Link href="/" className={s.back}>
          <ArrowLeft size={16} />
          На главную
        </Link>
        <div className={s.formWrap}>
          <div className={s.mobileBrand}>
            <Brand />
          </div>
          <span className={s.kicker}>РАДЫ ВАС ВИДЕТЬ</span>
          <h1>{register ? 'Начнём знакомство' : 'С возвращением'}</h1>
          <p>
            {register
              ? 'Создайте аккаунт, чтобы управлять своими подключениями.'
              : 'Войдите, чтобы всё снова было под рукой.'}
          </p>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} noValidate>
            <div className={s.field}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...form.register('email')}
                aria-invalid={!!form.formState.errors.email}
                aria-describedby="email-error"
              />
              <small id="email-error">{form.formState.errors.email?.message}</small>
            </div>
            <div className={s.field}>
              <label htmlFor="password">Пароль</label>
              <input
                id="password"
                type="password"
                autoComplete={register ? 'new-password' : 'current-password'}
                placeholder="Не менее 12 символов"
                {...form.register('password')}
                aria-invalid={!!form.formState.errors.password}
                aria-describedby="password-error"
              />
              <small id="password-error">{form.formState.errors.password?.message}</small>
            </div>
            {register && (
              <div className={s.field}>
                <label htmlFor="repeat">Повторите пароль</label>
                <input
                  id="repeat"
                  type="password"
                  autoComplete="new-password"
                  {...form.register('repeat')}
                  aria-invalid={!!form.formState.errors.repeat}
                  aria-describedby="repeat-error"
                />
                <small id="repeat-error">{form.formState.errors.repeat?.message}</small>
              </div>
            )}
            {mutation.isError && <ErrorState error={mutation.error} />}
            {register && (
              <p className={s.legalNotice}>
                Создавая аккаунт, вы принимаете{' '}
                <Link href="/terms">Пользовательское соглашение</Link>. Обработка данных описана в{' '}
                <Link href="/privacy">Политике конфиденциальности</Link>.
              </p>
            )}
            <Button type="submit" busy={mutation.isPending}>
              {register ? 'Создать аккаунт' : 'Войти'} <span aria-hidden="true">→</span>
            </Button>
          </form>
          <p className={s.switch}>
            {register ? 'Уже есть аккаунт?' : 'Впервые у нас?'}{' '}
            <Link href={`${register ? '/login' : '/register'}?next=${encodeURIComponent(next)}`}>
              {register ? 'Войти' : 'Зарегистрироваться'}
            </Link>
          </p>
        </div>
        <LegalLinks />
        <small className={s.footnote}>Кукареку Онлайн · Настройки ваших подключений</small>
      </main>
    </div>
  );
}
