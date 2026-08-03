🗺️ Project YOGI - AI Orchestration Master & Checklist

## 0. AI 개발 모드 전환 및 컨텍스트 규칙
- AI 에이전트는 작업을 시작하거나 이어받을 때 반드시 본 파일과 도메인별 가이드(`@backend_instructions.md`, `@frontend_instructions.md`)를 컨텍스트로 먼저 로드할 것.
- 모든 기능 구현은 선언식 파이프라인(`@harness.yaml`)의 아키텍처 규칙과 비회원제 다형성(`input_id`) 흐름을 절대 위반 금지.
- 작업 진입 전 어떤 작업을 할지 브리핑, 작업 승인 시 전체 작업 마스터 체크리스트 업데이트 후 진행할 것.
- 작업 완료시 체크리스트 업데이트 후 다음 작업 진행
- 작업 종료 명령 수령 시 "전체 작업 마스터 체크리스트" 와 "현재 작업 세션 로그 및 중단 점" 업데이트 할 것
- "현재 작업 세션 로그 및 중단 점"은 세션 시작 후, 종료 전 내용만 기록
- 작업 중 발생한 에러 및 트러블슈팅 내역은 반드시 `@antigravity/troubleshooting.md` 파일에 상세히 기록할 것.
- 개발중에는 오류발생 시 목업데이터로 사용하되, 배포 전에는 오류처리할 것.

## 1. 🚀 전체 작업 마스터 체크리스트 (Progress Tracker)
> 💡 [주의] 작업을 중단하기 직전, AI는 반드시 현재까지 완료된 항목을 `[x]`로 표시하고, 진행 중인 항목이나 다음 할 일을 업데이트해야 합니다.

### [Phase 1] 환경 구축 및 데이터 아키텍처
- [x] 프론트엔드 폴더(`frontend`) 생성 및 Next.js 기본 템플릿 설치
- [x] 백엔드 폴더(`backend`) 생성 및 NestJS 기본 템플릿 설치
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
- [x] 우체국 알뜰폰 외부 API 연동 및 네트워크 장애 대비 로직 고도화
- [x] 실제 생성형 AI(LLM) 프롬프트 연동 및 추천 결과 JSON 파싱
- [x] 프롬프트 컨텍스트(사용자 요금제 비교) 최적화

### [Phase 8] UI/UX 폴리싱 및 사용성 개선 완료
- [x] **결과 시각화**: Chart.js 다중 링 차트 도입(제공량 비교) 및 잘림 방지용 외부 툴팁 적용
- [x] **디자인 강화**: TOP 3 카드 금/은/동 메달 테마 적용, 리스트 가로형 개편 및 UI 스케일업
- [x] **인터랙션 개선**: 진단 폼(자유 숫자 폼+무제한 체크박스), 헤더(이용 방법 팝오버), 추천 기준 팝오버 적용
- [x] **안정성/기능**: 외부 요금제 링크 하이퍼링크 처리 및 SSR 세션 헤더 누락 버그 해결

### [Phase 9] UI 테마 제작
- [x] UI 테마 기획 및 제작 진행 완료 (안정성을 위해 플러그인 제외 후 CSS 변수 수동 매핑)
- [x] 입력 폼에 인라인 에디트 방식 적용
- [x] 절약 금액 숫자에 카운트업 인터랙션 애니메이션 적용(prefers-reduced-motion)
- [x] "다른 요금제 더 보기" 테이블에 통신사 필터 추가(skt,kt,lgu+,알뜰폰skt,알뜰폰kt,알뜰폰lgu+)
- [x] 다크모드 추가
- [x] 스탭퍼 수정(우측 스크롤 바 옆으로 이동, 위에서 아래로 진행, 항목 클릭 시 해당 위치로 이동, 이동 시 애니메이션 효과)
- [x] 스텝퍼 동적 노출 감지(MutationObserver) 및 3번 스텝(추가 요금제 비교) 렌더링 개선 완료
- [x] 추천 요금제 및 비교 영역 아코디언 애니메이션 + ResizeObserver 기반 Scroll-Driven 동기화 구현 완료

### [Phase 10] 외부 요금제 데이터 API 연동 (External API Integration)
- [x] `telemetry` 모듈에 `@nestjs/axios` `HttpModule` 의존성 주입
- [x] `TelemetryService` 내 `fetchData` 메서드를 `HttpService`를 사용한 실제 HTTP 호출 로직으로 개편
- [x] 환경 변수(`EXTERNAL_PLAN_API_URL`) 존재 여부에 따른 Mock 데이터 Fallback 로직 구현
- [x] 프론트엔드/백엔드 실제 외부 API 연동 통합 테스트 및 예외 처리(지수 백오프) 동작 확인
- [x] API 환경 변수 연결
- [x] API Key 활성화 대기 (공공데이터포털 승인 및 동기화 1~2시간)
- [x] API Key 활성화 후 `npm run telemetry:ingest` 재테스트 및 데이터베이스 적재 최종 확인

