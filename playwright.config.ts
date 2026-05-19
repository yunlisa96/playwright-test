import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// .env 파일 자동 로드 (Playwright는 .env를 자동으로 읽지 않음)
dotenv.config();

/**
 * BASE_URL 설정 방법:
 *   1) .env 파일에 BASE_URL=http://localhost:5001 작성 (권장)
 *   2) 명령어에 직접: BASE_URL=http://localhost:5001 npx playwright test
 */
export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 1,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['./reporters/detailed-report.ts', { outputFile: 'detailed-report.html' }],
  ],

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:5000',
    headless: true,
    screenshot: 'on',
    video: 'on',
    trace: 'retain-on-failure',
    locale: 'ko-KR',
  },

  // 스크린샷 비교 허용 오차 (0~1, 픽셀 단위 변화 허용)
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,   // 전체 픽셀의 2% 이내 차이는 통과
      threshold: 0.2,             // 개별 픽셀 색상 차이 허용치
      animations: 'disabled',     // 애니메이션 끄고 찍기
    },
  },

  projects: [
    // ── E2E (기능 테스트) ─────────────────────────────────
    {
      name: 'e2e',
      testMatch: ['**/auth.spec.ts', '**/shop.spec.ts', '**/cart.spec.ts', '**/admin.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
    },

    // ── 시각적 회귀 ───────────────────────────────────────
    {
      name: 'visual',
      testMatch: '**/visual.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
      expect: {
        toHaveScreenshot: {
          maxDiffPixelRatio: 0.10,
          threshold: 0.25,
          animations: 'disabled',
        },
      },
    },

    // ── 반응형 : 모바일 ───────────────────────────────────
    // Pixel 5 (Chromium) — WebKit 설치 없이 실행 가능
    {
      name: 'responsive-mobile',
      testMatch: '**/responsive.spec.ts',
      use: { ...devices['Pixel 5'] },
      expect: {
        toHaveScreenshot: {
          maxDiffPixelRatio: 0.08,
          threshold: 0.25,
          animations: 'disabled',
        },
      },
    },

    // ── 반응형 : 태블릿 ───────────────────────────────────
    // Galaxy Tab S4 (Chromium) — WebKit 설치 없이 실행 가능
    {
      name: 'responsive-tablet',
      testMatch: '**/responsive.spec.ts',
      use: { ...devices['Galaxy Tab S4'] },
      expect: {
        toHaveScreenshot: {
          maxDiffPixelRatio: 0.08,
          threshold: 0.25,
          animations: 'disabled',
        },
      },
    },

    // ── 반응형 : 데스크톱 ─────────────────────────────────
    {
      name: 'responsive-desktop',
      testMatch: '**/responsive.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
      expect: {
        toHaveScreenshot: {
          maxDiffPixelRatio: 0.08,
          threshold: 0.25,
          animations: 'disabled',
        },
      },
    },
  ],
});
