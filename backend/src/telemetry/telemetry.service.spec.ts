import { Test, TestingModule } from '@nestjs/testing';
import { TelemetryService } from './telemetry.service';
import { PrismaService } from '../prisma/prisma.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpService } from '@nestjs/axios';

// PrismaService Mocking
const mockPrismaService = {
  $transaction: vi.fn(async (cb) => {
    return cb(mockPrismaService);
  }),
  plan: {
    deleteMany: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
  },
};

// HttpService Mocking
const mockHttpService = {
  get: vi.fn(),
};

describe('TelemetryService', () => {
  let service: TelemetryService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelemetryService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<TelemetryService>(TelemetryService);
  });

  describe('ingest', () => {
    it('MOCK_CASE_01_SUCCESS가 주어지면 정상적으로 Plan 1차 덤프를 생성해야 한다', async () => {
      mockPrismaService.plan.upsert.mockResolvedValue({ id: 1 } as any);

      const result = await service.ingest('MOCK_CASE_01_SUCCESS');

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.plan.upsert).toHaveBeenCalledTimes(2);
    });

    it('API 에러 발생 시 최대 3회까지 지수 백오프(Retry & Backoff) 로직이 작동해야 한다', async () => {
      vi.useFakeTimers();
      
      // fetchData 메서드를 스파이하여 처음 2번은 실패, 3번째는 성공하도록 모킹
      const fetchSpy = vi.spyOn(service as any, 'fetchData')
        .mockRejectedValueOnce(new Error('API_ERROR'))
        .mockRejectedValueOnce(new Error('API_ERROR'))
        .mockResolvedValueOnce({
          status: 'SUCCESS',
          response_data: { plans: [{ carrier: 'SKT', plan_name: 'TEST' }] }
        });

      mockPrismaService.plan.upsert.mockResolvedValue({ id: 1 } as any);

      // ingest를 실행 (await 없이 Promise 저장)
      const ingestPromise = service.ingest('MOCK_CASE_RETRY');

      // 1. 처음 호출 시도 후 실패, 2초(2000ms) 대기
      await vi.advanceTimersByTimeAsync(2000); 

      // 2. 두 번째 호출 시도 후 실패, 4초(4000ms) 대기 (지수 백오프)
      await vi.advanceTimersByTimeAsync(4000);

      const result = await ingestPromise;
      
      expect(result.success).toBe(true);
      expect(fetchSpy).toHaveBeenCalledTimes(3);
      
      vi.useRealTimers();
    });

    it('MOCK_CASE_02_API_SERVER_DOWN 에러 케이스가 주어지면 최대 재시도 횟수를 초과하여 결국 예외를 발생시켜야 한다', async () => {
      vi.useFakeTimers();
      
      const fetchSpy = vi.spyOn(service as any, 'fetchData')
        .mockRejectedValue(new Error('API_ERROR')); // 계속 실패

      const ingestPromise = service.ingest('MOCK_CASE_02_API_SERVER_DOWN');
      const catchPromise = ingestPromise.catch(e => e); // unhandled rejection 방지
      
      await vi.advanceTimersByTimeAsync(2000); // 1차 재시도
      await vi.advanceTimersByTimeAsync(4000); // 2차 재시도
      await vi.advanceTimersByTimeAsync(8000); // 3차 재시도 (최대치 초과)
      await vi.runAllTimersAsync();

      const error = await catchPromise;
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain('API_ERROR');
      
      expect(fetchSpy).toHaveBeenCalledTimes(4); // 초기 1회 + 재시도 3회
      
      vi.useRealTimers();
    });
  });

  describe('transform', () => {
    it('지저분한 문자열(Dirty Data)을 포함한 원본 데이터를 올바른 정수 타입으로 파싱하여 업데이트해야 한다', async () => {
      const dirtyPlan = {
        id: 1,
        carrier: 'LGU_PLUS',
        planName: '속도 용량 걱정 없는 데이터 하프(MOCK_BUG_DATA)',
        networkType: 'LTE',
        baseFee: 0,
        dataAllowanceGb: 0,
        voiceAllowanceMin: 0,
        rawPlanDescription: JSON.stringify({
          carrier: 'LGU_PLUS',
          plan_name: '속도 용량 걱정 없는 데이터 하프(MOCK_BUG_DATA)',
          network_type: 'LTE',
          base_fee: '69,000원(부가세포함)',
          data_allowance_gb: '매일5GB+소진시5Mbps',
          voice_allowance_min: '집/이동전화 무제한(영상/부가300분)',
          raw_description: '지저분한 레거시 문자열 포맷 예시',
        }),
      };

      mockPrismaService.plan.findMany.mockResolvedValue([dirtyPlan]);
      mockPrismaService.plan.update.mockResolvedValue({ id: 1 } as any);

      const result = await service.transform();

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);

      // 정밀 파싱 확인
      expect(mockPrismaService.plan.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          carrier: 'LGU_PLUS',
          planName: '속도 용량 걱정 없는 데이터 하프(MOCK_BUG_DATA)',
          networkType: 'LTE',
          baseFee: 69000,          // 69,000원(부가세포함) -> 69000
          dataAllowanceGb: 5,      // 매일5GB+소진시5Mbps -> 5
          voiceAllowanceMin: 9999,  // 집/이동전화 무제한... -> 9999
        },
      });
    });

    it('일반 정상 데이터(SUCCESS)를 올바르게 파싱 및 정제하여 업데이트해야 한다', async () => {
      const normalPlan = {
        id: 2,
        carrier: 'SKT',
        planName: '5G 다이렉트 45',
        networkType: '5G',
        baseFee: 0,
        dataAllowanceGb: 0,
        voiceAllowanceMin: 0,
        rawPlanDescription: JSON.stringify({
          carrier: 'SKT',
          plan_name: '5G 다이렉트 45',
          network_type: '5G',
          base_fee: 45000,
          data_allowance_gb: 50,
          voice_allowance_min: 9999,
          raw_description: '음성 문자 무제한',
        }),
      };

      mockPrismaService.plan.findMany.mockResolvedValue([normalPlan]);
      mockPrismaService.plan.update.mockResolvedValue({ id: 2 } as any);

      const result = await service.transform();

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(mockPrismaService.plan.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: {
          carrier: 'SKT',
          planName: '5G 다이렉트 45',
          networkType: '5G',
          baseFee: 45000,
          dataAllowanceGb: 50,
          voiceAllowanceMin: 9999,
        },
      });
    });
  });

  describe('handleDailyPipeline', () => {
    it('크론 스케줄링 시 ingest와 transform이 순서대로 호출되어야 한다', async () => {
      const ingestSpy = vi.spyOn(service, 'ingest').mockResolvedValue({ success: true, count: 2 });
      const transformSpy = vi.spyOn(service, 'transform').mockResolvedValue({ success: true, count: 2 });

      await service.handleDailyPipeline();

      expect(ingestSpy).toHaveBeenCalledTimes(1);
      expect(transformSpy).toHaveBeenCalledTimes(1);
    });

    it('ingest 단계에서 에러 발생 시 transform은 호출되지 않아야 한다', async () => {
      const ingestSpy = vi.spyOn(service, 'ingest').mockRejectedValue(new Error('Ingest Error'));
      const transformSpy = vi.spyOn(service, 'transform');

      await service.handleDailyPipeline();

      expect(ingestSpy).toHaveBeenCalledTimes(1);
      expect(transformSpy).not.toHaveBeenCalled();
    });
  });
});
