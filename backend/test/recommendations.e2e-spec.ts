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
            return { id: 'test-uuid-a', sessionId: data.sessionId };
          }
          return { id: 'test-uuid-1234', sessionId: data.sessionId };
        }),
        findUnique: vi.fn().mockImplementation(async ({ where }) => {
          if (where.id === 'test-uuid-1234') {
            return {
              id: 'test-uuid-1234',
              sessionId: 'session-test-123', // Mapped from POST create
            };
          }
          if (where.id === 'test-uuid-a') {
            return {
              id: 'test-uuid-a',
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
      if (where.id === 'test-uuid-1234') return { id: 'test-uuid-1234', sessionId: 'session-test-123' };
      if (where.id === 'test-uuid-a') return { id: 'test-uuid-a', sessionId: 'session-test-a' };
      return null;
    }),
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

    it('POST /api/v1/recommandations - 사용자 조건을 입력하여 input_id 발급', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/recommandations')
        .set('X-Session-ID', sessionId)
        .send({
          userDemand: {
            minDataGb: 50,
            maxFee: 50000,
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

      expect(response.body).toHaveProperty('recommendations');
      expect(Array.isArray(response.body.recommendations)).toBe(true);
    });
  });

  describe('세션 격리 검증', () => {
    let inputId: string;
    const sessionId1 = 'session-test-a';
    const sessionId2 = 'session-test-b';

    it('사용자 A가 조건을 입력하여 세션 생성', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/recommandations')
        .set('X-Session-ID', sessionId1)
        .send({
          userPlan: {
            carrier: 'SKT',
            planName: 'Test',
            networkType: '5G',
            baseFee: 50000,
            dataAllowanceGb: 10,
            voiceAllowanceMin: 100,
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
