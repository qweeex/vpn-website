import { Checkout } from '@/features/checkout';
export const metadata = { title: 'Оформление подписки', robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ tariffId: string }> }) {
  const { tariffId } = await params;
  return <Checkout tariffId={tariffId} />;
}
