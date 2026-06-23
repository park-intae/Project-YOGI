🗺️ Project YOGI - AI Orchestration Master & Checklist

## 0. AI 개발 모드 전환 및 컨텍스트 규칙
- AI 에이전트는 작업을 시작하거나 이어받을 때 반드시 본 파일과 도메인별 가이드(`@backend_instructions.md`, `@frontend_instructions.md`)를 컨텍스트로 먼저 로드할 것.
- 모든 기능 구현은 선언식 파이프라인(`@harness.yaml`)의 아키텍처 규칙과 비회원제 다형성(`input_id`) 흐름을 절대 위반 금지.
- 작업 진입 전 어떤 작업을 할지 브리핑 후 진행할 것.
- 작업 종료 명령 수령 시 "전체 작업 마스터 체크리스트" 와 "현재 작업 세션 로그 및 중단 점" 업데이트 할 것

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
- [ ] `input_id` 기반 AI 추천 조회 API (`GET /api/sessions/:id/recommendations`) 설계 및 프롬프트 주입 연동

### [Phase 4] 프론트엔드 UI/UX 구현

--

## 2. 🚦 현재 작업 세션 로그 및 중단 점 (Handover Note)
- **일시**: 2026-06-24T00:15:00+09:00
- **완료된 작업**:
  - `project yogi` 폴더 내에 백엔드(`backend`)와 프론트엔드(`frontend`) 독립 폴더 구성 완료
  - Next.js (App Router, TS, Tailwind) 및 NestJS (Strict 모드 TS) 기본 프레임워크 셋업 완료
  - 백엔드 코어 패키지(Swagger, Prisma Client, Config, Axios, Redis 등) 설치 성공
  - 백엔드 Dev 의존성 라이브러리(`prisma`, `vitest`, `unplugin-swc`, `@swc/core`) 설치 및 `vitest.config.ts` 설정 완료
  - Prisma 스키마 및 UUID `input_id` 기반 다형성 관계 스키마(`schema.prisma`) 설계 및 클라이언트 코드 생성 완료
  - 스마트초이스 API 연동 대비 원천 데이터 덤프용 `Plan` 모델 설계 및 로컬 `.env` 환경 세팅 완료
  - 텔레메트리 잉제스천 및 정제 배치 CLI(`npm 일 telemetry:ingest / transform`) 스크립트 연결 및 로직 구현 완료
  - Vitest를 사용한 텔레메트리 정밀 파싱(Edge Case) 및 API 에러 테스트(Retry 유도용) 100% 검증 통과 완료
  - `@nestjs/schedule` 모듈 등록 및 새벽 4시 텔레메트리 스케줄러 크론 파이프라인(`handleDailyPipeline`) 구현 완료
  - AI 추천 평가를 위한 `antigravity/prompts/recommendation_v1.md` 시스템 프롬프트 데이터 템플릿 설계 완료
  - `run_eval_loop.ps1` AI 추천 평가용 Vitest 스텁 시나리오 구성 및 연동 완료 (100% PASS)
  - 비회원 다형성 세션 저장을 위한 `POST /api/sessions` API, DTO, 트랜잭션, `X-Session-ID` 헤더 검증 가드(`SessionGuard`) 구현 완료
  - 위 세션 저장소 로직에 대한 Vitest 유닛 테스트 완료 및 e2e 테스트 시나리오 작성 완료
- **중단점 및 다음 작업 (Next Steps)**:
  - [ ] **유저 액션: 로컬 DB(PostgreSQL) 세팅 및 e2e 테스트 통과**
    - [ ] 1. Docker 또는 로컬에 PostgreSQL(5432 포트) 구동
    - [ ] 2. `backend/.env`의 `DATABASE_URL` 정보 확인 및 실제 DB와 맞추기
    - [ ] 3. 터미널(backend 폴더)에서 `npx prisma db push` 실행하여 테이블 생성
    - [ ] 4. 터미널(backend 폴더)에서 `npm run test:e2e` 실행 후 100% PASS 확인
  - [ ] **AI 액션: 다음 도메인 개발**
    - [ ] `input_id` 기반 AI 추천 조회 API (`GET /api/sessions/:id/recommendations`) 설계 및 프롬프트 주입 연동


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