export const platforms = ['iOS', 'Android', 'macOS', 'Windows'] as const;
export type Platform = (typeof platforms)[number];
export const instructions: Record<Platform, string[]> = {
  iOS: [
    'Установите OpenVPN Connect из App Store.',
    'Скачайте конфигурацию кнопкой на этой странице.',
    'В приложении «Файлы» откройте .ovpn и выберите «Поделиться» → OpenVPN.',
    'Добавьте подключение и разрешите добавление VPN-конфигурации.',
    'Включите подключение в OpenVPN Connect.',
  ],
  Android: [
    'Установите OpenVPN Connect из Google Play.',
    'Скачайте конфигурацию кнопкой на этой странице.',
    'В OpenVPN Connect выберите импорт файла и откройте скачанный .ovpn.',
    'Добавьте подключение и подтвердите запрос на подключение VPN.',
    'Включите подключение в OpenVPN Connect.',
  ],
  macOS: [
    'Установите OpenVPN Connect с официального сайта OpenVPN.',
    'Скачайте конфигурацию кнопкой на этой странице.',
    'Откройте OpenVPN Connect и импортируйте скачанный .ovpn.',
    'Подтвердите добавление подключения.',
    'Включите подключение в OpenVPN Connect.',
  ],
  Windows: [
    'Установите OpenVPN Connect с официального сайта OpenVPN.',
    'Скачайте конфигурацию кнопкой на этой странице.',
    'Откройте OpenVPN Connect и импортируйте скачанный .ovpn.',
    'Подтвердите добавление подключения.',
    'Включите подключение в OpenVPN Connect.',
  ],
};
