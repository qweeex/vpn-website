import { test, expect } from '@playwright/test';
const origin = 'http://127.0.0.1:3101';
test('documents, prices, support and PLAT are public and linked on login', async ({ page }) => {
  await page.goto('/login');
  const nav = page.getByRole('navigation', { name: 'Документы и поддержка' });
  await expect(nav.getByRole('link', { name: 'Политика конфиденциальности' })).toBeVisible();
  await expect(page.getByText('Код проверки: PLAT')).toBeVisible();
  for (const [path, title] of [
    ['privacy', 'Политика конфиденциальности'],
    ['terms', 'Пользовательское соглашение'],
    ['support', 'Контакты поддержки'],
  ]) {
    await page.goto('/' + path);
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await expect(page.getByText('4 октября 2026 года')).toBeVisible();
    expect(await page.locator('body').innerText()).not.toMatch(
      /(?:^|\s)(?:VPN|ВПН|обход|блокиров|цензур|DPI|ТСПУ|чебурнет|белых списков|свободный интернет)/i,
    );
  }
  await page.goto('/pricing');
  await expect(page.getByText('Полная стоимость за 30 дней')).toBeVisible();
});
test('public ticket can be created, answered by staff and continued privately', async ({
  page,
  request,
}) => {
  await page.goto('/support');
  await page
    .getByLabel('Email аккаунта или контактный email')
    .fill(`support-${Date.now()}@example.com`);
  await page.getByLabel('Тема обращения').fill('Настройка устройства');
  await page.getByLabel('Ваш вопрос').fill('Как подключить мой ноутбук к сервису?');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Отправить обращение', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Обращение зарегистрировано' })).toBeVisible();
  const href = await page.getByRole('link', { name: 'Открыть моё обращение' }).getAttribute('href');
  const params = new URLSearchParams(href!.split('#')[1]);
  const id = params.get('id')!;
  await page.getByRole('link', { name: 'Открыть моё обращение' }).click();
  await expect(
    page.getByText('Как подключить мой ноутбук к сервису?', { exact: true }),
  ).toBeVisible();
  const reply = await request.post(
    `http://127.0.0.1:4321/api/v1/admin/support/tickets/${id}/messages`,
    {
      headers: { Authorization: 'Bearer test-staff' },
      data: { message: 'Откройте раздел помощи и выберите вашу платформу.' },
    },
  );
  expect(reply.status()).toBe(200);
  await page.getByRole('button', { name: 'Проверить ответ' }).click();
  await expect(
    page.getByText('Откройте раздел помощи и выберите вашу платформу.', { exact: true }),
  ).toBeVisible();
  await page.getByLabel('Дополнить обращение').fill('Спасибо, получилось!');
  await page.getByRole('button', { name: 'Отправить сообщение', exact: true }).click();
  await expect(page.getByText('Спасибо, получилось!', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Спасибо, получилось!', { exact: true })).toBeVisible();
  const unauthorized = await request.post('/api/v1/support/read', {
    headers: { Origin: origin },
    data: { id, accessKey: '0'.repeat(64) },
  });
  expect(unauthorized.status()).toBe(404);
  expect(await unauthorized.text()).not.toContain('ноутбук');
  const crossOrigin = await request.post('/api/v1/support/message', {
    headers: { Origin: 'https://other.example' },
    data: { id, accessKey: params.get('key'), message: 'test' },
  });
  expect(crossOrigin.status()).toBe(403);
  await page.setViewportSize({ width: 375, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/support-ticket-mobile.png', fullPage: true });
});

test('public branding and metadata use the neutral project name', async ({ page, request }) => {
  for (const path of ['/', '/pricing', '/login', '/register', '/privacy', '/terms', '/support']) {
    await page.goto(path);
    await expect(
      page.getByRole('link', { name: 'Кукареку Онлайн — главная' }).first(),
    ).toBeVisible();
    expect(await page.locator('body').innerText()).not.toMatch(
      /VPN|ВПН|свободный интернет|обход блокировок|ускоритель интернета/i,
    );
    expect(await page.title()).not.toMatch(/VPN|ВПН/i);
    for (const content of await page
      .locator('meta[name="description"], meta[property^="og:"]')
      .evaluateAll((elements) => elements.map((e) => e.getAttribute('content') || '')))
      expect(content).not.toMatch(/VPN|ВПН/i);
    expect(
      await page
        .locator('img')
        .evaluateAll((elements) => elements.map((e) => e.getAttribute('src') || '').join(' ')),
    ).not.toContain('brand.png');
  }
  expect((await request.get('/brand.png')).status()).toBe(404);
});
