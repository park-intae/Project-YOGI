import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationsService } from './recommendations.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
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
    await expect(service.createSession('session-123', { input_type: 'BOTH' })).rejects.toThrow(BadRequestException);
  });

  it('should call prisma.$transaction when valid dto is provided', async () => {
    const mockTx = vi.fn().mockResolvedValue({ id: 'input-123' });
    vi.spyOn(prisma, '$transaction').mockImplementation(async (cb) => {
      return cb({
        inputSession: { create: vi.fn().mockResolvedValue({ id: 'input-123' }), findUnique: vi.fn() },
        userPlan: { create: vi.fn() },
        userDemand: { create: vi.fn() },
      } as any);
    });

    await service.createSession('session-123', {
      input_type: 'DEMAND',
      demand_condition: { max_budget: 50000 },
    });

    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('should create userPlan when current_plan is provided', async () => {
    vi.spyOn(prisma, '$transaction').mockImplementation(async (cb) => {
      const mockTx = {
        inputSession: { create: vi.fn().mockResolvedValue({ id: 'input-123' }), findUnique: vi.fn() },
        userPlan: { create: vi.fn() },
        userDemand: { create: vi.fn() },
      };
      await cb(mockTx as any);
      expect(mockTx.userPlan.create).toHaveBeenCalled();
      return { id: 'input-123' };
    });

    await service.createSession('session-123', {
      input_type: 'PLAN',
      current_plan: { actual_carrier: 'SKT', actual_plan_name: '5G', actual_monthly_fee: 50000, actual_data_usage: 10, actual_voice_usage: 100 },
    });
  });

  describe('getRecommendationsPrompt', () => {
    it('should throw NotFoundException if session not found', async () => {
      prisma.inputSession = { findUnique: vi.fn().mockResolvedValue(null) } as any;
      await expect(service.getRecommendationsPrompt('invalid', 'session-123')).rejects.toThrow('Session data not found');
    });

    it('should throw ForbiddenException if session ID mismatch', async () => {
      prisma.inputSession = { findUnique: vi.fn().mockResolvedValue({ sessionId: 'other-session' }) } as any;
      await expect(service.getRecommendationsPrompt('input-123', 'session-123')).rejects.toThrow('Forbidden. Session ID mismatch.');
    });

    it('should return mock fallback in test mode', async () => {
      prisma.inputSession = { findUnique: vi.fn().mockResolvedValue({ sessionId: 'session-123', userDemand: { maxFee: 50000 } }) } as any;
      prisma.plan = { findMany: vi.fn().mockResolvedValue([{ id: 'plan-1' }]) } as any;

      const result = await service.getRecommendationsPrompt('input-123', 'session-123');
      expect(result).toHaveProperty('ai_summary_comment');
      expect(result.recommended_plans.length).toBeGreaterThan(0);
    });

    it('should call Gemini API when not in test mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      // Mock genAI
      (service as any).genAI = {
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify({ ai_summary_comment: 'AI Response', recommended_plans: [] })
            }
          })
        })
      };

      prisma.inputSession = { findUnique: vi.fn().mockResolvedValue({ sessionId: 'session-123', userPlan: { carrier: 'SKT' } }) } as any;
      prisma.plan = { findMany: vi.fn().mockResolvedValue([]) } as any;

      const result = await service.getRecommendationsPrompt('input-123', 'session-123');
      expect(result.ai_summary_comment).toBe('AI Response');

      process.env.NODE_ENV = originalEnv;
    });

    it('should throw ServiceUnavailableException if Gemini API fails', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      (service as any).genAI = {
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: vi.fn().mockRejectedValue(new Error('API Error'))
        })
      };

      prisma.inputSession = { findUnique: vi.fn().mockResolvedValue({ sessionId: 'session-123' }) } as any;
      prisma.plan = { findMany: vi.fn().mockResolvedValue([]) } as any;

      await expect(service.getRecommendationsPrompt('input-123', 'session-123')).rejects.toThrowError('AI 분석 시간이 초과되었거나 실패했습니다');

      process.env.NODE_ENV = originalEnv;
    });
    
    it('should correctly map plan_url from candidate plans', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      (service as any).genAI = {
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify({ ai_summary_comment: 'AI Response', recommended_plans: [{ plan_id: 'plan-1', rank: 1 }] })
            }
          })
        })
      };

      prisma.inputSession = { findUnique: vi.fn().mockResolvedValue({ sessionId: 'session-123' }) } as any;
      prisma.plan = { findMany: vi.fn().mockResolvedValue([{ id: 'plan-1', planUrl: 'http://test.com' }]) } as any;

      const result = await service.getRecommendationsPrompt('input-123', 'session-123');
      expect(result.recommended_plans[0].plan_url).toBe('http://test.com');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('getMoreRecommendationsPrompt', () => {
    it('should throw NotFoundException if session not found', async () => {
      prisma.inputSession = { findUnique: vi.fn().mockResolvedValue(null) } as any;
      await expect(service.getMoreRecommendationsPrompt('invalid', 'session-123', [])).rejects.toThrow('Session data not found');
    });

    it('should throw ForbiddenException if session ID mismatch', async () => {
      prisma.inputSession = { findUnique: vi.fn().mockResolvedValue({ sessionId: 'other-session' }) } as any;
      await expect(service.getMoreRecommendationsPrompt('input-123', 'session-123', [])).rejects.toThrow('Forbidden. Session ID mismatch.');
    });

    it('should return mock fallback in test mode', async () => {
      prisma.inputSession = { findUnique: vi.fn().mockResolvedValue({ sessionId: 'session-123' }) } as any;
      prisma.plan = { findMany: vi.fn().mockResolvedValue([{ id: 'plan-1', planName: 'P1' }]) } as any;

      const result = await service.getMoreRecommendationsPrompt('input-123', 'session-123', []);
      expect(result.ai_summary_comment).toContain('임시 추가 데이터');
      expect(result.recommended_plans.length).toBe(1);
    });

    it('should return empty result if no additional candidates are found', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      prisma.inputSession = { findUnique: vi.fn().mockResolvedValue({ sessionId: 'session-123' }) } as any;
      prisma.plan = { findMany: vi.fn().mockResolvedValue([{ id: 'plan-1' }]) } as any;

      const result = await service.getMoreRecommendationsPrompt('input-123', 'session-123', ['plan-1']);
      expect(result.recommended_plans.length).toBe(0);
      expect(result.ai_summary_comment).toBe('더 이상 추천할 수 있는 요금제가 없습니다.');

      process.env.NODE_ENV = originalEnv;
    });

    it('should call Gemini API for more recommendations', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      (service as any).genAI = {
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify({ ai_summary_comment: 'More AI Response', recommended_plans: [{ plan_id: 'plan-2', rank: 4 }] })
            }
          })
        })
      };

      prisma.inputSession = { findUnique: vi.fn().mockResolvedValue({ sessionId: 'session-123' }) } as any;
      prisma.plan = { findMany: vi.fn().mockResolvedValue([{ id: 'plan-1' }, { id: 'plan-2', planUrl: 'http://more.com' }]) } as any;

      const result = await service.getMoreRecommendationsPrompt('input-123', 'session-123', ['plan-1']);
      expect(result.ai_summary_comment).toBe('More AI Response');
      expect(result.recommended_plans[0].plan_url).toBe('http://more.com');

      process.env.NODE_ENV = originalEnv;
    });

    it('should throw ServiceUnavailableException if Gemini API fails for more recommendations', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      (service as any).genAI = {
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: vi.fn().mockRejectedValue(new Error('API Error'))
        })
      };

      prisma.inputSession = { findUnique: vi.fn().mockResolvedValue({ sessionId: 'session-123' }) } as any;
      prisma.plan = { findMany: vi.fn().mockResolvedValue([{ id: 'plan-2' }]) } as any;

      await expect(service.getMoreRecommendationsPrompt('input-123', 'session-123', [])).rejects.toThrowError('AI 분석 시간이 초과되었거나 실패했습니다');

      process.env.NODE_ENV = originalEnv;
    });
  });
});
