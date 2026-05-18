/**
 * TC-ADMIN-01 ~ TC-ADMIN-09  관리자 기능
 *
 * 수정 이력:
 *   - 수정 버튼: data-testid="edit-{id}"
 *   - 삭제 버튼: data-testid="delete-{id}" + confirm() 다이얼로그 처리
 *   - 상품 폼 input: data-testid="product-name-input" 등
 *   - 등록 버튼 텍스트: "등록하기" / 수정: "수정 완료"  → data-testid="product-submit-btn"
 *   - 대시보드 통계: data-testid="stat-products/users/orders"
 */
import { test, expect } from '@playwright/test';
import { loginAsUser, loginAsAdmin, getFlashText } from './helpers';

const UNIQUE = () => Date.now().toString().slice(-6);

test.describe('관리자 - 접근 제어', () => {

  test('TC-ADMIN-01 | 일반 유저의 관리자 페이지 접근 차단', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/admin');
    await expect(page).toHaveURL('/');
    expect(await getFlashText(page)).toContain('관리자만 접근할 수 있습니다');
  });
});

test.describe('관리자 - 대시보드 / 목록', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('TC-ADMIN-02 | 관리자 대시보드 조회', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('[data-testid="stat-products"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-orders"]')).toBeVisible();
    await expect(page.locator('[data-testid="recent-orders-table"]')).toBeVisible();
  });

  test('TC-ADMIN-03 | 관리자 상품 목록 조회', async ({ page }) => {
    await page.goto('/admin/products');
    await expect(page.locator('[data-testid="admin-product-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-product-btn"]')).toBeVisible();
  });
});

test.describe('관리자 - 상품 CRUD', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('TC-ADMIN-04 | 신규 상품 등록', async ({ page }) => {
    const productName = `테스트상품_${UNIQUE()}`;
    await page.goto('/admin/products/new');

    await page.locator('[data-testid="product-name-input"]').fill(productName);
    await page.locator('[data-testid="product-desc-input"]').fill('자동 테스트용 상품');
    await page.locator('[data-testid="product-price-input"]').fill('15000');
    await page.locator('[data-testid="product-stock-input"]').fill('10');
    await page.locator('[data-testid="product-category-input"]').fill('테스트');
    await page.locator('[data-testid="product-submit-btn"]').click(); // "등록하기"

    await expect(page).toHaveURL('/admin/products');
    expect(await getFlashText(page)).toContain('등록되었습니다');
    await expect(page.locator('[data-testid="admin-product-table"]')).toContainText(productName);
  });

  test('TC-ADMIN-05 | 상품명/가격 미입력 등록 시도', async ({ page }) => {
    await page.goto('/admin/products/new');
    // 상품명·가격 비운 채 제출
    await page.locator('[data-testid="product-name-input"]').fill('');
    await page.locator('[data-testid="product-submit-btn"]').click();

    // HTML required 속성 또는 서버 검증으로 현재 페이지에 머뭄
    const isStillOnForm = page.url().includes('/admin/products/new');
    const hasError      = await page.locator('[role="alert"]').count() > 0;
    expect(isStillOnForm || hasError).toBeTruthy();
  });

  test('TC-ADMIN-06 | 상품 정보 수정', async ({ page }) => {
    await page.goto('/admin/products');
    // 첫 번째 수정 버튼 클릭
    await page.locator('[data-testid^="edit-"]').first().click();
    await expect(page).toHaveURL(/\/admin\/products\/\d+\/edit/);

    const newName = `수정상품_${UNIQUE()}`;
    await page.locator('[data-testid="product-name-input"]').fill(newName);
    await page.locator('[data-testid="product-submit-btn"]').click(); // "수정 완료"

    await expect(page).toHaveURL('/admin/products');
    expect(await getFlashText(page)).toContain('수정되었습니다');
    await expect(page.locator('[data-testid="admin-product-table"]')).toContainText(newName);
  });

  test('TC-ADMIN-07 | 상품 활성/비활성 전환', async ({ page }) => {
    await page.goto('/admin/products');
    await page.locator('[data-testid^="edit-"]').first().click();

    const checkbox = page.locator('input[name="is_active"]');
    const waChecked = await checkbox.isChecked();
    waChecked ? await checkbox.uncheck() : await checkbox.check();

    await page.locator('[data-testid="product-submit-btn"]').click();
    await expect(page).toHaveURL('/admin/products');
    expect(await getFlashText(page)).toContain('수정되었습니다');
  });

  test('TC-ADMIN-08 | 상품 비활성화(삭제)', async ({ page }) => {
    // confirm() 다이얼로그를 자동으로 수락
    page.on('dialog', dialog => dialog.accept());

    await page.goto('/admin/products');
    await page.locator('[data-testid^="delete-"]').first().click();

    expect(await getFlashText(page)).toContain('비활성화되었습니다');
  });
});

test.describe('관리자 - 주문', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('TC-ADMIN-09 | 주문 목록 조회', async ({ page }) => {
    await page.goto('/admin/orders');
    await expect(page).toHaveURL('/admin/orders');
    // 주문 테이블 또는 "주문 없음" 메시지 확인
    const hasTable  = await page.locator('table').count() > 0;
    expect(hasTable).toBeTruthy();
  });
});
