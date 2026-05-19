# playwright-test

Playwright 기반 쇼핑몰 E2E / 시각적 회귀 / 반응형 테스트 프로젝트

## 요구 사항

- Node.js 18+
- 테스트 대상 쇼핑몰 서버 실행 중

## 설치

```bash
npm install
npx playwright install
```

## 환경 설정

`.env.example`을 복사해 `.env`를 만듭니다.

```bash
cp .env.example .env
```

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `BASE_URL` | 테스트 대상 서버 URL | `http://localhost:5000` |
| `TEST_EMAIL` / `TEST_PASSWORD` | 일반 유저 계정 | seed 계정과 일치 |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | 관리자 계정 | seed 계정과 일치 |
| `SCREENSHOT_PRODUCT_ID` | 스크린샷용 고정 상품 ID | `1` |

## 테스트 실행

```bash
# 전체 테스트
npm test

# E2E만 (인증 / 쇼핑 / 장바구니 / 관리자)
npm run test:e2e

# 개별 영역
npm run test:auth
npm run test:shop
npm run test:cart
npm run test:admin

# 시각적 회귀
npm run test:visual

# 반응형 (mobile / tablet / desktop)
npm run test:responsive
```

## 리포트 확인

테스트 실행 후 자동 생성됩니다.

```bash
# Playwright HTML 리포트 (trace, 스크린샷)
npm run report

# 한국어 상세 리포트 (목적, 절차, 결과 설명, 캡처/영상)
npm run report:detail
```

상세 리포트(`detailed-report.html`)에는 다음이 포함됩니다.

- 테스트 목적 / 수행 절차 / 기대 결과
- 실제 실행 단계 (`test.step()`)
- 결과 설명 (한국어)
- 스크린샷 · 영상 · trace (실패 시)

## 프로젝트 구조

```
├── tests/                  # 테스트 spec
│   ├── auth.spec.ts        # TC-AUTH-01 ~ 12
│   ├── shop.spec.ts        # TC-SHOP-01 ~ 07
│   ├── cart.spec.ts        # TC-CART-01 ~ 10
│   ├── admin.spec.ts       # TC-ADMIN-01 ~ 09
│   ├── visual.spec.ts      # 시각적 회귀
│   ├── responsive.spec.ts  # 반응형
│   ├── screenshot-helpers.ts  # 스크린샷·마스킹 공통
│   └── helpers.ts          # 공통 헬퍼
├── reporters/
│   ├── detailed-report.ts  # 한국어 상세 리포트
│   └── test-catalog.ts     # 테스트 메타데이터
├── playwright.config.ts
└── .env.example
```

## 테스트 프로젝트

| 프로젝트 | 내용 |
|---------|------|
| `e2e` | 기능 테스트 (Desktop Chrome) |
| `visual` | 시각적 회귀 (1280×800) |
| `responsive-mobile` | iPhone 13 |
| `responsive-tablet` | iPad |
| `responsive-desktop` | 1440×900 |

## 기준 스크린샷 갱신

캡처 방식 변경·DB 데이터 변경 후에는 baseline을 다시 잡아야 합니다.

```bash
# 서버 실행 + DB 상태 안정화 후
npm run test:visual:update
npm run test:responsive:update
git add tests/**/*-snapshots/
```

- **visual**: 허용 픽셀 차이 10% (`maxDiffPixelRatio: 0.10`)
- **responsive**: 허용 픽셀 차이 8%, 뷰포트/요소 단위 캡처
- 상품 상세·장바구니는 `fullPage` 대신 `[data-testid="product-detail"]` / `main` 요소만 비교
- 관리자 목록은 **뷰포트 + 테이블 전체 마스킹** (행 수 변동 무시)
- 상품 상세는 `SCREENSHOT_PRODUCT_ID` 상품 + 이름·가격·이미지 마스킹
