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

### [Phase 6] 데이터베이스 로직 고도화
- [x] 실제 데이터베이스 스키마 및 적재 로직 최적화 검토
- [x] 데이터 무결성 보장을 위한 트랜잭션 범위 세분화
- [x] 외부 데이터(요금제 정보) 인제스트(Ingest) 고도화

### [Phase 7] 외부 API 및 실제 AI 추천 프롬프트 연동
- [x] 스마트초이스 외부 API 연동 및 네트워크 장애 대비 로직 고도화
- [x] 실제 생성형 AI(LLM) 프롬프트 연동 및 추천 결과 JSON 파싱
- [x] 프롬프트 컨텍스트(사용자 요금제 비교) 최적화
### [Phase 8] UI/UX 폴리싱 및 디자인 시안 완벽 반영
- [x] 프론트엔드 SSR(Server Component) 환경에서 발생하는 `X-Session-ID` 헤더 누락 버그 해결 (클라이언트 컴포넌트로 분리)
- [x] `UI_디자인_및_ERD.pdf` 시안을 완벽 반영하여 추가 추천 요금제 목록을 콤팩트한 가로 리스트(Row) 형태로 전면 개편
- [x] 추천 요금제 리스트에 데이터/통화/문자 미니 도넛 차트 도입 및 UI 요소 스케일업(크기/여백/폰트 확대)
- [x] 추천 기준 안내 모달을 팝오버(Popover) 방식으로 변경하여 흐름 단절 해결 및 팝오버 사이즈/가독성 개선
- [x] [자세히 보기] 버튼을 실제 요금제 URL로 이동하는 하이퍼링크(`<a href>`)로 변경 (`plan_url` DTO 속성 추가)
--

## 2. 🚦 현재 작업 세션 로그 및 중단 점 (Handover Note)
- **일시**: 2026-06-26T23:40:00+09:00
- **완료된 작업**:
  - **[BugFix]** Next.js Server Component 환경에서 백엔드로 `X-Session-ID` 헤더가 전달되지 않는 문제를 해결하기 위해 `RecommendationContent`를 Client Component로 분리 완료.
  - **[UI/UX]** `UI_디자인_및_ERD.pdf` 원본 시안을 기반으로 '추가 추천 요금제' 디자인 전면 수정 (원형 미니 차트 추가, 가로 배치, 여백 및 폰트 크기 확대).
  - **[UI/UX]** AI 추천 기준 안내 버튼을 화면을 가리는 모달에서 자연스러운 팝오버(Popover) 형태로 변경.
  - **[Feature]** 프론트엔드 및 백엔드 DTO에 `plan_url`을 추가하고, '자세히 보기' 버튼 클릭 시 해당 URL로 외부 이동하도록 하이퍼링크 처리.
  - 프론트엔드 단위/UI 컴포넌트 테스트(`vitest`) 11/11 `PASS` 재검증 완료.
- **중단점 및 다음 작업 (Next Steps)**:
  - 브라우저 상에서의 모든 UI 디자인 반영과 백엔드 연동이 사용자의 수동 검증을 통해 성공적으로 확인되었습니다.
  - 다음 기능 개발(추가 필터링, 정렬, 마이페이지 등)로 넘어갈지, 혹은 클라우드 배포(Vercel/AWS)를 진행할지 결정이 필요합니다.

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