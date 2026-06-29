# 🛠️ Trouble & Shooting Log

이 문서는 프로젝트 진행 중 발생한 주요 문제(Trouble)와 해결 과정(Shooting)을 기록하는 아카이브입니다.
추후 유사한 문제가 발생했을 때 신속하게 대응하기 위해 작성됩니다.

---

## 1. 아코디언 애니메이션과 Scroll-Driven 동기화 이슈
- **문제 발생**: 목업 데이터와 같이 로딩 지연이 아예 없는(0초) 경우, 아코디언이 처음부터 `isOpen=true` 상태로 마운트되어 크기 변화 애니메이션(0fr -> 1fr)이 발생하지 않음. 이로 인해 `ResizeObserver` 기반의 스크롤 추적 로직이 작동하지 않는 현상 발생.
- **해결 방안**: 
  - `AccordionReveal` 컴포넌트의 내부 상태 `isExpanding`을 항상 `false`로 초기화.
  - 마운트 직후 `useEffect` 내에서 `setTimeout`을 통해 약간의 지연(50ms) 후 `isExpanding`을 `true`로 전환하여, 브라우저가 강제로 0fr에서 1fr로 트랜지션 애니메이션을 그리도록 유도함.

## 2. JSDOM 환경에서의 Chart.js 렌더링 에러 (Unit Test)
- **문제 발생**: 프론트엔드 통합 테스트(`vitest`) 실행 중 `RecommendationList` 컴포넌트에서 `TypeError: Cannot read properties of null (reading 'ownerDocument')` 에러 발생.
- **원인**: 테스트 환경인 `JSDOM`은 실제 브라우저가 아니므로 Canvas API(`HTMLCanvasElement`)를 완벽히 지원하지 못함. 아코디언이 열리면서 내부의 Chart.js 컴포넌트가 마운트될 때 에러를 뿜음.
- **해결 방안**: 
  - `vitest.setup.ts`에 `react-chartjs-2` 모듈을 전역으로 Mocking 처리(`vi.mock`)하여, 테스트 시에는 더미(null) 컴포넌트를 렌더링하도록 수정함으로써 에러 회피 및 테스트 100% 통과 달성.

## 3. E2E 테스트 오타로 인한 404 에러 (Backend)
- **문제 발생**: 백엔드 E2E 테스트(`recommendations.e2e-spec.ts` 등) 실행 시 201 Created를 기대했으나 404 Not Found가 반환됨.
- **원인**: 과거 테스트 코드 작성 시 API 엔드포인트에 오타(`/api/v1/recommandations`)가 포함되어 있었음.
- **해결 방안**: 테스트 코드 내의 모든 `recommandations` 문자열을 올바른 철자인 `recommendations`로 일괄 치환하여 100% 테스트 통과(23/23) 달성.

## 4. 잘못된 UUID 파라미터로 인한 500 Internal Server Error
- **문제 발생**: 폼 제출 직후 프론트엔드 라우팅 시 백엔드 추천 API에서 500 내부 서버 오류 발생.
- **원인**: 폼 제출 응답 구조의 변경이나 타이밍 문제로 `input_id`가 할당되지 않은 채 라우팅이 되어, 주소창에 `?input_id=undefined`라는 문자열 리터럴이 들어감. 이를 받은 백엔드 Prisma 엔진이 `"undefined"`를 파싱하려다 UUID 형식이 아니라며 예외를 발생시킴.
- **해결 방안**: 
  - 백엔드: NestJS 컨트롤러 파라미터에 `ParseUUIDPipe({ version: '4' })`를 부착하여 잘못된 요청을 400 Bad Request로 안전하게 방어.
  - 프론트엔드: `RecommendationContentClient` 내부에서 `inputId === 'undefined'`일 때 API 호출을 차단하도록 조건문 강화.

## 5. Next.js 로컬 이미지 Cache-Busting 런타임 에러
- **문제 발생**: 텍스트 통신사 로고를 실제 이미지로 교체하는 과정에서 브라우저 캐시를 회피하기 위해 `<Image src="/brand_logo/KT.jpg?v=2" />` 처럼 쿼리 스트링을 붙였더니 런타임 에러 발생.
- **원인**: Next.js 14+의 `<Image>` 컴포넌트는 `next.config`의 `images.localPatterns`에 명시적으로 허용되지 않은 쿼리 파라미터가 포함된 로컬 에셋의 렌더링을 보안 및 최적화 이슈로 강력하게 차단함.
- **해결 방안**: 꼼수를 쓰는 대신 원본 파일 자체를 `.png`로 교체 저장하여 파일 확장자를 변경, 브라우저가 자연스럽게 새 파일로 인식하고 정상 캐싱하도록 조치함.
