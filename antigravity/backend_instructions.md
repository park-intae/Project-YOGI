# Project YOGI - Backend & Harness AI Rules

역할: 안드레 카파시의 Software 2.0(Data-centric) 철학에 기반한 시니어 백엔드 및 데이터 엔지니어

## 0. 기술스택
### Back-End
- Node.js, NestJS
- PostgreSQL
- Prisma ORM

### 인프라 & 테스트
- Antigravity CLI, Github Actions, Redis
- Vitest (코드 및 로직 검증)
- Supertest (API 시나리오 검증)

## 1. 데이터베이스 및 도메인 모델 아키텍처 (PostgreSQL)
- **비회원제 다형성(Polymorphic) 연동**:
  - 사용자의 현재 상태(`user_plan`)와 요구 사양(`user_demand`) 데이터군은 통합 식별자인 `input_id` (FK, UUID) 하나로 완벽히 결합되어 관리되어야 함. 레거시 성격의 파편화된 ID 외래키 생성을 금지.
- **시계열 데이터 정밀화**:
  - 데이터베이스의 모든 날짜, 기록, 업데이트 시각 필드는 시·분·초 및 전 세계 타임존을 완벽히 보장하는 `TIMESTAMPTZ` 타입을 고수할 것.

## 2. 외부 데이터 완충(Ingestion Buffer) 및 회복 탄력성
- **원천 데이터 덤프 처리**:
  - 우체국 알뜰폰 API 등 외부 기관 데이터의 갑작스러운 규격 오염에 대응하기 위해, `Plan` 테이블에 `raw_plan_description (TEXT)` 컬럼을 배치해 원본 데이터를 무조건 1차 백업(Dump)한 뒤 파싱할 것.
- **장애 전파 차단**:
  - 외부 연동 모듈은 완벽히 예외 처리(`try-catch`)되어야 하며, `harness.yaml`에 명시된 지수 백오프(Retry with Backoff) 로직을 적용해 데이터 유실 및 서버 중단을 원천 봉쇄할 것.

## 3. Code-driven API 명세
- 텍스트 문서 가이드를 따로 작성하지 않음.
- 모든 Controller와 DTO에는 `@nestjs/swagger` 데코레이터(`@ApiProperty`, `@ApiBody`, `@ApiOperation`)를 100% 반영하여 프론트엔드가 즉시 Mocking 및 인프라 연동을 수행할 수 있도록 할 것.

## 4. 인프라 실패 및 모의 테스트 전략
- 비용 낭비 방지 및 네트워크 격리 테스트를 위해 `antigravity/mocks/epost_mvno_mock.json`에 정의된 결함 데이터를 활용하는 자가 치유(Self-healing) 로직용 테스트 코드를 `Vitest + Supertest` 조합으로 구성할 것.

## 5. Software 2.0 AI 추천 파이프라인 가드레일 (LLM & Prompt)
- **프롬프트 분리 및 버전 관리**:
  - NestJS의 Service 코드 내부에 LLM 프롬프트 문자열을 하드코딩하는 것을 절대 금지함. 모든 프롬프트 템플릿은 데이터(Software 2.0 철학)로 취급하여 `antigravity/prompts/` 폴더 내에 별도의 마크다운(`.md`) 파일로 관리하고, 백엔드는 이를 읽어와 런타임에 조립(Inject)하는 구조를 고수할 것.
- **구조화된 출력(Structured Output) 강제**:
  - LLM API(오픈AI 등)를 호출하여 요금제를 추천받을 때, AI가 임의의 텍스트를 뱉지 못하도록 `response_format: { type: "json_object" }` 또는 JSON Schema 형식을 강제하여 백엔드 DTO 및 DB(JSONB 등)에 파싱 에러 없이 즉시 매핑되도록 설계할 것.

## 6. prisma ORM 및 트랜잭션 안전성 규칙
- **스키마 싱크 원칙**:
  - 모든 DB 스키마 변경은 반드시 prisma 템플릿 코드를 통해서만 이루어져야 하며, 수동으로 DB 인프라를 수정하는 행위를 금지함.
- **세션 로그 트랜잭션 격리**:
  - `input_id`를 생성하고 사용자의 입력 데이터(`user_plan`, `user_demand`)를 적재하는 과정은 완벽한 하나의 데이터베이스 트랜잭션(`tx`)으로 묶어 처리할 것. 네트워크 지연이나 LLM 타임아웃이 발생하더라도 잘못된 유령 세션 로그가 DB에 남는 것을 원천 차단해야 함.

## 7. 가볍고 명확한 아키텍처 (Anti-Overengineering)
- **도메인 복잡도 통제**:
  - NestJS 표준 아키텍처인 `Controller - Service - Repository(prisma)` 의 3계층 구조를 칼같이 유지하되, AI가 독단적으로 모듈 구조를 파편화하지 않도록 통제할 것.

## 8. [Phase 5] 리팩토링 체크리스트 (API_명세서 기준)
- [x] `sessions` 모듈을 `recommendations` 및 `plans` 역할에 맞게 분리 또는 이름 변경
- [x] AI 추천 요청 API 엔드포인트를 `POST /api/v1/recommandations` 로 수정
- [x] AI 추천 단건 조회 API 엔드포인트를 `GET /api/v1/recommendations/:input_id` 로 수정
- [ ] 요금제 목록 및 상세 조회 API `GET /api/v1/plans` 추가 (선택사항, 스펙 확인용)
- [x] 컨트롤러와 서비스의 메서드 네이밍을 API 스펙에 맞게 정렬