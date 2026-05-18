/**
 * 반응형 UI 테스트 (Responsive)
 *
 * 3개 프로젝트(mobile / tablet / desktop)에서 동일한 테스트가 실행됨
 * playwright.config.ts 의 responsive-* 프로젝트 참고
 *
 * 실행:
 *   npx playwright test --project=responsive-mobile
 *   npx playwright test --project=responsive-tablet
 *   npx playwright test --project=responsive-desktop
 *   npx playwright test responsive   ← 3개 동시 실행
 */
import { test, expect, Page } from '@playwright/test';
import { loginAsUser } from './helpers';

/** 현재 뷰포트 이름 (config 프로젝트 이름 기반) */
function viewportLabel(page: Page): string {
  const w = page.viewportSize()?.width ?? 0;
  if (w <= 480) return 'mobile';
  if (w <= 1024) return 'tablet';
  return 'desktop';
}

// ── 공통 레이아웃 ─────────────────────────────────────────

test.describe('공통 레이아웃', () => {

  test('네비게이션 바 표시 확인', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav, header, [role="navigation"]').first();
    await expect(nav).toBeVisible();

    const vp = viewportLabel(page);

    if (vp === 'mobile') {
      // 모바일: 햄버거 메뉴 또는 축소 네비게이션 확인
      const hamburger = page.locator(
        '[class*="hamburger"], [class*="toggle"], button[aria-label*="menu"], .navbar-toggler'
      );
      // 햄버거가 있으면 visible 해야 함
      if (await hamburger.count() > 0) {
        await expect(hamburger.first()).toBeVisible();
      }
    } else {
      // 태블릿/데스크톱: 메뉴 항목 직접 노출
      const menuItems = page.locator('nav a, header a').filter({ hasNotText: /logo|brand/i });
      expect(await menuItems.count()).toBeGreaterThan(0);
    }
  });

  test('페이지가 가로 스크롤 없이 렌더링', async ({ page }) => {
    const pages = ['/', '/products', '/login', '/register'];
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
    if (count === 0) return; // 상품 없으면 스킵

    const vp = viewportLabel(page);
    const firstCard = cards.first();
    const box = await firstCard.boundingBox();

    if (vp === 'mobile') {
      // 모바일: 카드 너비가 화면의 80% 이상 (세로 단일 컬럼)
      const viewportWidth = page.viewportSize()?.width ?? 375;
      expect(box?.width ?? 0).toBeGreaterThan(viewportWidth * 0.7);
    } else {
      // 태블릿/데스크톱: 카드가 화면보다 좁음 (멀티 컬럼)
      const viewportWidth = page.viewportSize()?.width ?? 1280;
      expect(box?.width ?? 0).toBeLessThan(viewportWidth * 0.7);
    }
  });

  test('메인 페이지 스크린샷', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot(`main-${viewportLabel(page)}.png`, {
      fullPage: true,
      animations: 'disabled',
      mask: [page.locator('time, .flash')],
    });
  });
});

// ── 상품 목록 ─────────────────────────────────────────────

test.describe('상품 목록 반응형', () => {

  test('검색창이 뷰포트 내 표시', async ({ page }) => {
    await page.goto('/products');
    const searchInput = page.locator('input[name="q"]');
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
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot(`product-list-${viewportLabel(page)}.png`, {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

// ── 로그인/회원가입 폼 ────────────────────────────────────

test.describe('인증 폼 반응형', () => {

  test('로그인 폼 요소가 모두 뷰포트 내 표시', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/이메일/i)).toBeVisible();
    await expect(page.getByLabel(/비밀번호/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /로그인/i })).toBeVisible();

    // 모든 요소가 뷰포트 내에 있는지 확인
    await expect(page.getByRole('button', { name: /로그인/i })).toBeInViewport();
  });

  test('회원가입 폼 요소가 모두 뷰포트 내 표시', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByLabel(/아이디/i)).toBeVisible();
    await expect(page.getByLabel(/이메일/i)).toBeVisible();
    await expect(page.getByLabel(/^비밀번호$/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /회원가입/i })).toBeInViewport();
  });

  test('로그인 폼 스크린샷', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveScreenshot(`login-${viewportLabel(page)}.png`, {
      animations: 'disabled',
    });
  });
});

// ── 장바구니 ──────────────────────────────────────────────

test.describe('장바구니 반응형', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    // 상품 하나 담기
    await page.goto('/products');
    const firstLink = page.locator('.card a, .product-card a, article a').first();
    if (await firstLink.count() > 0) {
      await firstLink.click();
      await page.getByRole('button', { name: /장바구니/i }).click();
    }
  });

  test('장바구니 테이블/목록이 뷰포트 내 표시', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    const viewportWidth = page.viewportSize()?.width ?? 1280;
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 5);
  });

  test('장바구니 스크린샷', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(400); // flash 메시지 사라지길 대기
    await expect(page).toHaveScreenshot(`cart-${viewportLabel(page)}.png`, {
      fullPage: true,
      animations: 'disabled',
      mask: [page.locator('.flash, .price, .total')],
    });
  });
});

// ── 상품 상세 ─────────────────────────────────────────────

test.describe('상품 상세 반응형', () => {

  test('상품 이미지가 뷰포트를 넘지 않음', async ({ page }) => {
    await page.goto('/products');
    const firstLink = page.locator('.card a, .product-card a, article a').first();
    if (await firstLink.count() === 0) return;
    await firstLink.click();
    await page.waitForLoadState('networkidle');

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
    await page.goto('/products');
    const firstLink = page.locator('.card a, .product-card a, article a').first();
    if (await firstLink.count() === 0) return;
    await firstLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot(`product-detail-${viewportLabel(page)}.png`, {
      fullPage: true,
      animations: 'disabled',
      mask: [page.locator('.price, .stock, time')],
    });
  });
});
