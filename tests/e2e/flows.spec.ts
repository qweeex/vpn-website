import { test, expect, type Page } from '@playwright/test';
const origin = 'http://127.0.0.1:3101';
async function signIn(page: Page, kind = 'active') {
  const response = await page.request.post('/api/v1/auth/login', {
    headers: { Origin: origin },
    data: { email: `${kind}-${Date.now()}@example.com`, password: 'test-password-123' },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
}
test('tariffs come from API with minor-unit prices; unavailable payment is explicit', async ({
  page,
}) => {
  await page.goto('/pricing');
  await expect(page.getByRole('heading', { name: 'Тестовый тариф API' })).toBeVisible();
  await expect(page.getByText('299', { exact: false }).first()).toBeVisible();
  await page.getByRole('link', { name: 'Выбрать тариф', exact: true }).click();
  await expect(page.getByText('Онлайн-оплата пока недоступна')).toBeVisible();
  await page.getByRole('link', { name: 'Создать аккаунт' }).click();
  await expect(page).toHaveURL(/register\?next=/);
});
test('protected route preserves destination and login returns to it', async ({ page }) => {
  await page.goto('/app/vpn');
  await expect(page).toHaveURL(/login\?next=%2Fapp%2Fvpn/);
  await page.getByLabel('Email', { exact: true }).fill('login@example.com');
  await page.getByLabel('Пароль', { exact: true }).fill('test-password-123');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page).toHaveURL('/app/vpn');
  await expect(page.getByRole('heading', { name: 'Мои устройства', exact: true })).toBeVisible();
  const cookies = await page.context().cookies();
  const session = cookies.find((c) => c.name === 'kukareku_session');
  expect(session?.httpOnly).toBe(true);
  expect(session?.value).not.toContain('access:');
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
});
test('login validation and mapped invalid-credentials error', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill('test@example.com');
  await page.getByLabel('Пароль', { exact: true }).fill('short');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page.getByText('Минимум 12 символов')).toBeVisible();
  await page.getByLabel('Пароль', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Неверный email или пароль',
  );
});
test('registration validates repeated password and preserves checkout', async ({ page }) => {
  await page.goto('/register?next=%2Fcheckout%2F11111111-1111-4111-8111-111111111111');
  await page.getByLabel('Email', { exact: true }).fill('register@example.com');
  await page.getByLabel('Пароль', { exact: true }).fill('test-password-123');
  await page.getByLabel('Повторите пароль').fill('different-password');
  await page.getByRole('button', { name: 'Создать аккаунт' }).click();
  await expect(page.getByText('Пароли не совпадают')).toBeVisible();
  await page.getByLabel('Повторите пароль').fill('test-password-123');
  await page.getByRole('button', { name: 'Создать аккаунт' }).click();
  await expect(page).toHaveURL(/\/checkout\//);
  await expect(page.getByRole('button', { name: /Оплатить/ })).toBeDisabled();
});
test('empty and active subscriptions', async ({ page }) => {
  await signIn(page, 'none');
  await page.goto('/app');
  await expect(page.getByRole('heading', { name: 'VPN пока не подключён' })).toBeVisible();
  await signIn(page);
  await page.goto('/app');
  await expect(page.getByRole('heading', { name: 'Тестовый тариф API' })).toBeVisible();
  await expect(page.getByText('1 из 3', { exact: true })).toBeVisible();
});
test('expired subscription disables config download', async ({ page }) => {
  await signIn(page, 'expired');
  await page.goto('/app/vpn');
  await expect(page.getByRole('heading', { name: 'Подписка закончилась' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Скачать конфигурацию' })).toBeDisabled();
});
test('limit shown and backend remains authoritative', async ({ page }) => {
  await signIn(page, 'limit');
  await page.goto('/app/vpn');
  await expect(page.getByText('Вы используете все подключения по тарифу — 3 из 3')).toBeVisible();
  await page.getByRole('link', { name: 'Добавить устройство' }).click();
  await page.getByText('Германия', { exact: true }).click();
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await page.getByLabel('Название устройства').fill('Ещё один');
  await page.getByRole('button', { name: 'Создать подключение' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Вы используете все подключения',
  );
});
test('create, download exact file, setup, confirmation and delete', async ({ page }) => {
  await signIn(page, 'create');
  await page.goto('/app/vpn/new');
  await page.getByText('Германия', { exact: true }).click();
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await page.getByLabel('Название устройства').fill('Рабочий MacBook');
  await page.getByRole('button', { name: 'Создать подключение' }).click();
  await expect(page.getByRole('heading', { name: 'Готово. Можно подключаться!' })).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Скачать конфигурацию' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('from-backend.ovpn');
  const stream = await download.createReadStream();
  let content = '';
  for await (const chunk of stream!) content += chunk;
  expect(content).toBe('client\n# test fixture only\n');
  await page.getByRole('link', { name: 'Как подключить', exact: false }).click();
  await page.getByRole('button', { name: 'macOS', exact: true }).click();
  await expect(
    page.getByText('Установите OpenVPN Connect с официального сайта OpenVPN.'),
  ).toBeVisible();
  await page.goto('/app/vpn');
  await page.getByRole('button', { name: 'Удалить Рабочий MacBook' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Отмена' }).click();
  await expect(page.getByRole('heading', { name: 'Рабочий MacBook' })).toBeVisible();
  await page.getByRole('button', { name: 'Удалить Рабочий MacBook' }).click();
  await page.getByRole('button', { name: 'Удалить устройство', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Здесь будут ваши устройства' })).toBeVisible();
});
test('node errors remain actionable', async ({ page }) => {
  await signIn(page, 'create');
  await page.goto('/app/vpn/new');
  await page.getByText('Германия', { exact: true }).click();
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await page.getByLabel('Название устройства').fill('Offline');
  await page.getByRole('button', { name: 'Создать подключение' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'локация временно недоступна',
  );
  await expect(page.getByRole('button', { name: 'Другая локация' })).toBeEnabled();
});
test('banned user sees restriction and can log out', async ({ page }) => {
  await signIn(page, 'banned');
  await page.goto('/app/vpn');
  await page.getByRole('button', { name: 'Скачать конфигурацию' }).click();
  await expect(page.getByRole('heading', { name: 'Доступ к VPN ограничен' })).toBeVisible();
  await page.getByRole('button', { name: 'Выйти', exact: true }).click();
  await expect(page).toHaveURL('/login');
});
test('expired access token refreshes without exposing tokens', async ({ page }) => {
  await signIn(page, 'refresh');
  await page.goto('/app');
  await expect(page.getByRole('heading', { name: 'Добро пожаловать' })).toBeVisible();
  const response = await page.request.get('/api/v1/profiles');
  const text = await response.text();
  expect(text).not.toContain('INTERNAL_CLIENT');
  expect(text).not.toContain('clientName');
});
test('BFF rejects cross-origin writes and admin routes', async ({ request }) => {
  const csrf = await request.post('/api/v1/auth/login', {
    headers: { Origin: 'https://evil.example' },
    data: { email: 'a@example.com', password: 'test-password-123' },
  });
  expect(csrf.status()).toBe(403);
  const auth = await request.post('/api/v1/auth/login', {
    headers: { Origin: origin },
    data: { email: 'security@example.com', password: 'test-password-123' },
  });
  expect(auth.ok(), await auth.text()).toBeTruthy();
  expect((await request.get('/api/v1/admin/nodes')).status()).toBe(404);
});
for (const width of [375, 430, 768, 1024, 1440, 1920]) {
  test(`responsive ${width}px: public, cabinet and wizard have no overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /VPN без лишнего/ })).toBeVisible();
    const fits = () =>
      page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(
      await fits(),
      JSON.stringify(
        await page.evaluate(() =>
          [...document.querySelectorAll('body *')]
            .filter((e) => e.getBoundingClientRect().right > innerWidth + 1)
            .map((e) => ({
              tag: e.tagName,
              cls: e.className,
              right: e.getBoundingClientRect().right,
            })),
        ),
      ),
    ).toBe(true);
    await page.screenshot({ path: `test-results/landing-${width}.png`, fullPage: true });
    await signIn(page);
    await page.goto('/app/vpn');
    await expect(page.getByRole('heading', { name: 'MacBook Pro' })).toBeVisible();
    expect(
      await fits(),
      JSON.stringify(
        await page.evaluate(() =>
          [...document.querySelectorAll('body *')]
            .filter((e) => e.getBoundingClientRect().right > innerWidth + 1)
            .map((e) => ({
              tag: e.tagName,
              cls: e.className,
              right: e.getBoundingClientRect().right,
            })),
        ),
      ),
    ).toBe(true);
    await page.screenshot({ path: `test-results/devices-${width}.png`, fullPage: true });
    await page.goto('/app/vpn/new');
    await page.getByText('Германия', { exact: true }).click();
    await page.getByRole('button', { name: 'Продолжить' }).click();
    expect(
      await fits(),
      JSON.stringify(
        await page.evaluate(() =>
          [...document.querySelectorAll('body *')]
            .filter((e) => e.getBoundingClientRect().right > innerWidth + 1)
            .map((e) => ({
              tag: e.tagName,
              cls: e.className,
              right: e.getBoundingClientRect().right,
            })),
        ),
      ),
    ).toBe(true);
  });
}

test('invalid refresh clears session and returns to login without looping', async ({ page }) => {
  await signIn(page, 'invalidrefresh');
  let refreshCalls = 0;
  page.on('request', (req) => {
    if (req.url().endsWith('/api/v1/auth/refresh')) refreshCalls++;
  });
  await page.goto('/app/vpn');
  await expect(page).toHaveURL(/\/login\?next=/);
  expect(refreshCalls).toBe(1);
  expect(
    (await page.context().cookies()).find((c) => c.name === 'kukareku_session'),
  ).toBeUndefined();
});

test('locations are authenticated, supplied by backend and stripped of internal fields', async ({
  page,
}) => {
  expect((await page.request.get('/api/v1/locations')).status()).toBe(401);
  await signIn(page, 'locations');
  const response = await page.request.get('/api/v1/locations');
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual([
    {
      id: '22222222-2222-4222-8222-222222222222',
      countryCode: 'DE',
      countryName: 'Германия',
      city: 'Франкфурт',
    },
  ]);
  expect(response.headers()['cache-control']).toBe('no-store');
});
test('locations preserve upstream empty state and failure', async ({ page }) => {
  await signIn(page, 'locationsnone');
  expect(await (await page.request.get('/api/v1/locations')).json()).toEqual([]);
  await signIn(page, 'locationsdown');
  expect((await page.request.get('/api/v1/locations')).status()).toBe(503);
});
