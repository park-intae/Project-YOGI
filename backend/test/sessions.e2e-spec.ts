import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('RecommendationsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
    
    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Clean up created session
    await prisma.inputSession.deleteMany({});
    await app.close();
  });

  it('/api/v1/recommendations (POST) - should fail if X-Session-ID is missing', () => {
    return request(app.getHttpServer())
      .post('/api/v1/recommendations')
      .send({
        input_type: 'PLAN',
        current_plan: {
          actual_carrier: 'SKT',
          actual_plan_name: '5G 스탠다드',
          actual_monthly_fee: 75000,
          actual_data_usage: 200,
          actual_voice_usage: -1,
        }
      })
      .expect(401);
  });

  it('/api/v1/recommendations (POST) - should fail if body has neither current_plan nor demand_condition', () => {
    return request(app.getHttpServer())
      .post('/api/v1/recommendations')
      .set('X-Session-ID', '123e4567-e89b-12d3-a456-426614174000')
      .send({
        input_type: 'BOTH'
      })
      .expect(400);
  });

  it('/api/v1/recommendations (POST) - should create session with current_plan and demand_condition', async () => {
    const sessionId = '123e4567-e89b-12d3-a456-426614174000';
    const response = await request(app.getHttpServer())
      .post('/api/v1/recommendations')
      .set('X-Session-ID', sessionId)
      .send({
        input_type: 'BOTH',
        current_plan: {
          actual_carrier: 'SKT',
          actual_plan_name: '5G 스탠다드',
          actual_monthly_fee: 75000,
          actual_data_usage: 200,
          actual_voice_usage: -1,
        },
        demand_condition: {
          preferred_carrier_type: 'KT',
          max_budget: 50000,
        }
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.sessionId).toBe(sessionId);
    expect(response.body.userPlan).toBeDefined();
    expect(response.body.userPlan.carrier).toBe('SKT');
    expect(response.body.userDemand).toBeDefined();
    expect(response.body.userDemand.preferredCarrier).toBe('KT');
  });

  it('/api/v1/recommendations/:id (GET) - should generate prompt based on session', async () => {
    const sessionId = '123e4567-e89b-12d3-a456-426614174000';
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/recommendations')
      .set('X-Session-ID', sessionId)
      .send({
        input_type: 'PLAN',
        current_plan: {
          actual_carrier: 'LG',
          actual_plan_name: 'LTE 기본',
          actual_monthly_fee: 33000,
          actual_data_usage: 5,
          actual_voice_usage: 100,
        }
      });
    
    const inputId = createRes.body.id;
    if (!inputId) {
      throw new Error('Failed to create session, no inputId returned');
    }

    const response = await request(app.getHttpServer())
      .get(`/api/v1/recommendations/${inputId}`)
      .set('X-Session-ID', sessionId)
      .expect(200);

    expect(response.body).toHaveProperty('recommended_plans');
    expect(Array.isArray(response.body.recommended_plans)).toBe(true);
  });
});
