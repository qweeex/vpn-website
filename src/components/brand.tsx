import Link from 'next/link';
import Image from 'next/image';
import s from './public.module.scss';
export function Brand() {
  return (
    <Link href="/" className={s.brand} aria-label="КукарекуVPN — главная">
      <span className={s.brandIcon}>
        <Image src="/brand.png" alt="" width={42} height={42} />
      </span>
      <span>
        Кукареку<span className={s.blue}>VPN</span>
      </span>
    </Link>
  );
}