### [Phase 11] UI 고도화
- [x] 이용방법 버튼 클릭 시 버튼 레이아웃 변동 문제
- [x] 무제한 체크박스 항목 옆으로 이동
- [x] 추가 요금제 비교 요금제 통신사 테이블필터 클릭시 AI 추천 요금제 항목 리랜더링 문제
- [x] 프론트엔드 `brand_logo`폴더 내 이미지 파일로 통신사 로고 수정
- [x] 프론트엔드 UI/UX 추가 개선 및 애니메이션/상호작용 폴리싱
  - [x] 매끄러운 화면 전환: 페이지 라우팅 애니메이션 및 스켈레톤 UI 다크/라이트 테마 최적화
  - [x] 마이크로 인터랙션: 요금제 카드 및 버튼 호버(Hover)/클릭(Scale/Ripple) 피드백 강화
  - [x] 반응형 디테일: 모바일 화면에서의 차트, 테이블, 스텝퍼 여백 및 레이아웃 교정
  - [x] 피드백 UI 통합: 토스트(Toast) 알림 창 디자인을 앱 테마에 맞춰 재설계
- [x] 구현 완료 후 전체적인 디자인 완성도 점검

### [Phase 12] 알뜰폰 전용 플랫폼 전환(Pivot) 리팩토링
- [x] 도메인 정리: MNO(SKT, KT, LGU+) 요금제를 데이터베이스와 인제스트 스크립트에서 완전 제거
- [x] 데이터 모델 변경: 기존 통신 3사를 요금제 주체가 아닌 '망(Base Network)' 개념으로만 사용하도록 타입 강제
- [x] 추천 알고리즘 수정: AI 프롬프트 및 백엔드 조회 로직을 알뜰폰 요금제 내에서만 이뤄지도록 고정 (is_mvno 속성 제거)
- [x] 프론트엔드 필터 개편: 기존 "SKT/KT/LGU+/알뜰폰" 필터를 제거하고 "SKT망/KT망/LGU+망" 및 주요 알뜰폰 통신사 필터로 교체
- [x] 프론트엔드 UX 라이팅 수정: 사용자가 통신 3사에서 알뜰폰으로 넘어올 때의 '절약 금액'을 강조하도록 입력 폼 변경
- [x] 테스트: Vitest, E2E 및 AI 모델 모의 추천 테스트 수행하여 알뜰폰 전용 환경 안정성 확보 및 불필요한 컴포넌트 제거
- [x] 테스트 코드 갱신: 알뜰폰 전용 비즈니스 로직에 맞춰 Vitest 단위 테스트 재작성 및 통과 확인

### [Phase 13] 예외 처리 및 UI 연동 고도화 (AI 추천 속도 개선)
- [x] AI 모델(`RecommendationsService`) 추천 후보군 축소 (10개 -> 5개)를 통한 토큰 처리 속도 최적화
- [x] 백엔드 AI 분석 로직에 20초 제한 타임아웃(`Promise.race`) 안전장치 적용
- [x] 503 Service Unavailable 에러를 프론트엔드로 반환하도록 예외 스펙 수정 및 Vitest 테스트 갱신
- [x] 프론트엔드(`RecommendationContentClient`)에서 백엔드 503 에러 발생 시 Next.js 오버레이 노출을 방지하고, 혼란을 주는 목업 데이터 대신 명확한 에러 안내와 '다시 시도하기' CTA 버튼을 제공하도록 예외 처리 고도화
- [x] UI 디테일 개선: 2위 카드 은색 그림자 시인성 강화 (`shadow-gray-300/50`), 순위 뱃지 줄바꿈 방지 (`whitespace-nowrap shrink-0`)
- [x] 요금제 추천 카드 호버 시 발생하는 레이아웃 오버플로우(테두리 잘림) 문제 구조적 해결:
  - `AccordionReveal` 바깥의 패딩을 안쪽으로 밀어 넣어 확장 안전 구역(Safe Zone) 확보 (오리지널 레이아웃 `max-w-6xl`, `gap-6` 완벽 유지)
  - 상하 팽창 시 잘림 방지를 위해 컨테이너 내부 수직 패딩(`pt-6`, `pb-12`) 및 z-index 계층(`hover:z-10`) 강화

