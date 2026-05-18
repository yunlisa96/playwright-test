/**
 * TC-AUTH-01 ~ TC-AUTH-12  인증 (회원가입 / 로그인 / 로그아웃)
 *
 * 수정 이력:
 *   - getByLabel() → data-testid 셀렉터 (label에 for 속성 없음)
 *   - 가입 버튼 텍스트: "가입하기" (register-submit)
 */
import { test, expect } from '@playwright/test';
import { loginAsUser, getFlashText, TEST_USER } from './helpers';

const UNIQUE = () => Date.now().toString().slice(-6);

// ── 회원가입 ────────────────────────────────────────────────

test.describe('회원가입', () => {

  test('TC-AUTH-01 | 정상 회원가입', async ({ page }) => {
    const id = UNIQUE();
    await page.goto('/auth/register');
    await page.locator('[data-testid="username-input"]').fill(`user${id}`);
    await page.locator('[data-testid="email-input"]').fill(`user${id}@example.com`);
    await page.locator('[data-testid="password-input"]').fill('password123');
    await page.locator('[data-testid="password2-input"]').fill('password123');
    await page.locator('[data-testid="register-submit"]').click();

    await expect(page).toHaveURL('/auth/login');
    expect(await getFlashText(page)).toContain('회원가입이 완료되었습니다');
  });

  test('TC-AUTH-02 | 아이디 2자 미만', async ({ page }) => {
    await page.goto('/auth/register');
    await page.locator('[data-testid="username-input"]').fill('a');
    await page.locator('[data-testid="email-input"]').fill(`short${UNIQUE()}@example.com`);
    await page.locator('[data-testid="password-input"]').fill('password123');
    await page.locator('[data-testid="password2-input"]').fill('password123');
    await page.locator('[data-testid="register-submit"]').click();

    await expect(page).toHaveURL('/auth/register');
    expect(await getFlashText(page)).toContain('2자 이상');
  });

  test('TC-AUTH-03 | 이메일 형식 오류', async ({ page }) => {
    await page.goto('/auth/register');
    await page.locator('[data-testid="username-input"]').fill(`user${UNIQUE()}`);
    await page.locator('[data-testid="email-input"]').fill('notanemail');
    await page.locator('[data-testid="password-input"]').fill('password123');
    await page.locator('[data-testid="password2-input"]').fill('password123');
    await page.locator('[data-testid="register-submit"]').click();

    // 브라우저 기본 email 유효성 검사 또는 서버 검증 메시지
    const isStillOnRegister = page.url().includes('/register');
    const hasError = await page.locator('[role="alert"]').count() > 0;
    expect(isStillOnRegister || hasError).toBeTruthy();
  });

  test('TC-AUTH-04 | 비밀번호 6자 미만', async ({ page }) => {
    await page.goto('/auth/register');
    await page.locator('[data-testid="username-input"]').fill(`user${UNIQUE()}`);
    await page.locator('[data-testid="email-input"]').fill(`pw${UNIQUE()}@example.com`);
    await page.locator('[data-testid="password-input"]').fill('abc');
    await page.locator('[data-testid="password2-input"]').fill('abc');
    await page.locator('[data-testid="register-submit"]').click();

    await expect(page).toHaveURL('/auth/register');
    expect(await getFlashText(page)).toContain('6자 이상');
  });

  test('TC-AUTH-05 | 비밀번호 불일치', async ({ page }) => {
    await page.goto('/auth/register');
    await page.locator('[data-testid="username-input"]').fill(`user${UNIQUE()}`);
    await page.locator('[data-testid="email-input"]').fill(`mm${UNIQUE()}@example.com`);
    await page.locator('[data-testid="password-input"]').fill('password123');
    await page.locator('[data-testid="password2-input"]').fill('different456');
    await page.locator('[data-testid="register-submit"]').click();

    await expect(page).toHaveURL('/auth/register');
    expect(await getFlashText(page)).toContain('비밀번호가 일치하지 않습니다');
  });

  test('TC-AUTH-06 | 중복 이메일', async ({ page }) => {
    await page.goto('/auth/register');
    await page.locator('[data-testid="username-input"]').fill(`newuser${UNIQUE()}`);
    await page.locator('[data-testid="email-input"]').fill(TEST_USER.email); // 이미 존재
    await page.locator('[data-testid="password-input"]').fill('password123');
    await page.locator('[data-testid="password2-input"]').fill('password123');
    await page.locator('[data-testid="register-submit"]').click();

    await expect(page).toHaveURL('/auth/register');
    expect(await getFlashText(page)).toContain('이미 사용 중인 이메일');
  });

  test('TC-AUTH-07 | 중복 아이디', async ({ page }) => {
    await page.goto('/auth/register');
    await page.locator('[data-testid="username-input"]').fill(TEST_USER.username); // 이미 존재
    await page.locator('[data-testid="email-input"]').fill(`newmail${UNIQUE()}@example.com`);
    await page.locator('[data-testid="password-input"]').fill('password123');
    await page.locator('[data-testid="password2-input"]').fill('password123');
    await page.locator('[data-testid="register-submit"]').click();

    await expect(page).toHaveURL('/auth/register');
    expect(await getFlashText(page)).toContain('이미 사용 중인 아이디');
  });

  test('TC-AUTH-08 | 로그인 상태에서 /register 접속 → 메인 리다이렉트', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/auth/register');
    await expect(page).toHaveURL('/');
  });
});

// ── 로그인 ─────────────────────────────────────────────────

test.describe('로그인', () => {

  test('TC-AUTH-09 | 정상 로그인', async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('[data-testid="email-input"]').fill(TEST_USER.email);
    await page.locator('[data-testid="password-input"]').fill(TEST_USER.password);
    await page.locator('[data-testid="login-submit"]').click();

    await expect(page).toHaveURL('/');
    expect(await getFlashText(page)).toContain('환영합니다');
  });

  test('TC-AUTH-10 | 잘못된 비밀번호', async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('[data-testid="email-input"]').fill(TEST_USER.email);
    await page.locator('[data-testid="password-input"]').fill('wrongpassword!');
    await page.locator('[data-testid="login-submit"]').click();

    await expect(page).toHaveURL('/auth/login');
    expect(await getFlashText(page)).toContain('이메일 또는 비밀번호가 올바르지 않습니다');
  });

  test('TC-AUTH-11 | 존재하지 않는 이메일', async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('[data-testid="email-input"]').fill('noexist@example.com');
    await page.locator('[data-testid="password-input"]').fill('anypassword');
    await page.locator('[data-testid="login-submit"]').click();

    await expect(page).toHaveURL('/auth/login');
    expect(await getFlashText(page)).toContain('이메일 또는 비밀번호가 올바르지 않습니다');
  });

  test('TC-AUTH-12 | 로그아웃', async ({ page }) => {
    await loginAsUser(page);
    await page.locator('[data-testid="logout-btn"]').click();

    await expect(page).toHaveURL('/');
    expect(await getFlashText(page)).toContain('로그아웃');

    // 로그아웃 후 장바구니 접근 → 로그인 페이지로
    await page.goto('/cart');
    await expect(page).toHaveURL(/\/login/);
  });
});
