/**
 * 시각적 회귀 테스트 (Visual Regression)
 *
 * 동작 방식:
 *   1회차 실행 → 기준 스크린샷(baseline) 자동 생성 → tests/__screenshots__/ 에 저장
 *   이후 실행 → 현재 화면과 기준 이미지 픽셀 비교 → 2% 이상 차이나면 실패
 *
 * 기준 이미지 갱신:
 *   npx playwright test --project=visual --update-snapshots
 */
import { test, expect, Page } from '@playwright/test';
import { loginAsUser, loginAsAdmin } from './helpers';

/** 동적 콘텐츠(시간, 랜덤 등)를 마스킹하고 스크린샷 찍기 */
async function stableScreenshot(page: Page, name: string, masks: string[] = []) {
  // 공통으로 가릴 동적 요소 선택자 (날짜, 시각, 광고 등)
  const defaultMasks = [
    '[data-testid="timestamp"]',
    '.created-at',
    'time',
    '.flash',          // flash 메시지는 타이밍에 따라 다를 수 있음
  ];

  const allMasks = [...defaultMasks, ...masks].map(s => page.locator(s));

  await expect(page).toHaveScreenshot(`${name}.png`, {
    mask: allMasks,
    fullPage: true,
  });
}

// ── 비로그인 페이지 ────────────────────────────────────────

test.describe('비로그인 UI', () => {

  test('메인 페이지', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await stableScreenshot(page, 'main-page');
  });

  test('상품 목록 페이지', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    await stableScreenshot(page, 'product-list');
  });

  test('상품 상세 페이지', async ({ page }) => {
    await page.goto('/products');
    await page.locator('.card a, .product-card a, article a').first().click();
    await page.waitForLoadState('networkidle');
    await stableScreenshot(page, 'product-detail', ['.price', '.stock']);
  });

  test('로그인 페이지', async ({ page }) => {
    await page.goto('/login');
    await stableScreenshot(page, 'login-page');
  });

  test('회원가입 페이지', async ({ page }) => {
    await page.goto('/register');
    await stableScreenshot(page, 'register-page');
  });
});

// ── 로그인 후 페이지 ──────────────────────────────────────

test.describe('로그인 후 UI', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    // flash 메시지가 사라지길 잠시 대기
    await page.waitForTimeout(600);
  });

  test('장바구니 (빈 상태)', async ({ page }) => {
    // 장바구니 비우기
    await page.goto('/cart');
    const deleteButtons = page.getByRole('button', { name: /삭제|remove/i });
    while (await deleteButtons.count() > 0) {
      await deleteButtons.first().click();
      await page.waitForTimeout(300);
    }
    await page.goto('/cart');
    await stableScreenshot(page, 'cart-empty');
  });

  test('장바구니 (상품 있는 상태)', async ({ page }) => {
    // 상품 담기
    await page.goto('/products');
    await page.locator('.card a, .product-card a, article a').first().click();
    await page.getByRole('button', { name: /장바구니/i }).click();
    await page.waitForTimeout(400);

    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    await stableScreenshot(page, 'cart-with-items', ['.total', '.price']);
  });

  test('결제(체크아웃) 페이지', async ({ page }) => {
    // 상품이 담겨있어야 접근 가능
    await page.goto('/products');
    await page.locator('.card a, .product-card a, article a').first().click();
    await page.getByRole('button', { name: /장바구니/i }).click();
    await page.goto('/cart/checkout');
    await page.waitForLoadState('networkidle');
    await stableScreenshot(page, 'checkout-page', ['.total', '.price']);
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
    await page.waitForLoadState('networkidle');
    // 숫자 카운터는 마스킹
    await stableScreenshot(page, 'admin-dashboard', ['.count', '.badge', 'td:nth-child(1)']);
  });

  test('관리자 상품 목록', async ({ page }) => {
    await page.goto('/admin/products');
    await page.waitForLoadState('networkidle');
    await stableScreenshot(page, 'admin-product-list');
  });

  test('상품 등록 폼', async ({ page }) => {
    await page.goto('/admin/products/new');
    await stableScreenshot(page, 'admin-product-new');
  });

  test('관리자 주문 목록', async ({ page }) => {
    await page.goto('/admin/orders');
    await page.waitForLoadState('networkidle');
    await stableScreenshot(page, 'admin-order-list', ['td:nth-child(1)', '.created-at', 'time']);
  });
});

// ── 오류/엣지 케이스 UI ───────────────────────────────────

test.describe('오류 UI', () => {

  test('404 페이지', async ({ page }) => {
    await page.goto('/products/99999999');
    await stableScreenshot(page, '404-page');
  });

  test('로그인 실패 오류 메시지', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/이메일/i).fill('wrong@example.com');
    await page.getByLabel(/비밀번호/i).fill('wrongpass');
    await page.getByRole('button', { name: /로그인/i }).click();
    await page.waitForLoadState('networkidle');
    await stableScreenshot(page, 'login-error-state');
  });

  test('회원가입 유효성 오류 메시지', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel(/아이디/i).fill('a'); // 2자 미만
    await page.getByRole('button', { name: /회원가입/i }).click();
    await page.waitForLoadState('networkidle');
    await stableScreenshot(page, 'register-error-state');
  });
});