### [Phase 14] 요금제 사이트 크롤러 제작 및 적용 (URL 사전 스크래핑 기반)
- [x] 타겟 대상(우체국 알뜰폰 사이트) 분석: 요금제 목록에서 개별 요금제 '자세히 보기' URL(`plan_url`) 획득을 위한 DOM/API 구조 분석
- [x] 순수 백엔드 스크래핑 환경 세팅: Axios + Cheerio 등 Node.js 기반 크롤링 라이브러리 설치
- [x] 크롤러 서비스 모듈 개발: DB에 적재된 요금제 명칭을 기반으로 우체국 사이트 내 매칭되는 요금제의 상세 URL 추출
- [x] 데이터 병합(Upsert): 수집한 `plan_url`을 기존 Prisma 스키마(`plan_url` 컬럼)에 업데이트하는 로직 구현
- [x] 스케줄러 통합(Cron): 기존 API 동기화 스케줄러(`telemetry:ingest`) 실행 직후 크롤러가 연달아 실행되도록 파이프라인(매일 새벽) 재구성
- [x] 초기 데이터 수동 적재: 스크립트를 1회 수동 실행하여 현재 DB에 적재된 모든 요금제(약 65개)의 URL을 업데이트
- [x] Vitest 테스트 작성: 크롤링 모듈의 네트워크 실패(Retry) 처리 및 정상 URL 파싱 동작에 대한 단위/통합 테스트

### [Phase 15] 크롤러 작동 오류 해결 작업
- [x] 크롤러 URL 쿼리 파라미터(srch_telecomcd -> telecomcd) 수정
- [x] 크롤러 요금제 이름 추출 로직 강화 (.closest와 title 태그 검색 방식 적용)
- [x] UI 헤더 영역 마우스 오버 시(z-index) 겹침 문제 해결 확인

### [Phase 16] "다른 요금제 더 보기" 비동기 AI 추가 추천 (Load More) 기능 구현
- [x] 백엔드 `RecommendationsController` 및 `RecommendationsService`에 추가 추천 페이징 API(`GET /api/v1/recommendations/:input_id/more`) 설계
- [x] 기존 추천된 요금제를 제외한 차순위 후보군(예: 4위~8위)을 추출하는 로직 및 AI 프롬프트(`recommendation_more_v1.md`) 분리 작성
- [x] 프론트엔드 `yogiApi`에 추가 추천 API 호출 함수 연동
### [Phase 17] AI 응답 시간 단축 및 투트랙(Two-Track) 아키텍처 도입 (완료)
- [x] 추천 요금제 데이터 응답과 AI 요약 코멘트 응답의 API 분리 (Data API / AI Summary API)
- [x] 백엔드(`RecommendationsService`): 요금제 추천 로직은 순수 DB 쿼리와 연산(예상 절감액 등)으로 즉각 반환하도록 수정 (< 100ms)
- [x] 백엔드(`RecommendationsService`): AI는 반환된 요금제를 기반으로 '추천 이유'만 짧게 생성하는 전용 엔드포인트(`.../summary`) 구축
- [x] 프론트엔드: 요금제 카드 렌더링을 먼저 즉시 보여주고, AI 추천 이유는 스켈레톤 UI를 띄운 뒤 비동기로 불러오도록 UI/UX 고도화
- [x] AI 모델 파라미터 튜닝 (`temperature: 0` 등 결정론적 텍스트 생성) 및 프롬프트 최적화
### [Phase 18] Monorepo 도구 도입 및 구성
- [x] **워크스페이스 구조 개편 (npm workspaces 적용)**
  - [x] 루트 `package.json`에 `workspaces` 속성 추가 (`apps/*`, `packages/*` 구조)
  - [x] 기존 `frontend` 및 `backend` 폴더를 `apps/frontend`, `apps/backend`로 이동
- [x] **공통 패키지(`packages`) 구성 및 분리**
  - [x] `packages/shared-types` 생성: 프론트/백엔드가 공유하는 DTO 및 Prisma 모델 기반 타입 분리 (완료)
  - [x] `packages/eslint-config` 생성: 프로젝트 전역 공통 린트 규칙 세팅 (완료)
  - [x] `packages/typescript-config` 생성: 공통 `tsconfig.json` 베이스 세팅 (완료)
- [x] **패키지 간 내부 의존성 연결**
  - [x] `apps/frontend` 및 `apps/backend`의 `package.json`에서 사내 패키지(`@yogi/shared-types` 등) 참조하도록 설정
- [x] **Turborepo 도입 및 파이프라인 구축**
  - [x] 루트 프로젝트에 `turbo` 패키지 설치
  - [x] `turbo.json` 설정 파일 작성: `build`, `dev`, `lint`, `test` 등 파이프라인 의존성 및 캐싱 룰 정의
- [x] **실행 스크립트 및 환경 검증**
  - [x] 루트 `package.json`의 기존 `concurrently` 기반 스크립트를 `turbo run dev`, `turbo run build`로 대체
  - [x] 전체 의존성 설치(Hoisting 확인), 병렬 빌드 및 실행 정상 동작 테스트
  - [x] 기존 Vitest 및 Supertest 통과 여부 최종 점검

