'use client';
import { useEffect, useRef } from 'react';
import { AlertCircle, ArrowRight, LoaderCircle, X } from 'lucide-react';
import Link from 'next/link';
import cn from 'classnames';
import { errorMessage } from '@/lib/errors';
import s from './ui.module.scss';
export function Button({
  children,
  busy,
  variant = 'primary',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  busy?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}) {
  return (
    <button
      {...props}
      disabled={props.disabled || busy}
      aria-busy={busy}
      className={cn(s.button, s[variant], className)}
    >
      {busy && <LoaderCircle size={18} className={s.spin} />}
      {children}
    </button>
  );
}
export function ActionLink({
  children,
  href,
  secondary = false,
}: {
  children: React.ReactNode;
  href: string;
  secondary?: boolean;
}) {
  return (
    <Link href={href} className={cn(s.button, secondary ? s.secondary : s.primary)}>
      {children}
      <ArrowRight size={17} />
    </Link>
  );
}
export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <div className={s.error} role="alert">
      <AlertCircle size={20} />
      <div>
        {errorMessage(error)}
        {retry && <button onClick={retry}>Попробовать снова</button>}
      </div>
    </div>
  );
}
export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className={s.empty}>
      <span className={s.emptyIcon}>↗</span>
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Загрузка" className={s.skeleton}>
      {Array.from({ length: rows }, (_, i) => (
        <span key={i} />
      ))}
      <span className="sr-only">Загружаем данные…</span>
    </div>
  );
}
export function ConfirmDialog({
  title,
  children,
  onClose,
  onConfirm,
  busy,
  error,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onConfirm: () => void;
  busy: boolean;
  error: unknown;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={s.dialog}
      aria-labelledby="dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <button className={s.close} aria-label="Закрыть" onClick={onClose} disabled={busy}>
        <X />
      </button>
      <h2 id="dialog-title">{title}</h2>
      <p>{children}</p>
      {!!error && <ErrorState error={error} />}
      <div className={s.dialogActions}>
        <Button variant="secondary" onClick={onClose} disabled={busy} autoFocus>
          Отмена
        </Button>
        <Button variant="danger" busy={busy} onClick={onConfirm}>
          Удалить устройство
        </Button>
      </div>
    </dialog>
  );
}
