export interface TestMeta {
  id?: string;
  purpose: string;
  steps: string[];
  expected: string;
  category: string;
}

const TC_CATALOG: Record<string, TestMeta> = {
  'TC-AUTH-01': {
    id: 'TC-AUTH-01',
    category: '인증',
    purpose: '유효한 정보로 회원가입 시 성공 처리 확인',
    steps: ['회원가입 페이지 접속', '아이디/이메일/비밀번호 입력', '가입하기 클릭', '결과 확인'],
    expected: '로그인 페이지로 이동, "회원가입이 완료" 메시지 표시',
  },
  'TC-AUTH-02': {
    id: 'TC-AUTH-02',
    category: '인증',
    purpose: '아이디 2자 미만 입력 시 유효성 검증',
    steps: ['회원가입 페이지 접속', '1자 아이디 입력 후 가입 시도'],
    expected: '회원가입 페이지 유지, "2자 이상" 오류 메시지',
  },
  'TC-AUTH-03': {
    id: 'TC-AUTH-03',
    category: '인증',
    purpose: '잘못된 이메일 형식 입력 시 검증',
    steps: ['회원가입 페이지 접속', '잘못된 이메일 형식 입력 후 가입 시도'],
    expected: '회원가입 페이지 유지 또는 오류 메시지 표시',
  },
  'TC-AUTH-04': {
    id: 'TC-AUTH-04',
    category: '인증',
    purpose: '비밀번호 6자 미만 입력 시 유효성 검증',
    steps: ['회원가입 페이지 접속', '3자 비밀번호 입력 후 가입 시도'],
    expected: '회원가입 페이지 유지, "6자 이상" 오류 메시지',
  },
  'TC-AUTH-05': {
    id: 'TC-AUTH-05',
    category: '인증',
    purpose: '비밀번호 확인 불일치 시 검증',
    steps: ['회원가입 페이지 접속', '서로 다른 비밀번호 입력 후 가입 시도'],
    expected: '"비밀번호가 일치하지 않습니다" 오류 메시지',
  },
  'TC-AUTH-06': {
    id: 'TC-AUTH-06',
    category: '인증',
    purpose: '이미 등록된 이메일로 가입 시도 시 차단',
    steps: ['회원가입 페이지 접속', '기존 이메일로 가입 시도'],
    expected: '"이미 사용 중인 이메일" 오류 메시지',
  },
  'TC-AUTH-07': {
    id: 'TC-AUTH-07',
    category: '인증',
    purpose: '이미 등록된 아이디로 가입 시도 시 차단',
    steps: ['회원가입 페이지 접속', '기존 아이디로 가입 시도'],
    expected: '"이미 사용 중인 아이디" 오류 메시지',
  },
  'TC-AUTH-08': {
    id: 'TC-AUTH-08',
    category: '인증',
    purpose: '로그인 상태에서 회원가입 페이지 접근 차단',
    steps: ['일반 사용자 로그인', '/auth/register 접속'],
    expected: '메인 페이지(/)로 리다이렉트',
  },
  'TC-AUTH-09': {
    id: 'TC-AUTH-09',
    category: '인증',
    purpose: '올바른 계정으로 로그인 성공 확인',
    steps: ['로그인 페이지 접속', '이메일/비밀번호 입력', '로그인 클릭'],
    expected: '메인 페이지 이동, "환영합니다" 메시지',
  },
  'TC-AUTH-10': {
    id: 'TC-AUTH-10',
    category: '인증',
    purpose: '잘못된 비밀번호로 로그인 시도 시 차단',
    steps: ['로그인 페이지 접속', '올바른 이메일 + 잘못된 비밀번호 입력'],
    expected: '로그인 페이지 유지, 인증 실패 메시지',
  },
  'TC-AUTH-11': {
    id: 'TC-AUTH-11',
    category: '인증',
    purpose: '존재하지 않는 이메일로 로그인 시도 시 차단',
    steps: ['로그인 페이지 접속', '미등록 이메일로 로그인 시도'],
    expected: '로그인 페이지 유지, 인증 실패 메시지',
  },
  'TC-AUTH-12': {
    id: 'TC-AUTH-12',
    category: '인증',
    purpose: '로그아웃 후 세션 종료 확인',
    steps: ['로그인', '로그아웃 클릭', '장바구니 접근 시도'],
    expected: '로그아웃 메시지 표시, 이후 보호 페이지 접근 시 로그인 리다이렉트',
  },
  'TC-SHOP-01': {
    id: 'TC-SHOP-01',
    category: '쇼핑',
    purpose: '메인 페이지 핵심 UI 요소 로드 확인',
    steps: ['메인 페이지(/) 접속', '히어로 배너, 둘러보기 버튼, 추천 상품 영역 확인'],
    expected: 'hero-banner, browse-btn, featured-products 요소 표시',
  },
  'TC-SHOP-02': {
    id: 'TC-SHOP-02',
    category: '쇼핑',
    purpose: '상품 목록 페이지 UI 로드 확인',
    steps: ['/products 접속', '검색창, 카테고리 필터, 상품 그리드 확인'],
    expected: '검색/필터 UI 표시, 상품 그리드 또는 "결과 없음" 표시',
  },
  'TC-SHOP-03': {
    id: 'TC-SHOP-03',
    category: '쇼핑',
    purpose: '상품명 검색 기능 동작 확인',
    steps: ['/products 접속', '검색어 "상품" 입력', '검색 버튼 클릭'],
    expected: 'URL에 검색어 반영, 검색 결과 또는 "결과 없음" 표시',
  },
  'TC-SHOP-04': {
    id: 'TC-SHOP-04',
    category: '쇼핑',
    purpose: '카테고리 필터 동작 확인',
    steps: ['/products 접속', '첫 번째 카테고리 필터 클릭'],
    expected: 'URL에 category 파라미터 반영, 선택 카테고리 active 상태',
  },
  'TC-SHOP-05': {
    id: 'TC-SHOP-05',
    category: '쇼핑',
    purpose: '페이지네이션 동작 확인',
    steps: ['/products 접속', '2페이지 링크 클릭'],
    expected: 'URL에 page=2 반영 (상품 7개 이상일 때)',
  },
  'TC-SHOP-06': {
    id: 'TC-SHOP-06',
    category: '쇼핑',
    purpose: '상품 상세 페이지 조회 확인',
    steps: ['상품 목록 접속', '첫 번째 상품 상세보기 클릭'],
    expected: '/products/{id} URL, 상품명/가격/상세 정보 표시',
  },
  'TC-SHOP-07': {
    id: 'TC-SHOP-07',
    category: '쇼핑',
    purpose: '존재하지 않는 상품 접근 시 404 응답 확인',
    steps: ['/products/99999999 접속'],
    expected: 'HTTP 404 상태 코드 반환',
  },
  'TC-CART-01': {
    id: 'TC-CART-01',
    category: '장바구니',
    purpose: '비로그인 상태 장바구니 접근 차단',
    steps: ['로그인 없이 /cart 접속'],
    expected: '로그인 페이지로 리다이렉트',
  },
  'TC-CART-02': {
    id: 'TC-CART-02',
    category: '장바구니',
    purpose: '상품 장바구니 담기 기능 확인',
    steps: ['로그인', '첫 번째 상품 상세 → 장바구니 담기', '장바구니 페이지 확인'],
    expected: '"장바구니에 추가" 메시지, cart-items 영역 표시',
  },
  'TC-CART-03': {
    id: 'TC-CART-03',
    category: '장바구니',
    purpose: '동일 상품 재담기 시 수량 합산 확인',
    steps: ['로그인', '같은 상품 2회 담기', '장바구니 수량 확인'],
    expected: '수량이 2 이상으로 합산',
  },
  'TC-CART-04': {
    id: 'TC-CART-04',
    category: '장바구니',
    purpose: '장바구니 페이지 UI 확인',
    steps: ['로그인', '상품 담기', '/cart 접속'],
    expected: 'cart-items, cart-total, checkout-btn 표시',
  },
  'TC-CART-05': {
    id: 'TC-CART-05',
    category: '장바구니',
    purpose: '장바구니 수량 변경 기능 확인',
    steps: ['로그인', '상품 담기', '수량 3으로 변경 후 업데이트'],
    expected: '변경된 수량(3) 반영',
  },
  'TC-CART-06': {
    id: 'TC-CART-06',
    category: '장바구니',
    purpose: '수량 0 입력 시 상품 삭제 확인',
    steps: ['로그인', '상품 담기', '수량 0 입력 후 업데이트'],
    expected: '해당 상품 삭제 또는 빈 장바구니 표시',
  },
  'TC-CART-07': {
    id: 'TC-CART-07',
    category: '장바구니',
    purpose: '장바구니 상품 삭제 기능 확인',
    steps: ['로그인', '상품 담기', '삭제 버튼 클릭'],
    expected: '"삭제" 관련 flash 메시지 표시',
  },
  'TC-CART-08': {
    id: 'TC-CART-08',
    category: '장바구니',
    purpose: '빈 장바구니에서 체크아웃 접근 차단',
    steps: ['로그인', '장바구니 비우기', '/cart/checkout 접속'],
    expected: '"비어있습니다" 메시지, /cart 유지',
  },
  'TC-CART-09': {
    id: 'TC-CART-09',
    category: '장바구니',
    purpose: '정상 주문 완료 플로우 확인',
    steps: ['로그인', '상품 담기', '체크아웃 → 배송지 입력 → 주문 완료'],
    expected: '주문 완료 페이지 이동, "주문이 완료" 메시지',
  },
  'TC-CART-10': {
    id: 'TC-CART-10',
    category: '장바구니',
    purpose: '배송지 미입력 시 결제 차단',
    steps: ['로그인', '상품 담기', '체크아웃에서 배송지 비우고 주문 시도'],
    expected: '"배송지를 입력해주세요" 메시지, 체크아웃 페이지 유지',
  },
  'TC-CART-11': {
    id: 'TC-CART-11',
    category: '장바구니',
    purpose: '타인 주문 페이지 직접 접근 차단',
    steps: ['로그인', '/cart/order/1 직접 접속'],
    expected: '메인/로그인 리다이렉트 또는 권한 오류 메시지',
  },
  'TC-ADMIN-01': {
    id: 'TC-ADMIN-01',
    category: '관리자',
    purpose: '일반 사용자의 관리자 페이지 접근 차단',
    steps: ['일반 사용자 로그인', '/admin 접속'],
    expected: '메인 페이지 리다이렉트, "관리자만 접근" 메시지',
  },
  'TC-ADMIN-02': {
    id: 'TC-ADMIN-02',
    category: '관리자',
    purpose: '관리자 대시보드 통계 및 최근 주문 표시 확인',
    steps: ['관리자 로그인', '/admin 접속'],
    expected: 'stat-products/users/orders, recent-orders-table 표시',
  },
  'TC-ADMIN-03': {
    id: 'TC-ADMIN-03',
    category: '관리자',
    purpose: '관리자 상품 목록 페이지 확인',
    steps: ['관리자 로그인', '/admin/products 접속'],
    expected: 'admin-product-table, add-product-btn 표시',
  },
  'TC-ADMIN-04': {
    id: 'TC-ADMIN-04',
    category: '관리자',
    purpose: '신규 상품 등록 기능 확인',
    steps: ['관리자 로그인', '상품 등록 폼 작성', '등록하기 클릭'],
    expected: '상품 목록 이동, "등록되었습니다" 메시지, 테이블에 상품명 표시',
  },
  'TC-ADMIN-05': {
    id: 'TC-ADMIN-05',
    category: '관리자',
    purpose: '필수 항목 미입력 시 상품 등록 차단',
    steps: ['관리자 로그인', '상품명/가격 비운 채 등록 시도'],
    expected: '등록 폼 유지 또는 오류 메시지',
  },
  'TC-ADMIN-06': {
    id: 'TC-ADMIN-06',
    category: '관리자',
    purpose: '상품 정보 수정 기능 확인',
    steps: ['관리자 로그인', '첫 상품 수정 → 이름 변경 → 저장'],
    expected: '"수정되었습니다" 메시지, 테이블에 변경된 이름 표시',
  },
  'TC-ADMIN-07': {
    id: 'TC-ADMIN-07',
    category: '관리자',
    purpose: '상품 활성/비활성 전환 확인',
    steps: ['관리자 로그인', '상품 수정 → is_active 토글 → 저장'],
    expected: '"수정되었습니다" 메시지',
  },
  'TC-ADMIN-08': {
    id: 'TC-ADMIN-08',
    category: '관리자',
    purpose: '상품 비활성화(삭제) 기능 확인',
    steps: ['관리자 로그인', '삭제 버튼 클릭 (confirm 수락)'],
    expected: '"비활성화되었습니다" 메시지',
  },
  'TC-ADMIN-09': {
    id: 'TC-ADMIN-09',
    category: '관리자',
    purpose: '관리자 주문 목록 조회 확인',
    steps: ['관리자 로그인', '/admin/orders 접속'],
    expected: '주문 테이블 또는 "주문 없음" 표시',
  },
};

