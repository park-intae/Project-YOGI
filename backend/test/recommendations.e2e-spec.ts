import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

import { PrismaService } from '../src/prisma/prisma.service';
import { vi } from 'vitest';

const mockPrismaService = {
  $transaction: vi.fn().mockImplementation(async (cb) => {
    const tx = {
      inputSession: {
        create: vi.fn().mockImplementation(async ({ data }) => {
          if (data.sessionId === 'session-test-a') {
            return { id: '00000000-0000-0000-0000-00000000000a', sessionId: data.sessionId };
          }
          return { id: '11111111-1111-1111-1111-111111111111', sessionId: data.sessionId };
        }),
        findUnique: vi.fn().mockImplementation(async ({ where }) => {
          if (where.id === '11111111-1111-1111-1111-111111111111') {
            return {
              id: '11111111-1111-1111-1111-111111111111',
              sessionId: 'session-test-123', // Mapped from POST create
            };
          }
          if (where.id === '00000000-0000-0000-0000-00000000000a') {
            return {
              id: '00000000-0000-0000-0000-00000000000a',
              sessionId: 'session-test-a',
            };
          }
          return null;
        }),
      },
      userPlan: { create: vi.fn() },
      userDemand: { create: vi.fn() },
    };
    return cb(tx);
  }),
  inputSession: {
    findUnique: vi.fn().mockImplementation(async ({ where }) => {
      if (where.id === '11111111-1111-1111-1111-111111111111') return { id: '11111111-1111-1111-1111-111111111111', sessionId: 'session-test-123' };
      if (where.id === '00000000-0000-0000-0000-00000000000a') return { id: '00000000-0000-0000-0000-00000000000a', sessionId: 'session-test-a' };
      return null;
    }),
  },
  plan: {
    findMany: vi.fn().mockResolvedValue([]),
  },
};

describe('Recommendations API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(PrismaService)
    .useValue(mockPrismaService)
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('단방향 Flow & 다형성 검증', () => {
    let inputId: string;
    const sessionId = 'session-test-123';

    it('POST /api/v1/recommendations - 사용자 조건을 입력하여 input_id 발급', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/recommendations')
        .set('X-Session-ID', sessionId)
        .send({
          input_type: 'DEMAND',
          demand_condition: {
            min_data_gb: 50,
            max_budget: 50000,
          }
        })
        .expect(201);
      
      expect(response.body).toHaveProperty('id');
      inputId = response.body.id;
    });

    it('GET /api/v1/recommendations/:id - 발급된 input_id로 결과 페칭', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/recommendations/${inputId}`)
        .set('X-Session-ID', sessionId)
        .expect(200);

      expect(response.body).toHaveProperty('recommended_plans');
      expect(Array.isArray(response.body.recommended_plans)).toBe(true);
    });
  });

  describe('세션 격리 검증', () => {
    let inputId: string;
    const sessionId1 = 'session-test-a';
    const sessionId2 = 'session-test-b';

    it('사용자 A가 조건을 입력하여 세션 생성', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/recommendations')
        .set('X-Session-ID', sessionId1)
        .send({
          input_type: 'PLAN',
          current_plan: {
            actual_carrier: 'SKT',
            actual_plan_name: 'Test',
            actual_monthly_fee: 50000,
            actual_data_usage: 10,
            actual_voice_usage: 100,
          }
        })
        .expect(201);
      
      inputId = response.body.id;
    });

    it('사용자 B가 사용자 A의 input_id로 접근을 시도하면 거부되어야 한다 (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/recommendations/${inputId}`)
        .set('X-Session-ID', sessionId2)
        .expect(403);
    });
  });
});
