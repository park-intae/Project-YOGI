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

  describe('calculatePlanScore & Weighted Multi-Factor Ranking', () => {
    it('should rank a data-sufficient plan higher than an ultra-cheap data-starved plan for a heavy data user', async () => {
      prisma.inputSession.findUnique = vi.fn().mockResolvedValue({
        id: 'input-heavy',
        sessionId: 'session-123',
        userPlan: {
          baseFee: 69000,
          dataAllowanceGb: 50,
          voiceAllowanceMin: 300,
        },
        userDemand: {
          maxFee: 45000,
        },
      });

      // DB에서 기본료 오름차순으로 반환된 후보군 (1GB 초저가 vs 50GB 적정가 vs 50GB 고가)
      prisma.plan.findMany = vi.fn().mockResolvedValue([
        {
          id: 1,
          carrier: '알뜰A',
          baseNetwork: 'KT망',
          planName: '초저가 1GB',
          baseFee: 3000,
          dataAllowanceGb: 1,
          voiceAllowanceMin: 100,
        },
        {
          id: 2,
          carrier: '알뜰B',
          baseNetwork: 'KT망',
          planName: '데이터 50GB 안심',
          baseFee: 25000,
          dataAllowanceGb: 50,
          voiceAllowanceMin: 9999,
        },
        {
          id: 3,
          carrier: '알뜰C',
          baseNetwork: 'KT망',
          planName: '프리미엄 50GB',
          baseFee: 44000,
          dataAllowanceGb: 50,
          voiceAllowanceMin: 9999,
        },
      ]);

      const result = await service.getRecommendationsData(
        'input-heavy',
        'session-123',
      );

      expect(result.recommended_plans).toHaveLength(3);
      // 단순 최저가(3,000원, 1GB)가 아닌 데이터 50GB 충족 + 가성비 요금제(id: 2)가 1위여야 함
      expect(result.recommended_plans[0].plan_id).toBe('2');
      expect(result.recommended_plans[1].plan_id).toBe('3');
      expect(result.recommended_plans[2].plan_id).toBe('1');
    });

    it('Edge Case 1: should normalize unlimited values (-1 and 9999) properly without overflowing', () => {
      const userPlan = {
        baseFee: 65000,
        dataAllowanceGb: -1, // 무제한(-1)
        voiceAllowanceMin: -1, // 무제한(-1)
      };
      const unlimitedPlan = {
        baseFee: 33000,
        dataAllowanceGb: 9999, // 무제한(9999)
        voiceAllowanceMin: 9999,
      };
      const limitedPlan = {
        baseFee: 33000,
        dataAllowanceGb: 10,
        voiceAllowanceMin: 100,
      };

      const unlimitedScore = service.calculatePlanScore(
        unlimitedPlan,
        userPlan,
      );
      const limitedScore = service.calculatePlanScore(limitedPlan, userPlan);

      expect(unlimitedScore).toBeGreaterThan(limitedScore);
      expect(unlimitedScore).toBeLessThanOrEqual(100);
    });

    it('Edge Case 2: should safely handle null, undefined, or malformed string fields without NaN', () => {
      const brokenPlan = {
        id: 99,
        baseFee: null,
        dataAllowanceGb: 'invalid_number',
        voiceAllowanceMin: undefined,
      };
      const brokenUserPlan = {
        baseFee: undefined,
        dataAllowanceGb: null,
        voiceAllowanceMin: 'NaN',
      };

      const score = service.calculatePlanScore(
        brokenPlan,
        brokenUserPlan,
        null,
      );
      expect(Number.isNaN(score)).toBe(false);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('Edge Case 3: should work with DEMAND-only session and break score ties by lower baseFee', async () => {
      prisma.inputSession.findUnique = vi.fn().mockResolvedValue({
        id: 'input-demand-only',
        sessionId: 'session-123',
        userPlan: null,
        userDemand: {
          maxFee: 30000,
          minDataGb: 15,
          minVoiceMin: 200,
        },
      });

      prisma.plan.findMany = vi.fn().mockResolvedValue([
        {
          id: 10,
          carrier: '알뜰X',
          planName: '요금제X',
          baseFee: 15000,
          dataAllowanceGb: 15,
          voiceAllowanceMin: 200,
        },
        {
          id: 11,
          carrier: '알뜰Y',
          planName: '요금제Y',
          baseFee: 20000,
          dataAllowanceGb: 15,
          voiceAllowanceMin: 200,
        },
      ]);

      const result = await service.getRecommendationsData(
        'input-demand-only',
        'session-123',
      );
      expect(result.recommended_plans[0].plan_id).toBe('10');
      expect(result.recommended_plans[1].plan_id).toBe('11');
    });
  });
});
