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

/** 스크린샷 비교용 고정 상품 ID (DB seed의 안정적인 상품) */
export const SCREENSHOT_PRODUCT_ID = process.env.SCREENSHOT_PRODUCT_ID ?? '1';

/** 고정 상품 상세 페이지로 이동 (스크린샷 테스트용) */
export async function gotoFixedProductDetail(page: Page) {
  await test.step(`상품 상세 이동: #${SCREENSHOT_PRODUCT_ID}`, async () => {
    const response = await page.goto(`/products/${SCREENSHOT_PRODUCT_ID}`, {
      waitUntil: 'domcontentloaded',
    });
    if (response?.status() === 404) {
      await page.goto('/products');
      await page.locator(`[data-testid="view-${SCREENSHOT_PRODUCT_ID}"]`).click();
    }
    await page.locator('[data-testid="product-detail"]').waitFor({ state: 'visible' });
    await page.waitForLoadState('networkidle');
  });
}

/** 로그인 공통 헬퍼
 *  - label에 for 속성 없음 → data-testid 사용
 */
export async function login(page: Page, email: string, password: string) {
  await test.step(`로그인: ${email}`, async () => {
    await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-testid="email-input"]').fill(email);
    await page.locator('[data-testid="password-input"]').fill(password);
    await page.locator('[data-testid="login-submit"]').click();
    await page.waitForURL('/', { timeout: 15_000, waitUntil: 'domcontentloaded' });
  });
}

export async function loginAsUser(page: Page) {
  await login(page, TEST_USER.email, TEST_USER.password);
}

/** 관리자 로그인 — 성공 시 `/` 또는 `/admin` 으로 리다이렉트될 수 있음 */
export async function loginAsAdmin(page: Page) {
  await test.step(`관리자 로그인: ${ADMIN_USER.email}`, async () => {
    await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-testid="email-input"]').fill(ADMIN_USER.email);
    await page.locator('[data-testid="password-input"]').fill(ADMIN_USER.password);
    await page.locator('[data-testid="login-submit"]').click();
    await page.waitForURL(url => {
      const path = new URL(url).pathname;
      return path === '/' || path === '/admin' || path.startsWith('/admin/');
    }, { timeout: 15_000, waitUntil: 'domcontentloaded' });
  });
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

/** 고정 상품을 장바구니에 담기 (스크린샷 테스트용) */
export async function addFixedProductToCart(page: Page) {
  await test.step(`고정 상품(#${SCREENSHOT_PRODUCT_ID}) 장바구니 담기`, async () => {
    await gotoFixedProductDetail(page);
    await page.locator('[data-testid="add-to-cart-btn"]').click();
  });
}
