import { Test, TestingModule } from '@nestjs/testing';
import { CrawlerService } from './crawler.service';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { of, throwError } from 'rxjs';

describe('CrawlerService', () => {
  let crawlerService: CrawlerService;
  let httpService: HttpService;
  let prismaService: PrismaService;

  // Mock Data: 우체국 알뜰폰 요금제 HTML 구조 모방
  const mockHtmlContent = `
    <html>
      <body>
        <div class="alddl_charge_list">
          <li onclick="goChoicePhoneCharge('N', 'C0018', 'C03', '99', '')">
            <strong class="tit">테스트 요금제 A</strong>
            <span>기본료 0원</span>
          </li>
          <li onclick="jsSelectChargeOrder('C0019', 'S01', '100')">
            <strong class="tit">테스트 요금제 B</strong>
            <span>기본료 1000원</span>
          </li>
        </div>
      </body>
    </html>
  `;

  const mockDbPlans = [
    { id: 1, planName: '테스트 요금제 A', planUrl: null },
    { id: 2, planName: '테스트 요금제 B', planUrl: null },
    { id: 3, planName: '매칭 안 되는 요금제', planUrl: null },
  ];

  beforeEach(async () => {
    // 1. Mock 설정 (독립성 보장)
    const mockHttpService = {
      get: vi.fn(),
    };

    const mockPrismaService = {
      plan: {
        findMany: vi.fn(),
        update: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrawlerService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    crawlerService = module.get<CrawlerService>(CrawlerService);
    httpService = module.get<HttpService>(HttpService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('updatePlanUrls (성공 케이스)', () => {
    it('HTML에서 요금제 정보를 파싱하여 DB를 업데이트해야 한다 (단일 검증: 정상 파싱 및 매핑)', async () => {
      // Arrange (준비)
      vi.spyOn(httpService, 'get').mockReturnValue(
        of({ data: mockHtmlContent, status: 200, statusText: 'OK', headers: {}, config: {} as any }),
      );
      vi.spyOn(prismaService.plan, 'findMany').mockResolvedValue(mockDbPlans as any);
      vi.spyOn(prismaService.plan, 'update').mockResolvedValue(null as any);

      // Act (실행)
      const result = await crawlerService.updatePlanUrls();

      // Assert (검증)
      // 총 2개의 요금제가 크롤링되고 매칭되어 업데이트 되어야 함
      expect(result.totalScraped).toBe(2);
      expect(result.updated).toBe(2);
      expect(result.failed).toBe(0);

      // Prisma update가 올바른 URL 파라미터로 호출되었는지 확인
      expect(prismaService.plan.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          planUrl: 'https://www.epost.go.kr/comm.alddlord.RetrieveChargeDtl.comm?phonepaydivcd=N&bizcd=C0018&srch_telecomcd=C03&charge_idn=99',
        },
      });

      expect(prismaService.plan.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: {
          planUrl: 'https://www.epost.go.kr/comm.alddlord.RetrieveChargeDtl.comm?phonepaydivcd=N&bizcd=C0019&srch_telecomcd=S01&charge_idn=100',
        },
      });
    });
  });

  describe('updatePlanUrls (에러 케이스)', () => {
    it('외부 네트워크 통신 실패 시 에러를 던져야 한다 (단일 검증: 네트워크 에러)', async () => {
      // Arrange (준비)
      const networkError = new Error('Network timeout');
      vi.spyOn(httpService, 'get').mockReturnValue(throwError(() => networkError));

      // Act & Assert (실행 및 검증)
      await expect(crawlerService.updatePlanUrls()).rejects.toThrow('Network timeout');
      
      // 통신 실패 시 DB 쿼리는 실행되지 않아야 함
      expect(prismaService.plan.findMany).not.toHaveBeenCalled();
    });

    it('DB 업데이트 중 일부 실패가 발생하더라도 전체 프로세스는 완료되어야 한다 (단일 검증: DB 에러 복원력)', async () => {
      // Arrange (준비)
      vi.spyOn(httpService, 'get').mockReturnValue(
        of({ data: mockHtmlContent, status: 200, statusText: 'OK', headers: {}, config: {} as any }),
      );
      vi.spyOn(prismaService.plan, 'findMany').mockResolvedValue(mockDbPlans as any);
      
      // id가 1인 경우 정상, 2인 경우 에러 발생 모사
      vi.spyOn(prismaService.plan, 'update').mockImplementation(async (args) => {
        if ((args as any).where.id === 2) {
          throw new Error('DB connection lost');
        }
        return null as any;
      });

      // Act (실행)
      const result = await crawlerService.updatePlanUrls();

      // Assert (검증)
      expect(result.totalScraped).toBe(2);
      expect(result.updated).toBe(1); // 1개 성공
      expect(result.failed).toBe(1);  // 1개 실패
    });
  });
});
