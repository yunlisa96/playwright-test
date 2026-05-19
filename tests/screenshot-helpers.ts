import { expect, Locator, Page } from '@playwright/test';

/** DB·시간·가격 등 변동 콘텐츠 공통 마스크 선택자 */
const BASE_MASK_SELECTORS = [
  '[data-testid="timestamp"]',
  '.created-at',
  'time',
  '.flash',
  '[data-testid="featured-products"]',
  '[data-testid="product-grid"]',
  '.price, .total, .stock',
];

export type ScreenshotOptions = {
  fullPage?: boolean;
  extraMasks?: string[];
  maxDiffPixelRatio?: number;
};

export function maskLocators(page: Page, extra: string[] = []): Locator[] {
  return [...BASE_MASK_SELECTORS, ...extra].map(s => page.locator(s));
}

/** 장바구니 — 상품명·수량·합계 등 가변 콘텐츠 */
export const CART_SCREENSHOT_MASKS = [
  '[data-testid="cart-items"]',
  '[data-testid="cart-total"]',
  '[data-testid^="qty-input-"]',
  '[data-testid^="remove-"]',
  '.price, .total',
];

/** 상품 상세 — 이름·가격·이미지·설명 등 가변 콘텐츠 */
export const PRODUCT_DETAIL_MASKS = [
  '[data-testid="product-name"]',
  '[data-testid="product-price"]',
  '[data-testid="product-desc"]',
  '[data-testid="product-detail"] img',
  '[data-testid="product-detail"] .description',
  '[data-testid="add-to-cart-btn"]',
];

/** 관리자 — 테이블·통계 전체 (행 수·주문 데이터 변동) */
export const ADMIN_DYNAMIC_MASKS = [
  '[data-testid="stat-products"]',
  '[data-testid="stat-users"]',
  '[data-testid="stat-orders"]',
  '[data-testid="admin-product-table"]',
  '[data-testid="recent-orders-table"]',
  'table',
  'tbody',
  'td',
];

/** @deprecated ADMIN_DYNAMIC_MASKS 사용 */
export const ADMIN_TABLE_MASKS = ADMIN_DYNAMIC_MASKS;

/** 관리자 목록 페이지 — 네비·테이블·푸터 등 가변 영역 */
export const ADMIN_LIST_PAGE_MASKS = [
  ...ADMIN_DYNAMIC_MASKS,
  'nav',
  'footer',
  '.pagination',
  'main table',
  'main .table-responsive',
];

/** 스크린샷 직전 네트워크·flash 안정화 */
export async function stabilizeForScreenshot(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.locator('.flash').waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
  // 레이아웃 안정화 (폰트·이미지 로드)
  await page.waitForTimeout(200);
}

/** 페이지 전체 또는 뷰포트 스크린샷 */
export async function screenshotPage(
  page: Page,
  name: string,
  options: ScreenshotOptions = {},
) {
  const { fullPage = false, extraMasks = [], maxDiffPixelRatio } = options;
  await stabilizeForScreenshot(page);
  await expect(page).toHaveScreenshot(`${name}.png`, {
    fullPage,
    mask: maskLocators(page, extraMasks),
    ...(maxDiffPixelRatio !== undefined ? { maxDiffPixelRatio } : {}),
  });
}

/** 특정 요소만 캡처 (높이 불일치 방지) */
export async function screenshotElement(
  page: Page,
  selector: string,
  name: string,
  extraMasks: string[] = [],
  options: { maxDiffPixelRatio?: number } = {},
) {
  await stabilizeForScreenshot(page);
  const target = page.locator(selector).first();
  await expect(target).toBeVisible();
  await expect(target).toHaveScreenshot(`${name}.png`, {
    mask: maskLocators(page, extraMasks),
    ...(options.maxDiffPixelRatio !== undefined ? { maxDiffPixelRatio: options.maxDiffPixelRatio } : {}),
  });
}

/** 페이지 제목 캡처 — h1/h2 없으면 fallback 셀렉터 사용 */
export async function screenshotPageHeading(
  page: Page,
  name: string,
  fallbackSelector?: string,
) {
  await stabilizeForScreenshot(page);
  const heading = page.locator('h1, h2, .page-title').first();
  if (await heading.count() > 0) {
    await expect(heading).toBeVisible();
    await expect(heading).toHaveScreenshot(`${name}.png`);
    return;
  }
  if (!fallbackSelector) {
    throw new Error(`제목 요소(h1/h2)를 찾을 수 없습니다: ${name}`);
  }
  await screenshotElement(page, fallbackSelector, name, ADMIN_DYNAMIC_MASKS);
}
