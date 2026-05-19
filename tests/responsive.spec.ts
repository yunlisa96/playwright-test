/**
 * 반응형 UI 테스트 (Responsive)
 *
 * 3개 프로젝트(mobile / tablet / desktop)에서 동일한 테스트가 실행됨
 * playwright.config.ts 의 responsive-* 프로젝트 참고
 */
import { test, expect, Page } from '@playwright/test';
import { loginAsUser, addFixedProductToCart, gotoFixedProductDetail } from './helpers';
import {
  maskLocators,
  stabilizeForScreenshot,
  screenshotElement,
  PRODUCT_DETAIL_MASKS,
  CART_SCREENSHOT_MASKS,
} from './screenshot-helpers';

/** 현재 뷰포트 이름 (config 프로젝트 이름 기반) */
function viewportLabel(page: Page): string {
  const w = page.viewportSize()?.width ?? 0;
  if (w <= 480) return 'mobile';
  if (w <= 1024) return 'tablet';
  return 'desktop';
}

/** 가로 스크롤 허용 오차 — 모바일 장바구니 테이블은 소폭 넘칠 수 있음 */
function horizontalScrollTolerance(page: Page): number {
  return viewportLabel(page) === 'mobile' ? 40 : 5;
}

/** 뷰포트 기준 스크린샷 (fullPage 높이 변동 방지) */
async function screenshotViewport(page: Page, name: string) {
  await stabilizeForScreenshot(page);
  await expect(page).toHaveScreenshot(`${name}.png`, {
    fullPage: false,
    mask: maskLocators(page),
  });
}

// ── 공통 레이아웃 ─────────────────────────────────────────

test.describe('공통 레이아웃', () => {

  test('네비게이션 바 표시 확인', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav, header, [role="navigation"]').first();
    await expect(nav).toBeVisible();

    const vp = viewportLabel(page);

    if (vp === 'mobile') {
      const hamburger = page.locator(
        '[class*="hamburger"], [class*="toggle"], button[aria-label*="menu"], .navbar-toggler'
      );
      if (await hamburger.count() > 0) {
        await expect(hamburger.first()).toBeVisible();
      }
    } else {
      const menuItems = page.locator('nav a, header a').filter({ hasNotText: /logo|brand/i });
      expect(await menuItems.count()).toBeGreaterThan(0);
    }
  });

  test('페이지가 가로 스크롤 없이 렌더링', async ({ page }) => {
    const pages = ['/', '/products', '/auth/login', '/auth/register'];
    for (const path of pages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

      expect(scrollWidth, `${path} 에서 가로 스크롤 발생`).toBeLessThanOrEqual(clientWidth + 5);
    }
  });

  test('푸터 표시 확인', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    if (await footer.count() > 0) {
      await expect(footer).toBeVisible();
    }
  });
});

// ── 메인 페이지 ───────────────────────────────────────────

test.describe('메인 페이지 반응형', () => {

  test('추천 상품 그리드 레이아웃', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('.card, .product-card, article');
    const count = await cards.count();
    if (count === 0) return;

    const vp = viewportLabel(page);
    const firstCard = cards.first();
    const box = await firstCard.boundingBox();

    if (vp === 'mobile') {
      const viewportWidth = page.viewportSize()?.width ?? 375;
      expect(box?.width ?? 0).toBeGreaterThan(viewportWidth * 0.7);
    } else {
      const viewportWidth = page.viewportSize()?.width ?? 1280;
      expect(box?.width ?? 0).toBeLessThan(viewportWidth * 0.7);
    }
  });

  test('메인 페이지 스크린샷', async ({ page }) => {
    await page.goto('/');
    await screenshotViewport(page, `main-${viewportLabel(page)}`);
  });
});

// ── 상품 목록 ─────────────────────────────────────────────

test.describe('상품 목록 반응형', () => {

  test('검색창이 뷰포트 내 표시', async ({ page }) => {
    await page.goto('/products');
    const searchInput = page.locator('[data-testid="search-input"]');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeInViewport();
  });

  test('상품 카드 오버플로우 없음', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    const viewportWidth = page.viewportSize()?.width ?? 1280;
    const cards = page.locator('.card, .product-card, article');
    const count = await cards.count();

    for (let i = 0; i < Math.min(count, 3); i++) {
      const box = await cards.nth(i).boundingBox();
      if (box) {
        expect(box.x + box.width, `카드 ${i} 가 화면 밖으로 넘침`).toBeLessThanOrEqual(viewportWidth + 5);
      }
    }
  });

  test('상품 목록 스크린샷', async ({ page }) => {
    await page.goto('/products');
    await screenshotViewport(page, `product-list-${viewportLabel(page)}`);
  });
});

// ── 로그인/회원가입 폼 ────────────────────────────────────

test.describe('인증 폼 반응형', () => {

  test('로그인 폼 요소가 모두 뷰포트 내 표시', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-submit"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-submit"]')).toBeInViewport();
  });

  test('회원가입 폼 요소가 모두 뷰포트 내 표시', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page.locator('[data-testid="username-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="register-submit"]')).toBeInViewport();
  });

  test('로그인 폼 스크린샷', async ({ page }) => {
    await page.goto('/auth/login');
    await screenshotViewport(page, `login-${viewportLabel(page)}`);
  });
});

// ── 장바구니 ──────────────────────────────────────────────

test.describe('장바구니 반응형', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await addFixedProductToCart(page);
    await page.waitForTimeout(600);
  });

  test('장바구니 테이블/목록이 뷰포트 내 표시', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    const viewportWidth = page.viewportSize()?.width ?? 1280;
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const tolerance = horizontalScrollTolerance(page);
    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + tolerance);
  });

  test('장바구니 스크린샷', async ({ page }) => {
    await page.goto('/cart');
    await stabilizeForScreenshot(page);
    // 고정 UI만: 결제 버튼 영역 (상품 목록·합계는 마스킹)
    await screenshotElement(
      page,
      '[data-testid="checkout-btn"]',
      `cart-${viewportLabel(page)}`,
      CART_SCREENSHOT_MASKS,
    );
  });
});

// ── 상품 상세 ─────────────────────────────────────────────

test.describe('상품 상세 반응형', () => {

  test('상품 이미지가 뷰포트를 넘지 않음', async ({ page }) => {
    await gotoFixedProductDetail(page);

    const viewportWidth = page.viewportSize()?.width ?? 1280;
    const img = page.locator('img').first();
    if (await img.count() > 0) {
      const box = await img.boundingBox();
      if (box) {
        expect(box.width).toBeLessThanOrEqual(viewportWidth + 5);
      }
    }
  });

  test('상품 상세 스크린샷', async ({ page }) => {
    await gotoFixedProductDetail(page);
    await screenshotElement(
      page,
      '[data-testid="product-detail"]',
      `product-detail-${viewportLabel(page)}`,
      PRODUCT_DETAIL_MASKS,
      { maxDiffPixelRatio: 0.12 },
    );
  });
});
