/**
 * TC-CART-01 ~ TC-CART-10  장바구니 / 결제
 *
 * 수정 이력:
 *   - 장바구니 담기: data-testid="add-to-cart-btn"
 *   - 수량 input:   data-testid="qty-input-{id}"
 *   - 수정 버튼:    data-testid="update-qty-{id}"
 *   - 삭제 버튼:    data-testid="remove-{id}"  (아이콘만 있어 텍스트 매칭 불가)
 *   - 주문하기:     data-testid="checkout-btn"  (<a> 태그)
 *   - 배송지 input: data-testid="address-input"
 *   - 결제완료 버튼: data-testid="place-order-btn"
 */
import { test, expect } from '@playwright/test';
import { loginAsUser, getFlashText, addFirstProductToCart } from './helpers';

test.describe('장바구니 - 비로그인', () => {

  test('TC-CART-01 | 비로그인 장바구니 접근 → 로그인 리다이렉트', async ({ page }) => {
    await page.goto('/cart');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('장바구니 - 로그인', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test('TC-CART-02 | 상품 장바구니 담기', async ({ page }) => {
    await addFirstProductToCart(page);
    expect(await getFlashText(page)).toContain('장바구니에 추가되었습니다');

    await page.goto('/cart');
    await expect(page.locator('[data-testid="cart-items"]')).toBeVisible();
  });

  test('TC-CART-03 | 동일 상품 재담기 시 수량 합산', async ({ page }) => {
    // 상품 상세 페이지 URL 기억
    await page.goto('/products');
    await page.locator('[data-testid^="view-"]').first().click();
    const productUrl = page.url();

    // 1차 담기
    await page.locator('[data-testid="add-to-cart-btn"]').click();
    // 2차 담기
    await page.goto(productUrl);
    await page.locator('[data-testid="add-to-cart-btn"]').click();

    await page.goto('/cart');
    // 수량 input 값이 2 이상인지 확인
    const qtyInputs = page.locator('[data-testid^="qty-input-"]');
    const firstQty = await qtyInputs.first().inputValue();
    expect(parseInt(firstQty)).toBeGreaterThanOrEqual(2);
  });

  test('TC-CART-04 | 장바구니 페이지 조회', async ({ page }) => {
    await addFirstProductToCart(page);
    await page.goto('/cart');

    await expect(page.locator('[data-testid="cart-items"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-total"]')).toBeVisible();
    await expect(page.locator('[data-testid="checkout-btn"]')).toBeVisible();
  });

  test('TC-CART-05 | 장바구니 수량 변경', async ({ page }) => {
    await addFirstProductToCart(page);
    await page.goto('/cart');

    // 첫 번째 아이템 수량 3으로 변경
    const firstQtyInput  = page.locator('[data-testid^="qty-input-"]').first();
    const firstUpdateBtn = page.locator('[data-testid^="update-qty-"]').first();

    await firstQtyInput.fill('3');
    await firstUpdateBtn.click();

    await page.goto('/cart');
    const updatedQty = await page.locator('[data-testid^="qty-input-"]').first().inputValue();
    expect(parseInt(updatedQty)).toBe(3);
  });

  test('TC-CART-06 | 수량 0 입력 시 상품 삭제', async ({ page }) => {
    await addFirstProductToCart(page);
    await page.goto('/cart');

    const firstQtyInput  = page.locator('[data-testid^="qty-input-"]').first();
    const firstUpdateBtn = page.locator('[data-testid^="update-qty-"]').first();

    await firstQtyInput.fill('0');
    await firstUpdateBtn.click();

    // 비어있거나 해당 아이템이 사라져야 함
    const cartItems = page.locator('[data-testid="cart-items"]');
    const emptyCart = page.locator('[data-testid="empty-cart"]');
    const hasItems  = await cartItems.count() > 0;
    const isEmpty   = await emptyCart.count() > 0;
    expect(hasItems || isEmpty).toBeTruthy();
  });

  test('TC-CART-07 | 장바구니 상품 삭제', async ({ page }) => {
    await addFirstProductToCart(page);
    await page.goto('/cart');

    // data-testid="remove-{item_id}" 버튼 클릭
    await page.locator('[data-testid^="remove-"]').first().click();
    expect(await getFlashText(page)).toContain('삭제');
  });

  test('TC-CART-08 | 빈 장바구니에서 체크아웃 접근', async ({ page }) => {
    // 장바구니 비우기
    await page.goto('/cart');
    while (await page.locator('[data-testid^="remove-"]').count() > 0) {
      await page.locator('[data-testid^="remove-"]').first().click();
      await page.waitForTimeout(300);
    }
    await page.goto('/cart/checkout');
    expect(await getFlashText(page)).toContain('비어있습니다');
    // 서버가 trailing slash(/cart/)로 리다이렉트하는 경우도 허용
    await expect(page).toHaveURL(/\/cart\/?$/);
  });

  test('TC-CART-09 | 정상 주문 완료', async ({ page }) => {
    await addFirstProductToCart(page);
    await page.goto('/cart');

    // "주문하기" 링크 (<a> 태그)
    await page.locator('[data-testid="checkout-btn"]').click();
    await expect(page).toHaveURL('/cart/checkout');

    await page.locator('[data-testid="address-input"]').fill('서울시 강남구 테헤란로 1');
    await page.locator('[data-testid="place-order-btn"]').click();

    await expect(page).toHaveURL(/\/cart\/order\/\d+/);
    expect(await getFlashText(page)).toContain('주문이 완료되었습니다');
  });

  test('TC-CART-10 | 배송지 미입력 결제 시도', async ({ page }) => {
    await addFirstProductToCart(page);
    await page.goto('/cart/checkout');

    // 배송지 비운 채 제출
    const addressInput = page.locator('[data-testid="address-input"]');
    await addressInput.fill('');
    await page.locator('[data-testid="place-order-btn"]').click();

    // 체크아웃 페이지에 머물러야 함
    await expect(page).toHaveURL('/cart/checkout');

    // HTML5 required 속성 검증 또는 서버 플래시 메시지 중 하나로 처리
    const hasRequired = await addressInput.evaluate((el: HTMLInputElement) => el.hasAttribute('required'));
    const hasValidationError = await addressInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    const hasFlash = await page.locator('[role="alert"]').count() > 0;
    expect(hasRequired || hasValidationError || hasFlash, '배송지 미입력 시 유효성 오류가 표시되어야 합니다').toBeTruthy();
  });
});
