🗺️ Project YOGI - AI Orchestration Master & Checklist

## 0. AI 개발 모드 전환 및 컨텍스트 규칙
- AI 에이전트는 작업을 시작하거나 이어받을 때 반드시 본 파일과 도메인별 가이드(`@backend_instructions.md`, `@frontend_instructions.md`)를 컨텍스트로 먼저 로드할 것.
- 모든 기능 구현은 선언식 파이프라인(`@harness.yaml`)의 아키텍처 규칙과 비회원제 다형성(`input_id`) 흐름을 절대 위반 금지.
- 작업 진입 전 어떤 작업을 할지 브리핑, 작업 승인 시 전체 작업 마스터 체크리스트 업데이트 후 진행할 것.
- 작업 완료시 체크리스트 업데이트 후 다음 작업 진행
- 작업 종료 명령 수령 시 "전체 작업 마스터 체크리스트" 와 "현재 작업 세션 로그 및 중단 점" 업데이트 할 것
- "현재 작업 세션 로그 및 중단 점"은 세션 시작 후, 종료 전 내용만 기록

## 1. 🚀 전체 작업 마스터 체크리스트 (Progress Tracker)
> 💡 [주의] 작업을 중단하기 직전, AI는 반드시 현재까지 완료된 항목을 `[x]`로 표시하고, 진행 중인 항목이나 다음 할 일을 업데이트해야 합니다.

### [Phase 1] 환경 구축 및 데이터 아키텍처
- [x] 프론트엔드 폴더(`frontend`) 생성 및 Next.js 기본 템플릿 설치
- [x] 백엔드 폴더(`backend`) 생성 및 NestJS 기본 템일릿 설치
- [x] 백엔드 Core 의존성 라이브러리(Swagger, Prisma Client, Config 등) 설치
- [x] 백엔드 Dev 의존성 라이브러리(Prisma CLI, Vitest, SWC 등) 설치 및 설정
- [x] PostgreSQL 데이터베이스 연동 및 Prisma 스키마(TIMESTAMPTZ, UUID `input_id` 기반 다형성 관계) 작성
- [x] `harness.yaml`에 정의된 데이터 적재 스크립트(`npm run telemetry:*`) 연동 준비

### [Phase 2] 오케스트레이션 및 파이프라인 구성
- [x] 백엔드 `ScheduleModule` 패키지 설치 및 텔레메트리 크론 작업(`0 4 * * *`) 등록
- [x] AI 추천 평가를 위한 `antigravity/prompts/` 내 프롬프트 관리 체계 및 기본 마크다운 프롬프트 설계
- [x] AI 추천 평가 루프(`run_eval_loop.ps1`) 검증을 위한 Vitest 평가용 스텁/모의 테스트 시나리오 작성

### [Phase 3] 백엔드 코어 도메인 개발
- [x] 비회원 다형성 세션 저장을 위한 `InputSession`, `UserPlan`, `UserDemand` 트랜잭션 API (`POST /api/sessions`) 구현 및 DTO 매핑
- [x] 세션 검증을 위한 요청 헤더(`X-Session-ID`) 미들웨어/인터셉터 설계
- [x] `input_id` 기반 AI 추천 조회 API (`GET /api/sessions/:id/recommendations`) 설계 및 프롬프트 주입 연동

### [Phase 4] 프론트엔드 UI/UX 구현
- [x] `frontend` 디렉터리 기반으로 사용자 통신비 진단 및 요금제 추천 화면 뷰(View) 뼈대(Scaffold) 구성
- [x] 백엔드 서버(API)와의 연동 로직 설계 및 CORS 설정 확인
- [x] 프론트엔드와 백엔드 연동 테스트 (API 에러 핸들링 및 로딩/스켈레톤 UI 동작 확인)
- [x] shadcn/ui 기반 컴포넌트 세부 스타일링 및 디자인 고도화

### [Phase 5] 기획에 따라 수정
- [x] `plan` 디렉터리 내부 파일 확인 후 현재 코드에 잘못 반영되거나 반영되지 않은 부분 확인
- [x] 수정해야 할 요소의 성격에 따라 `backend_instruction.md`, `frontend-instruction.md`에 체크리스트로 적용
- [x] 백엔드부터 체크리스트에 따라 수정
--

## 2. 🚦 현재 작업 세션 로그 및 중단 점 (Handover Note)
- **일시**: 2026-06-26T00:51:46+09:00
- **완료된 작업**:
  - **[Phase 5]** 기획서(`API_명세서.pdf`, `요구사항_명세서.pdf`) 기준 백엔드/프론트엔드 구조 리팩토링 완료
  - 백엔드 모듈 분리 및 API 라우트(`/api/v1/recommandations` 등) 스펙 일치화 완료
  - 프론트엔드 단일 페이지 UX 통합(`/result` 라우트 제거 후 조건부 렌더링 방식 변경) 및 `RecommendationList` 구현
  - "다른 요금제 더 보기" 동적 확장 UI 구현 및 백엔드 임시 Mock Data를 5개로 늘려 UI 렌더링 검증 완료
  - 루트 폴더 `package.json`에 일괄 빌드를 위한 `build`, `build:backend`, `build:frontend` 스크립트 추가
- **중단점 및 다음 작업 (Next Steps)**:
  - 프론트/백엔드 기본 연동 및 UI 동작까지는 확인되었으므로, 이후 **실제 데이터베이스 로직 고도화** 및 **외부 API(스마트초이스 등) 또는 실제 AI 추천 프롬프트 연동** 진행 필요.
  - 본 문서 하단의 **[QA/Test 검증 프로토콜]** 에 따른 Vitest/Supertest 테스트 코드 작성 진입 예정.

## 🧪 3. 깐깐한 QA 에이전트(QA/Test) 검증 프로토콜
> AI는 구현 코드를 작성한 후, 스스로를 '시니어 QA 엔지니어' 모드로 전환하여 아래의 테스트 지침을 100% 통과시켜야 합니다.

### 1. Vitest 단위/로직 테스트 규칙
- **Edge Case 우선 검증**: 정상적인 데이터 입력 외에, 외부 API에서 값이 누락되거나(`null`), 이상 문자열이 들어오거나, 데이터 규격이 깨진 상황을 Mocking하여 테스트 케이스를 3개 이상 작성할 것.
- **회복 탄력성(Retry) 검증**: 스마트초이스 API 호출 실패 시, `harness.yaml`에 정의된 지수 백오프(Retry & Backoff) 로직이 실제로 작동하여 재시도하는지 가상(Mock) 타이머를 활용해 반드시 검증할 것.

### 2. Supertest API 시나리오 테스트 규칙
- **단방향 Flow & 다형성 검증**: 사용자가 조건을 입력하여 `input_id`가 발급되는 시점부터, 해당 `input_id`로 결과를 페칭하는 전체 REST API 시나리오 테스트를 작성할 것.
- **세션 격리 검증**: 다른 `X-Session-ID`를 가진 익명 사용자가 서로의 `input_id` 데이터에 접근할 수 없는지(보안 및 컨텍스트 격리) 시나리오 테스트에 포함할 것.

### 3. 품질 통과 기준 (Definition of Done)
- AI는 코드를 다 짰다고 선언하기 전에, 터미널에서 Vitest/Supertest 명령어(`npm run test` 등)를 스스로 실행하고 **모든 테스트가 `PASS`된 로그를 유저에게 증거로 제출**해야 함.