function extractTcId(title: string): string | undefined {
  const match = title.match(/^(TC-[A-Z]+-\d+)/);
  return match?.[1];
}

function visualMeta(describe: string, title: string): TestMeta {
  return {
    category: '시각적 회귀',
    purpose: `${describe} > ${title} 화면의 시각적 회귀 검증`,
    steps: [
      '대상 페이지 접속',
      'networkidle 대기 (필요 시)',
      '동적 요소 마스킹 후 스크린샷 촬영',
      '기준 이미지(baseline)와 픽셀 비교',
    ],
    expected: '기준 스크린샷과 2% 이내 픽셀 차이 (maxDiffPixelRatio: 0.02)',
  };
}

function responsiveMeta(describe: string, title: string, project: string): TestMeta {
  const device = project.replace('responsive-', '');
  const deviceLabel = { mobile: '모바일', tablet: '태블릿', desktop: '데스크톱' }[device] ?? device;
  const isScreenshot = title.includes('스크린샷');

  return {
    category: '반응형',
    purpose: `[${deviceLabel}] ${describe} > ${title}`,
    steps: isScreenshot
      ? [`${deviceLabel} 뷰포트에서 페이지 접속`, '스크린샷 촬영', '기준 이미지와 비교']
      : [`${deviceLabel} 뷰포트에서 페이지 접속`, '레이아웃/요소 가시성 검증'],
    expected: isScreenshot
      ? `${deviceLabel} 기준 스크린샷과 일치`
      : `${deviceLabel} 화면에서 레이아웃 깨짐 없이 정상 표시`,
  };
}

