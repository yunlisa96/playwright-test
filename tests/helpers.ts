import { Page, test } from '@playwright/test';

export const TEST_USER = {
  username: process.env.TEST_USERNAME ?? 'user',
  email:    process.env.TEST_EMAIL    ?? 'user@shop.com',
  password: process.env.TEST_PASSWORD ?? 'user1234',
};

export const ADMIN_USER = {
  email:    process.env.ADMIN_EMAIL    ?? 'admin@shop.com',
  password: process.env.ADMIN_PASSWORD ?? 'admin1234',
};

/** 로그인 공통 헬퍼
 *  - label에 for 속성 없음 → data-testid 사용
 */
export async function login(page: Page, email: string, password: string) {
  await test.step(`로그인: ${email}`, async () => {
    await page.goto('/auth/login');
    await page.locator('[data-testid="email-input"]').fill(email);
    await page.locator('[data-testid="password-input"]').fill(password);
    await page.locator('[data-testid="login-submit"]').click();
    await page.waitForURL('/');
  });
}

export async function loginAsUser(page: Page) {
  await login(page, TEST_USER.email, TEST_USER.password);
}

export async function loginAsAdmin(page: Page) {
  await login(page, ADMIN_USER.email, ADMIN_USER.password);
}

/** Flash 메시지 텍스트 반환
 *  HTML: <div class="alert alert-{category}" role="alert" data-testid="alert-{category}">
 */
export async function getFlashText(page: Page): Promise<string> {
  return test.step('Flash 메시지 확인', async () => {
    const flash = page.locator('[role="alert"]');
    await flash.first().waitFor({ timeout: 5_000 });
    return (await flash.first().textContent()) ?? '';
  });
}

/** 상품 목록에서 첫 번째 상품을 장바구니에 담기 */
export async function addFirstProductToCart(page: Page) {
  await test.step('첫 번째 상품 장바구니 담기', async () => {
    await page.goto('/products');
    await page.locator('[data-testid^="view-"]').first().click();
    await page.locator('[data-testid="add-to-cart-btn"]').click();
  });
}
