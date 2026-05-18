/**
 * TC-SHOP-01 ~ TC-SHOP-07  쇼핑 (메인 / 상품 목록 / 검색 / 필터 / 상세)
 *
 * 수정 이력:
 *   - '.card a' → data-testid="view-{id}" / "detail-btn-{id}"
 *   - getByRole('searchbox') → data-testid="search-input"
 *   - 카테고리 필터 → data-testid="filter-{cat}"
 */
import { test, expect } from '@playwright/test';

test.describe('메인 페이지', () => {

  test('TC-SHOP-01 | 메인 페이지 로드', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="hero-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="browse-btn"]')).toBeVisible();
    // 추천 상품 영역 노출
    await expect(page.locator('[data-testid="featured-products"]')).toBeVisible();
  });
});

test.describe('상품 목록', () => {

  test('TC-SHOP-02 | 상품 목록 페이지 로드', async ({ page }) => {
    await page.goto('/products');
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="category-filter"]')).toBeVisible();
    // 상품 그리드 또는 검색 결과 없음 중 하나 존재
    const hasGrid   = await page.locator('[data-testid="product-grid"]').count() > 0;
    const hasNoResult = await page.locator('[data-testid="no-results"]').count() > 0;
    expect(hasGrid || hasNoResult).toBeTruthy();
  });

  test('TC-SHOP-03 | 상품명 검색', async ({ page }) => {
    await page.goto('/products');
    await page.locator('[data-testid="search-input"]').fill('상품');
    await page.locator('[data-testid="search-btn"]').click();

    await expect(page).toHaveURL(/[?&]q=%EC%83%81%ED%92%88/); // "상품" URL 인코딩
    const hasGrid     = await page.locator('[data-testid="product-grid"]').count() > 0;
    const hasNoResult = await page.locator('[data-testid="no-results"]').count() > 0;
    expect(hasGrid || hasNoResult).toBeTruthy();
  });

  test('TC-SHOP-04 | 카테고리 필터', async ({ page }) => {
    await page.goto('/products');
    const catLinks = page.locator('[data-testid^="filter-"]');
    // 전체 제외 첫 카테고리 클릭
    const count = await catLinks.count();
    if (count === 0) {
      test.skip();
      return;
    }
    await catLinks.first().click();
    await expect(page).toHaveURL(/category=/);
    // 선택된 카테고리 링크가 active 상태
    await expect(catLinks.first()).toHaveClass(/active/);
  });

  test('TC-SHOP-05 | 페이지네이션', async ({ page }) => {
    await page.goto('/products');
    const pagination = page.locator('[data-testid="pagination"]');
    if (await pagination.count() === 0) {
      test.skip(); // 상품 7개 미만
      return;
    }
    const page2 = pagination.locator('a.page-link').filter({ hasText: '2' });
    await page2.click();
    await expect(page).toHaveURL(/page=2/);
  });
});

test.describe('상품 상세', () => {

  test('TC-SHOP-06 | 상품 상세 페이지 조회', async ({ page }) => {
    await page.goto('/products');
    const firstView = page.locator('[data-testid^="view-"]').first();
    await firstView.click();

    await expect(page).toHaveURL(/\/products\/\d+/);
    await expect(page.locator('[data-testid="product-detail"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-price"]')).toBeVisible();
  });

  test('TC-SHOP-07 | 존재하지 않는 상품 → 404', async ({ page }) => {
    const response = await page.goto('/products/99999999');
    expect(response?.status()).toBe(404);
  });
});
