import Link from 'next/link';
import Image from 'next/image';
import s from './public.module.scss';
export function Brand() {
  return (
    <Link href="/" className={s.brand} aria-label="Кукареку Онлайн — главная">
      <Image
        src="/kukareku-online.png"
        alt="Кукареку Онлайн"
        width={1536}
        height={1024}
        sizes="120px"
        className={s.brandLogo}
      />
    </Link>
  );
}
