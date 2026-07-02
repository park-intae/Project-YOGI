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

## 6. TypeScript Type Error: Cannot find name 'vi'
- **문제 발생**: 프론트엔드 타입 체크 시 `vitest.setup.ts` 파일에서 `Cannot find name 'vi'` 타입 에러 발생으로 인한 빌드 실패.
- **원인**: `vi` 객체가 전역(Global) 네임스페이스에 선언되어 있지 않아 TypeScript 컴파일러가 인식하지 못함.
- **해결 방안**: `vitest.setup.ts` 파일 최상단에 `import { vi } from 'vitest';` 모듈 임포트 구문을 명시적으로 추가하여 타입 에러 해결.

## 7. Mock 반환 타입 불일치로 인한 TypeScript 에러 (TS2345)
- **문제 발생**: 프론트엔드 타입 체크(`tsc --noEmit`) 시 `DiagnosticForm.spec.tsx`에서 `Argument of type '{ id: string; }' is not assignable to parameter of type 'SessionResponseDto'.` 에러 발생.
- **원인**: 백엔드 API 스펙이 변경되어 `SessionResponseDto`의 필수 속성이 `sessionId`, `inputId` 등으로 바뀌었으나, 테스트 코드의 Mock 반환값은 과거 스펙(`id`)을 유지하고 있어 타입 불일치가 발생함.
- **해결 방안**: `DiagnosticForm.spec.tsx`에서 `vi.mocked(yogiApi.createSession).mockResolvedValueOnce`의 반환 객체를 `{ sessionId: 'test-session-id', inputId: 'test-input-id' }` 형식으로 수정하여 타입 에러 해결.

## 8. Vitest 환경에서의 DOM 오염(State Leak) 및 ResizeObserver 에러
- **문제 발생**: 프론트엔드 테스트 코드(`DiagnosticForm.spec.tsx`, `OptionCard.spec.tsx` 등) 실행 시 `TestingLibraryElementError: Found multiple elements` 에러 및 `ReferenceError: ResizeObserver is not defined` 에러 발생.
- **원인**: 
  - `JSDOM` 환경에서 각 테스트 실행 후 렌더링된 DOM 요소가 자동으로 정리(Cleanup)되지 않아 이전 테스트의 컴포넌트가 누적됨.
  - `JSDOM`에 `ResizeObserver` API가 내장되어 있지 않아, 이를 사용하는 컴포넌트가 렌더링될 때 런타임 에러를 뿜음.
- **해결 방안**: 
  - 각 테스트 파일 및 `vitest.setup.ts`에 `@testing-library/react`의 `cleanup` 함수를 가져와 `afterEach(cleanup)`을 적용하여 테스트 간 DOM 격리를 보장함.
  - `globalThis.ResizeObserver`에 빈 더미(Mock) 클래스를 할당하여 `ResizeObserver` 참조 에러를 우회함.

## 9. 테스트 커버리지 대폭 상향 (Test Coverage Increase)
- **문제 발생**: 사용자로부터 테스트 커버리지를 상향하라는 요청을 받음 (초기 커버리지 59.4%).
- **해결 방안**:
  - 백엔드: `fs` 모듈 Mocking 이슈를 파일 최상단 `vi.mock('fs')`로 해결하고, `RecommendationsService`와 `TelemetryService`에 외부 API 호출 에러, 예외 처리, Fallback 응답 로직에 대한 테스트 케이스 추가.
  - 프론트엔드: `DiagnosticForm.spec.tsx`에서 API 에러 발생 시의 동작 및 숨겨진(unlimited) 체크박스 해제 동작을 테스트.
  - 결과적으로 프로젝트 전체 테스트 커버리지를 74.75%까지 향상시키고 모든 에러를 해결함.