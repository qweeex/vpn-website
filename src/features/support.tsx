'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { supportApi, type TicketAccess } from '@/api/support';
import { Button, ErrorState, Skeleton } from '@/components/ui';
import s from './support.module.scss';
const schema = z.object({
  email: z.string().trim().email('Введите email').max(254),
  subject: z.string().trim().min(3, 'Укажите тему (не менее 3 символов)').max(150),
  message: z
    .string()
    .trim()
    .min(10, 'Опишите вопрос (не менее 10 символов)')
    .max(5000, 'Не более 5000 символов'),
  privacyAccepted: z.boolean().refine(Boolean, 'Подтвердите ознакомление с политикой'),
});
export function SupportForm() {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { privacyAccepted: false },
  });
  const create = useMutation({ mutationFn: supportApi.create });
  if (create.data) {
    const href = `/support/ticket#id=${create.data.id}&key=${create.data.accessKey}`;
    return (
      <section className={s.receipt} role="status">
        <h2>Обращение зарегистрировано</h2>
        <p>Номер: {create.data.id}</p>
        <p>
          Сохраните закрытую ссылку. Ответ поддержки появится на странице обращения; уведомления по
          email не отправляются. Ссылка даёт доступ к переписке — не передавайте её другим людям.
        </p>
        <Link href={href}>Открыть моё обращение →</Link>
      </section>
    );
  }
  return (
    <form className={s.form} onSubmit={form.handleSubmit((data) => create.mutate(data))} noValidate>
      <h2>Создать обращение</h2>
      <label htmlFor="support-email">Email аккаунта или контактный email</label>
      <input
        id="support-email"
        type="email"
        autoComplete="email"
        {...form.register('email')}
        aria-describedby="support-email-error"
        aria-invalid={!!form.formState.errors.email}
      />
      <small id="support-email-error">{form.formState.errors.email?.message}</small>
      <label htmlFor="support-subject">Тема обращения</label>
      <input
        id="support-subject"
        {...form.register('subject')}
        aria-describedby="support-subject-error"
        aria-invalid={!!form.formState.errors.subject}
      />
      <small id="support-subject-error">{form.formState.errors.subject?.message}</small>
      <label htmlFor="support-message">Ваш вопрос</label>
      <textarea
        id="support-message"
        rows={6}
        maxLength={5000}
        {...form.register('message')}
        aria-describedby="support-message-error"
        aria-invalid={!!form.formState.errors.message}
      />
      <small id="support-message-error">{form.formState.errors.message?.message}</small>
      <label className={s.consent}>
        <input type="checkbox" {...form.register('privacyAccepted')} />{' '}
        <span>
          Я ознакомился с <Link href="/privacy">Политикой конфиденциальности</Link> и направляю
          данные для обработки обращения.
        </span>
      </label>
      <small role="alert">{form.formState.errors.privacyAccepted?.message}</small>
      {create.isError && <ErrorState error={create.error} />}
      <Button busy={create.isPending} type="submit">
        Отправить обращение
      </Button>
      <p>
        Ответы доступны по закрытой ссылке, которую вы получите после отправки. Вход в аккаунт не
        требуется.
      </p>
    </form>
  );
}
export function TicketThread() {
  const [access, setAccess] = useState<TicketAccess | null>(null);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  const client = useQueryClient();
  useEffect(() => {
    const read = () => {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const id = params.get('id');
      const accessKey = params.get('key');
      setAccess(id && accessKey ? { id, accessKey } : null);
      setReady(true);
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);
  const queryKey = ['support-ticket', access?.id, access?.accessKey];
  const ticket = useQuery({
    queryKey,
    queryFn: () => supportApi.read(access!),
    enabled: !!access,
    refetchInterval: 30000,
    retry: false,
  });
  const send = useMutation({
    mutationFn: () => supportApi.message({ ...access!, message: message.trim() }),
    onSuccess: (data) => {
      client.setQueryData(queryKey, data);
      setMessage('');
    },
  });
  if (!ready) return <Skeleton />;
  if (!access)
    return (
      <p>
        Откройте полную закрытую ссылку, полученную после создания обращения.{' '}
        <Link href="/support">Создать новое обращение</Link>
      </p>
    );
  if (ticket.isPending) return <Skeleton />;
  if (ticket.isError)
    return <ErrorState error={ticket.error} retry={() => void ticket.refetch()} />;
  return (
    <>
      <h2>{ticket.data.subject}</h2>
      <p>
        Номер: {ticket.data.id}
        <br />
        Статус:{' '}
        {ticket.data.status === 'answered' ? 'Поддержка ответила' : 'Ожидает ответа поддержки'}
      </p>
      <Button variant="secondary" onClick={() => void ticket.refetch()} busy={ticket.isFetching}>
        Проверить ответ
      </Button>
      <ol className={s.messages}>
        {ticket.data.messages.map((m, i) => (
          <li key={i}>
            <strong>{m.role === 'support' ? 'Поддержка Кукареку Онлайн' : 'Вы'}</strong>
            <time dateTime={m.createdAt}>{new Date(m.createdAt).toLocaleString('ru-RU')}</time>
            <p>{m.body}</p>
          </li>
        ))}
      </ol>
      <form
        className={s.form}
        onSubmit={(event) => {
          event.preventDefault();
          if (message.trim()) send.mutate();
        }}
      >
        <label htmlFor="ticket-reply">Дополнить обращение</label>
        <textarea
          id="ticket-reply"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          maxLength={5000}
          required
        />
        {send.isError && <ErrorState error={send.error} />}
        <Button type="submit" disabled={!message.trim()} busy={send.isPending}>
          Отправить сообщение
        </Button>
      </form>
      <p>
        Храните эту ссылку в безопасном месте. Ответы проверяются автоматически каждые 30 секунд.
      </p>
    </>
  );
}
