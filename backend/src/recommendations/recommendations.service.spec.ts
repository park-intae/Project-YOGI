import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationsService } from './recommendations.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ConfigService } from '@nestjs/config';

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

  it('should throw BadRequestException if both userPlan and userDemand are empty', async () => {
    await expect(service.createSession('session-123', {})).rejects.toThrow(BadRequestException);
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
      userDemand: { maxFee: 50000 },
    });

    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
