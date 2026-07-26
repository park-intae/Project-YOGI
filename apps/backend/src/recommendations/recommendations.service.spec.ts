import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationsService } from './recommendations.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ConfigService } from '@nestjs/config';

vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn().mockReturnValue('mock template {{user_carrier}}'),
    existsSync: vi.fn().mockReturnValue(true),
  },
  readFileSync: vi.fn().mockReturnValue('mock template {{user_carrier}}'),
  existsSync: vi.fn().mockReturnValue(true),
}));

describe('RecommendationsService', () => {
  let service: RecommendationsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationsService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: vi.fn(),
            inputSession: { findUnique: vi.fn() },
            plan: { findMany: vi.fn() },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RecommendationsService>(RecommendationsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw BadRequestException if both current_plan and demand_condition are empty for BOTH', async () => {
    await expect(
      service.createSession('session-123', { input_type: 'BOTH' }),
    ).rejects.toThrow(BadRequestException);
  });

  describe('getRecommendationsData', () => {
    it('should throw NotFoundException if session not found', async () => {
      prisma.inputSession.findUnique = vi.fn().mockResolvedValue(null);
      await expect(
        service.getRecommendationsData('invalid', 'session-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if session ID mismatch', async () => {
      prisma.inputSession.findUnique = vi
        .fn()
        .mockResolvedValue({ sessionId: 'other-session' });
      await expect(
        service.getRecommendationsData('input-123', 'session-123'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return recommended plans data without AI', async () => {
      prisma.inputSession.findUnique = vi.fn().mockResolvedValue({
        sessionId: 'session-123',
        userPlan: { baseFee: 60000 },
      });
      prisma.plan.findMany = vi
        .fn()
        .mockResolvedValue([{ id: 'plan-1', planName: 'P1', baseFee: 40000 }]);

      const result = await service.getRecommendationsData(
        'input-123',
        'session-123',
      );
      expect(result.recommended_plans.length).toBe(1);
      expect(result.recommended_plans[0].expected_savings).toBe(20000); // 60000 - 40000
    });
  });

  describe('getMoreRecommendationsData', () => {
    it('should throw NotFoundException if session not found', async () => {
      prisma.inputSession.findUnique = vi.fn().mockResolvedValue(null);
      await expect(
        service.getMoreRecommendationsData('invalid', 'session-123', []),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return recommended plans data excluding already given', async () => {
      prisma.inputSession.findUnique = vi
        .fn()
        .mockResolvedValue({ sessionId: 'session-123' });
      prisma.plan.findMany = vi
        .fn()
        .mockResolvedValue([
          { id: 'plan-1' },
          { id: 'plan-2', baseFee: 30000 },
        ]);

      const result = await service.getMoreRecommendationsData(
        'input-123',
        'session-123',
        ['plan-1'],
      );
      expect(result.recommended_plans.length).toBe(1);
      expect(result.recommended_plans[0].plan_id).toBe('plan-2');
    });

    it('should return empty result if no additional candidates are found', async () => {
      prisma.inputSession.findUnique = vi
        .fn()
        .mockResolvedValue({ sessionId: 'session-123' });
      prisma.plan.findMany = vi.fn().mockResolvedValue([{ id: 'plan-1' }]);

      const result = await service.getMoreRecommendationsData(
        'input-123',
        'session-123',
        ['plan-1'],
      );
      expect(result.recommended_plans.length).toBe(0);
    });
  });

  describe('getRecommendationSummary', () => {
    it('should throw NotFoundException if session not found', async () => {
      prisma.inputSession.findUnique = vi.fn().mockResolvedValue(null);
      await expect(
        service.getRecommendationSummary('invalid', 'session-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return mock summary in test mode', async () => {
      prisma.inputSession.findUnique = vi
        .fn()
        .mockResolvedValue({ sessionId: 'session-123' });
      prisma.plan.findMany = vi.fn().mockResolvedValue([]);

      const result = await service.getRecommendationSummary(
        'input-123',
        'session-123',
      );
      expect(result.ai_summary_comment).toContain('임시 요약 멘트');
    });

    it('should call Gemini API for summary', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      (service as any).genAI = {
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () =>
                JSON.stringify({ ai_summary_comment: 'AI Summary Response' }),
            },
          }),
        }),
      };

      prisma.inputSession.findUnique = vi
        .fn()
        .mockResolvedValue({ sessionId: 'session-123' });
      prisma.plan.findMany = vi.fn().mockResolvedValue([{ id: 'plan-1' }]);

      const result = await service.getRecommendationSummary(
        'input-123',
        'session-123',
      );
      expect(result.ai_summary_comment).toBe('AI Summary Response');

      process.env.NODE_ENV = originalEnv;
    });

    it('should throw ServiceUnavailableException if Gemini API fails', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development'; // Wait, production will bypass mock

      (service as any).genAI = {
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: vi.fn().mockRejectedValue(new Error('API Error')),
        }),
      };

      prisma.inputSession.findUnique = vi
        .fn()
        .mockResolvedValue({ sessionId: 'session-123' });
      prisma.plan.findMany = vi.fn().mockResolvedValue([]);

      await expect(
        service.getRecommendationSummary('input-123', 'session-123'),
      ).rejects.toThrowError(ServiceUnavailableException);

      process.env.NODE_ENV = originalEnv;
    });
  });
});
