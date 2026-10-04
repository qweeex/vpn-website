import { Help } from '@/features/help';
export const metadata = { title: 'Подключение устройства' };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Help id={id} />;
}
