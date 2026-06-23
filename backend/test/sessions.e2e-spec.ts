import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
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
      .set('X-Session-ID', 'test-session-123')
      .send({})
      .expect(400);
  });

  it('/api/sessions (POST) - should create session with userPlan and userDemand', async () => {
    const sessionId = 'test-session-123';
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
});