### [Phase 19] CI/CD 파이프라인 구축 및 자동화 (CI/CD Pipeline & Automation)
- [x] **GitHub Actions CI 워크플로우 작성 (`.github/workflows/ci.yml`)**
  - [x] Node.js 및 npm workspaces dependency 캐싱 설정
  - [x] Turborepo 캐시 및 병렬 명령 연동 (`turbo run lint test build`)
- [x] **백엔드(NestJS) 및 프론트엔드(Next.js) Docker 멀티 스테이지 이미지 빌드 구성**
  - [x] `apps/backend/Dockerfile` 경량화 멀티 스테이지 빌드 작성
  - [x] `apps/frontend/Dockerfile` Standalone 빌드 기반 컨테이너화
  - [x] `docker-compose.yml`을 통한 로컬/CI 멀티 컨테이너 검증 파이프라인 구성
- [x] **데이터베이스(Prisma) 마이그레이션 자동화**
  - [x] CI 파이프라인 내 PostgreSQL 컨테이너/Service 연결 및 Prisma Client 자동 생성
  - [x] `prisma migrate deploy` 마이그레이션 검증 단계 추가
- [x] **자동 배포(CD) 파이프라인 및 환경변수(Secrets) 관리 구성**
  - [x] 브랜치(`main`) 머지 시 배포 파이프라인 연동 (`.github/workflows/cd.yml`)
  - [x] GitHub Repository Secrets 설정 및 보안 가이드라인 명시
- [x] **CI/CD 파이프라인 검증 및 헬스 체크 (Health Check)**
  - [x] PR 생성 및 main 푸시 시 CI 액션 정상 통과 확인
  - [x] 헬스 체크 엔드포인트 연동 테스트

## 2. 🚦 현재 작업 세션 로그 및 중단 점 (Handover Note)
- **일시**: 2026-08-03T18:14:00+09:00
- **완료된 작업**:
  - Phase 19 (CI/CD 파이프라인 구축 및 자동화) 성공적으로 구축 및 검증 완료.
  - `.github/workflows/ci.yml` (Monorepo Node.js + Postgres Service + Turborepo lint/test/build) 워크플로우 구축.
  - `.github/workflows/cd.yml` (GitHub Container Registry Docker 이미지 자동 빌드 및 푸시) 워크플로우 구축.
  - `apps/backend/Dockerfile` & `apps/frontend/Dockerfile` 경량 멀티 스테이지 빌드 및 Next.js standalone 모드 설정.
  - `docker-compose.yml`을 활용한 PostgreSQL + 백엔드 + 프론트엔드 통합 오케스트레이션 구성.
  - Turborepo 빌드 (`npm run build`) 통과 완료.
- **중단점 및 다음 작업 (Next Steps)**:
  - Phase 19 완료. 다음 마일스톤 (운영 배포 및 모니터링 고도화 Phase 20) 진입 대기.

## 🧪 3. 깐깐한 QA 에이전트(QA/Test) 검증 프로토콜
> AI는 구현 코드를 작성한 후, 스스로를 '시니어 QA 엔지니어' 모드로 전환하여 아래의 테스트 지침을 100% 통과시켜야 합니다.

### 1. Vitest 단위/로직 테스트 규칙
- **Edge Case 우선 검증**: 정상적인 데이터 입력 외에, 외부 API에서 값이 누락되거나(`null`), 이상 문자열이 들어오거나, 데이터 규격이 깨진 상황을 Mocking하여 테스트 케이스를 3개 이상 작성할 것.
- **회복 탄력성(Retry) 검증**: 우체국 알뜰폰 API 호출 실패 시, `harness.yaml`에 정의된 지수 백오프(Retry & Backoff) 로직이 실제로 작동하여 재시도하는지 가상(Mock) 타이머를 활용해 반드시 검증할 것.

### 2. Supertest API 시나리오 테스트 규칙
- **단방향 Flow & 다형성 검증**: 사용자가 조건을 입력하여 `input_id`가 발급되는 시점부터, 해당 `input_id`로 결과를 페칭하는 전체 REST API 시나리오 테스트를 작성할 것.
- **세션 격리 검증**: 다른 `X-Session-ID`를 가진 익명 사용자가 서로의 `input_id` 데이터에 접근할 수 없는지(보안 및 컨텍스트 격리) 시나리오 테스트에 포함할 것.

### 3. 품질 통과 기준 (Definition of Done)
- AI는 코드를 다 짰다고 선언하기 전에, 터미널에서 Vitest/Supertest 명령어(`npm run test` 등)를 스스로 실행하고 **모든 테스트가 `PASS`된 로그를 유저에게 증거로 제출**해야 함.