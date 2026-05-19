/**
 * 시각적 회귀 테스트 (Visual Regression)
 *
 * 기준 이미지 갱신:
 *   npm run test:visual:update
 */
import { test, expect } from '@playwright/test';
import { loginAsUser, loginAsAdmin, addFirstProductToCart, gotoFixedProductDetail } from './helpers';
import {
  screenshotPage,
  screenshotElement,
  stabilizeForScreenshot,
  ADMIN_DYNAMIC_MASKS,
  PRODUCT_DETAIL_MASKS,
} from './screenshot-helpers';

// ── 비로그인 페이지 ────────────────────────────────────────

test.describe('비로그인 UI', () => {

  test('메인 페이지', async ({ page }) => {
    await page.goto('/');
    await screenshotPage(page, 'main-page', { fullPage: true });
  });

  test('상품 목록 페이지', async ({ page }) => {
    await page.goto('/products');
    await screenshotPage(page, 'product-list', { fullPage: true });
  });

  test('상품 상세 페이지', async ({ page }) => {
    await gotoFixedProductDetail(page);
    await screenshotElement(
      page,
      '[data-testid="product-detail"]',
      'product-detail',
      PRODUCT_DETAIL_MASKS,
    );
  });

  test('로그인 페이지', async ({ page }) => {
    await page.goto('/auth/login');
    await screenshotPage(page, 'login-page');
  });

  test('회원가입 페이지', async ({ page }) => {
    await page.goto('/auth/register');
    await screenshotPage(page, 'register-page');
  });
});

// ── 로그인 후 페이지 ──────────────────────────────────────

test.describe('로그인 후 UI', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await page.waitForTimeout(600);
  });

  test('장바구니 (빈 상태)', async ({ page }) => {
    await page.goto('/cart');
    while (await page.locator('[data-testid^="remove-"]').count() > 0) {
      await page.locator('[data-testid^="remove-"]').first().click();
      await page.waitForTimeout(300);
    }
    await page.goto('/cart');
    await screenshotElement(page, 'main', 'cart-empty');
  });

  test('장바구니 (상품 있는 상태)', async ({ page }) => {
    await addFirstProductToCart(page);
    await page.goto('/cart');
    await screenshotElement(page, 'main', 'cart-with-items');
  });

  test('결제(체크아웃) 페이지', async ({ page }) => {
    await addFirstProductToCart(page);
    await page.goto('/cart/checkout');
    await screenshotElement(page, 'main', 'checkout-page');
  });
});

// ── 관리자 페이지 ─────────────────────────────────────────

test.describe('관리자 UI', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.waitForTimeout(600);
  });

  test('관리자 대시보드', async ({ page }) => {
    await page.goto('/admin');
    await screenshotPage(page, 'admin-dashboard', {
      extraMasks: ADMIN_DYNAMIC_MASKS,
    });
  });

  test('관리자 상품 목록', async ({ page }) => {
    await page.goto('/admin/products');
    // 데이터 테이블 제외 — 등록 버튼 등 고정 UI만 비교
    await screenshotElement(page, '[data-testid="add-product-btn"]', 'admin-product-list');
  });

  test('상품 등록 폼', async ({ page }) => {
    await page.goto('/admin/products/new');
    await screenshotPage(page, 'admin-product-new');
  });

  test('관리자 주문 목록', async ({ page }) => {
    await page.goto('/admin/orders');
    await expect(page).toHaveURL('/admin/orders');
    // 주문 페이지에는 h1/h2 없음 → 테이블 헤더(열 제목) 레이아웃만 비교
    const tableHeader = page.locator('table thead, table tr:has(th)').first();
    await expect(tableHeader).toBeVisible({ timeout: 10_000 });
    await expect(tableHeader).toHaveScreenshot('admin-order-list.png');
  });
});

// ── 오류/엣지 케이스 UI ───────────────────────────────────

test.describe('오류 UI', () => {

  test('404 페이지', async ({ page }) => {
    await page.goto('/products/99999999');
    await screenshotPage(page, '404-page');
  });

  test('로그인 실패 오류 메시지', async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('[data-testid="email-input"]').fill('wrong@example.com');
    await page.locator('[data-testid="password-input"]').fill('wrongpass');
    await page.locator('[data-testid="login-submit"]').click();
    await stabilizeForScreenshot(page);
    await screenshotPage(page, 'login-error-state');
  });

  test('회원가입 유효성 오류 메시지', async ({ page }) => {
    await page.goto('/auth/register');
    await page.locator('[data-testid="username-input"]').fill('a');
    await page.locator('[data-testid="register-submit"]').click();
    await stabilizeForScreenshot(page);
    await screenshotPage(page, 'register-error-state');
  });
});
