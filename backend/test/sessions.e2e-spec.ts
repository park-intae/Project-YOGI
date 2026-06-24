import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('SessionsController (e2e)', () => {
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

  it('/api/sessions (POST) - should fail if X-Session-ID is missing', () => {
    return request(app.getHttpServer())
      .post('/api/sessions')
      .send({
        userPlan: {
          carrier: 'SKT',
          planName: '5G 스탠다드',
          networkType: '5G',
          baseFee: 75000,
          dataAllowanceGb: 200,
          voiceAllowanceMin: -1,
        }
      })
      .expect(401);
  });

  it('/api/sessions (POST) - should fail if body has neither userPlan nor userDemand', () => {
    return request(app.getHttpServer())
      .post('/api/sessions')
      .set('X-Session-ID', '123e4567-e89b-12d3-a456-426614174000')
      .send({})
      .expect(400);
  });

  it('/api/sessions (POST) - should create session with userPlan and userDemand', async () => {
    const sessionId = '123e4567-e89b-12d3-a456-426614174000';
    const response = await request(app.getHttpServer())
      .post('/api/sessions')
      .set('X-Session-ID', sessionId)
      .send({
        userPlan: {
          carrier: 'SKT',
          planName: '5G 스탠다드',
          networkType: '5G',
          baseFee: 75000,
          dataAllowanceGb: 200,
          voiceAllowanceMin: -1,
        },
        userDemand: {
          preferredCarrier: 'KT',
          maxFee: 50000,
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

  it('/api/sessions/:id/recommendations (GET) - should generate prompt based on session', async () => {
    const sessionId = '123e4567-e89b-12d3-a456-426614174000';
    // Create a session first to ensure we have a valid input_id
    const createRes = await request(app.getHttpServer())
      .post('/api/sessions')
      .set('X-Session-ID', sessionId)
      .send({
        userPlan: {
          carrier: 'LG',
          planName: 'LTE 기본',
          networkType: 'LTE',
          baseFee: 33000,
          dataAllowanceGb: 5,
          voiceAllowanceMin: 100,
        }
      });
    
    const inputId = createRes.body.id;

    const response = await request(app.getHttpServer())
      .get(`/api/sessions/${inputId}/recommendations`)
      .set('X-Session-ID', sessionId)
      .expect(200);

    expect(response.body).toHaveProperty('prompt');
    expect(response.body.inputId).toBe(inputId);
    // Check if the prompt includes the injected values
    expect(response.body.prompt).toContain('LG');
    expect(response.body.prompt).toContain('LTE 기본');
  });
});
