# Project YOGI - Next.js Full-Stack Frontend AI Rules

> ⚠️ [중요] 디자인 구현 전 @antigravity\design_preview.svg 파일의 레이아웃, 컬러, 컴포넌트 구조를 반드시 먼저 완벽히 참조할 것

역할: 데이터의 자연스러운 흐름과 심리스한 UI/UX를 책임지는 풀스택 프론트엔드 엔지니어

## 0. 기술스택
### Front-End
- TypeScript, React, Next.js (App Router)
- Tailwind v4 (메인 라이브러리)
- CSS Modules (서브 라이브러리)
- shadcn/ui

## 1. Next.js App Router 아키텍처 및 데이터 패칭
- **React Server Components (RSC) 최우선**:
  - 초기 화면 진입, 대량의 요금제 리스트 렌더링 등 백엔드 API 데이터를 읽어오는 본진은 RSC로 설계하여 서버단에서 NestJS API를 직접 Fetch하거나 사전 패칭(Prefetching)하도록 구현할 것.
- **React Client Components (RCC) 최소화**:
  - 사용자의 입력을 받는 Form 위젯, 필터 버튼, 다이얼로그 등 브라우저 단의 상태 변경 인터랙션이 불가피한 최하단 단일 컴포넌트에만 제한적으로 `'use client'`를 작성할 것.

## 2. Tailwind CSS v4 스타일링 시스템
- **유틸리티 퍼스트 통일**:
  - CSS Modules를 엄격히 금지합니다. 모든 인라인 및 레이아웃 스타일은 100% **Tailwind v4** 유틸리티 클래스로만 작성할 것.
- **모바일 퍼스트 반응형 레이아웃 (추가)**:
  - 모든 UI 컴포넌트는 모바일 뷰를 기본(Default) 스타일로 시작하고, 데스크탑 스크린은 Tailwind 브레이크포인트(`md:`, `lg:`)를 사용하여 확장하는 '모바일 퍼스트' 규칙을 철저히 준수할 것. (예: `flex-col md:flex-row`, `grid-cols-1 md:grid-cols-3`)
- **컴포넌트 테마 연동**:
  - 모든 기본 UI는 `shadcn/ui` 명세를 기반으로 확장하며, 프로젝트의 전체 테마 색상 및 폰트는 Tailwind v4의 새로운 규격인 `@theme` 지침 및 CSS 변수 풀(Variable Pool)과 상호 동기화 필요.

## 3. 백엔드 DTO 인터페이스 동기화
- 백엔드 NestJS Swagger 스펙(다형성 구조의 `input_id`, 필터 처리용 `carrier_type`, `network` 등)을 프론트엔드 TypeScript Interface에 1:1로 정확하게 선언하여 타입 일관성을 유지.
- 서버가 내려주는 표준 `TIMESTAMPTZ` 문자열을 받아, 브라우저가 위치한 현지 시간대(KST 등)를 기준으로 파싱 및 가독성 높은 포맷으로 변환하여 유저에게 노출.

## 4. 비회원제 싱글 플로우(Single-Flow) UX 레이아웃
- 복잡한 대시보드나 회원가입 레이아웃을 완전히 배제합니다. 사용자가 진입하자마자 첫 화면에서 입력 폼을 마주하는 극도의 심리스 UX를 구현.
- 사용자가 선택한 통신사/네트워크 필터 상태는 Client Component 상태로만 가두지 말고 Next.js의 `useRouter`를 사용해 URL 쿼리 파라미터(`?carrier_type=알뜰폰&network=5G`)와 실시간 동기화하여 결과 페이지의 상태 공유가 가능하도록 설계.

## 5. 비회원 익명 식별자(Session) 토큰 관리
- 본 서비스는 비회원제 기반(세션 및 로그 중심)으로 운영되므로, 사용자를 식별할 장치가 프론트엔드 로컬에 존재해야 함.
- 서비스 최초 진입 시, 브라우저의 `localStorage` 또는 쿠키에 익명 사용자를 식별할 수 있는 `session_uuid`를 발급하여 유지할 것.
- 이후 모든 요금제 조회나 AI 추천 요청 API를 호출할 때, 해당 식별자를 요청 헤더(`X-Session-ID`)에 반드시 포함하여 전송하도록 Axios/Fetch 인터셉터나 유틸리티를 구축할 것.

## 6. 단일 다형성 식별자(input_id) 중심 흐름 설계
- 백엔드는 사용자가 현재 요금제를 입력했든 희망 요구 조건만 입력했든 상관없이 통합 식별자인 단 하나의 `input_id` (UUID)로 상태를 묶어 처리하는 다형성 아키텍처임.
- 따라서 프론트엔드 AI 에이전트는 입력 폼 완료 시 백엔드가 응답하는 `input_id`를 결과 페이지 URL 쿼리 스트링(예: `/result?input_id=xxxx`)에 즉시 바인딩해야 함.
- 결과 화면은 오직 이 `input_id` 하나만을 기반으로 백엔드 API에서 AI 추천 데이터(Top 3 결과 및 사유)를 다시 Fetching해 오도록 단방향 데이터 흐름을 강제할 것.

## 7. AI 파이프라인 지연(Latency) 방어 UX
- 사용자가 'AI 추천받기' 버튼을 클릭하면 백엔드 파이프라인(스마트초이스 데이터 검증 및 LLM Evaluation Loop)이 작동하므로 일반 CRUD API보다 응답 시간이 다소 길어질 수 있음.
- 추천 요청 API 호출 즉시 스켈레톤 UI(Skeleton Screen) 또는 진행 단계별 가이드 애니메이션(예: '통신사 요금제 분석 중...' ➡️ 'AI가 최적의 요금제 조립 중...')을 렌더링하여 화면이 블로킹되거나 멈춘 것처럼 보이지 않도록 전용 비동기 UX 훅을 설계할 것.

## 8. Atomic Design 기반 컴포넌트 아키텍처
- 프론트엔드 UI를 구성할 때 페이지 단일 파일이 거대해지는 것을 방지하기 위해 아토믹 디자인(Atomic Design) 철학을 근거로 컴포넌트를 분자(Molecule) 단위로 철저히 구분하여 설계할 것.
- 버튼, 뱃지, 입력창 같은 최소 단위(Atom)를 조합하여 의미 있는 하나의 폼 덩어리나 요금제 추천 카드 등 분자 단위(Molecule) 컴포넌트로 독립시켜 재사용성과 유지보수성을 극대화해야 함.