export function getTestMeta(
  title: string,
  file: string,
  describePath: string[],
  project: string,
): TestMeta {
  const tcId = extractTcId(title);
  if (tcId && TC_CATALOG[tcId]) return TC_CATALOG[tcId];

  const describe = describePath.join(' > ') || file;
  if (file.includes('visual.spec')) return visualMeta(describe, title);
  if (file.includes('responsive.spec')) return responsiveMeta(describe, title, project);

  const label = title.includes('|') ? title.split('|')[1]?.trim() : title;
  return {
    category: '기타',
    purpose: label ?? title,
    steps: ['테스트 시나리오 실행', '기대 결과와 실제 결과 비교'],
    expected: '테스트 코드에 정의된 assertion 통과',
  };
}

export function explainError(message: string): string {
  if (!message) return '';

  if (message.includes('Test timeout') && message.includes('beforeEach')) {
    return '사전 준비(beforeEach) 단계에서 30초 타임아웃이 발생했습니다. '
      + '서버(BASE_URL)가 실행 중인지, 로그인 계정 정보(.env)가 올바른지 확인하세요.';
  }
  if (message.includes('waitForURL') && message.includes('exceeded')) {
    return '페이지 이동(리다이렉트)이 예상 시간 내에 완료되지 않았습니다. '
      + '로그인 실패, 서버 오류, 또는 잘못된 URL 설정을 의심할 수 있습니다.';
  }
  if (message.includes('toHaveScreenshot') || message.includes('screenshot')) {
    return '스크린샷이 기준 이미지(baseline)와 2% 이상 다릅니다. '
      + 'UI 변경이 의도된 것이라면 `npm run test:visual:update`로 기준 이미지를 갱신하세요.';
  }
  if (message.includes('toBeVisible') || message.includes('not visible')) {
    return '화면에서 기대한 UI 요소를 찾지 못했습니다. '
      + '페이지 로드 실패, 셀렉터 변경, 또는 권한 문제일 수 있습니다.';
  }
  if (message.includes('toHaveURL') || message.includes('waiting for navigation')) {
    return '현재 URL이 기대값과 일치하지 않습니다. '
      + '리다이렉트 로직, 인증 상태, 또는 접근 권한을 확인하세요.';
  }
  if (message.includes('toContain') || message.includes('Expected substring')) {
    return '화면에 표시된 메시지/텍스트가 기대값과 다릅니다. '
      + '서버 응답 메시지 변경 또는 flash 메시지 타이밍 문제일 수 있습니다.';
  }
  if (message.includes('ECONNREFUSED') || message.includes('net::ERR')) {
    return '서버에 연결할 수 없습니다. BASE_URL로 지정한 애플리케이션이 실행 중인지 확인하세요.';
  }

  return '테스트 assertion 또는 브라우저 동작 중 오류가 발생했습니다. '
    + '아래 원본 에러 메시지와 Playwright HTML 리포트의 trace를 참고하세요.';
}

export function explainResult(status: string, errorMessage?: string): string {
  switch (status) {
    case 'passed':
      return '모든 검증 단계를 통과했습니다. 기대 결과와 실제 동작이 일치합니다.';
    case 'failed':
      return errorMessage
        ? explainError(errorMessage)
        : '테스트가 실패했으나 상세 에러 메시지를 가져올 수 없습니다.';
    case 'skipped':
      return '테스트 조건 미충족(예: 페이지네이션 없음, 카테고리 없음)으로 건너뛰었습니다.';
    case 'timedOut':
      return '테스트가 30초 제한 시간을 초과했습니다. 네트워크 지연이나 무한 대기 상태를 확인하세요.';
    case 'interrupted':
      return '사용자 또는 CI에 의해 테스트 실행이 중단되었습니다.';
    default:
      return `상태: ${status}`;
  }
}
