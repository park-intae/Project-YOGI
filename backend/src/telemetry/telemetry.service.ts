import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 매일 새벽 4시에 실행되어 원천 데이터를 수집(Ingest)하고 정제(Transform)하는 크론 배치 파이프라인입니다.
   */
  @Cron('0 4 * * *')
  async handleDailyPipeline() {
    this.logger.log('[Cron Pipeline] Daily Telemetry pipeline started at 04:00.');
    try {
      // 1. Ingest (기본 케이스를 사용하거나 환경 변수에 따른 케이스 수행)
      await this.ingest();
      
      // 2. Transform
      await this.transform();
      
      this.logger.log('[Cron Pipeline] Daily Telemetry pipeline completed successfully.');
    } catch (error) {
      this.logger.error(`[Cron Pipeline] Daily Telemetry pipeline failed. Error: ${error.message}`);
    }
  }

  /**
   * 외부 API 호출을 모사(Mock)하는 메서드
   * @param targetCaseId 시뮬레이션할 Mock Case ID
   */
  async fetchData(targetCaseId: string): Promise<any> {
    const mockFilePath = path.join(process.cwd(), '../antigravity/mocks/smartchoice_mock.json');
    if (!fs.existsSync(mockFilePath)) {
      throw new Error(`Mock file not found at ${mockFilePath}`);
    }

    const mockFileContent = fs.readFileSync(mockFilePath, 'utf-8');
    const mockData = JSON.parse(mockFileContent);
    const selectedCase = mockData.mocks.find((m: any) => m.case_id === targetCaseId);

    if (!selectedCase) {
      throw new Error(`Mock case not found: ${targetCaseId}`);
    }

    // 2. 에러 케이스 처리 (지수 백오프 테스트를 유발하기 위해 에러를 고의로 발생시킴)
    if (selectedCase.status === 'ERROR') {
      this.logger.error(`[Ingest] Mock API Error occurred. HTTP Status: ${selectedCase.http_status}`);
      throw new Error(`API_ERROR: ${selectedCase.response_data.message || 'Unknown error'}`);
    }

    return selectedCase;
  }

  /**
   * 외부 API 또는 Mock 데이터를 호출하여 raw_plan_description을 DB에 1차 덤프합니다.
   * @param mockCaseId 시뮬레이션할 Mock Case ID
   */
  async ingest(mockCaseId?: string) {
    this.logger.log(`[Ingest] Starting ingestion. CaseID: ${mockCaseId || 'DEFAULT'}`);

    const targetCaseId = mockCaseId || process.env.MOCK_CASE || 'MOCK_CASE_01_SUCCESS';

    let selectedCase: any = null;
    let attempt = 0;
    const maxRetries = 3;
    let delay = 2000;

    while (attempt <= maxRetries) {
      try {
        selectedCase = await this.fetchData(targetCaseId);
        break; // 성공 시 루프 탈출
      } catch (error) {
        if (error.message.includes('API_ERROR') && attempt < maxRetries) {
          attempt++;
          this.logger.warn(`[Ingest] API_ERROR occurred. Retrying in ${delay}ms... (Attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // 지수 백오프 (2초 -> 4초 -> 8초)
        } else {
          throw error; // 최대 재시도 초과 시 에러 던짐
        }
      }
    }

    // 3. raw_plan_description 1차 적재
    const plans = selectedCase.response_data.plans;
    if (!plans || !Array.isArray(plans)) {
      throw new Error('Invalid plans data structure in response.');
    }

    // 기존 Plan 데이터를 비우고 새로운 데이터를 적재
    await this.prisma.plan.deleteMany({});

    for (const plan of plans) {
      // 덤프 단계이므로, 파싱되지 않은 원본 그대로 JSON 직렬화하여 raw_plan_description에 저장
      await this.prisma.plan.create({
        data: {
          carrier: plan.carrier || '',
          planName: plan.plan_name || '',
          networkType: plan.network_type || '',
          baseFee: 0, // transform 단계에서 파싱하여 업데이트할 것이므로 기본값 설정
          dataAllowanceGb: 0,
          voiceAllowanceMin: 0,
          rawPlanDescription: JSON.stringify(plan), // 원천 데이터 백업
        },
      });
    }

    this.logger.log(`[Ingest] Successfully ingested ${plans.length} raw plans into database.`);
    return { success: true, count: plans.length };
  }

  /**
   * DB의 raw_plan_description 필드를 읽어 정밀 파싱 후 요금제 정보를 정제(Transform)하여 컬럼을 업데이트합니다.
   */
  async transform() {
    this.logger.log('[Transform] Starting parsing and transforming raw plans.');

    const plans = await this.prisma.plan.findMany({});
    let updatedCount = 0;

    for (const plan of plans) {
      try {
        const rawObj = JSON.parse(plan.rawPlanDescription);
        
        // 1. base_fee 정제
        const baseFeeRaw = rawObj.base_fee;
        const baseFee = this.parseBaseFee(baseFeeRaw);

        // 2. data_allowance_gb 정제
        const dataRaw = rawObj.data_allowance_gb;
        const dataAllowanceGb = this.parseDataAllowance(dataRaw);

        // 3. voice_allowance_min 정제
        const voiceRaw = rawObj.voice_allowance_min;
        const voiceAllowanceMin = this.parseVoiceAllowance(voiceRaw);

        // 4. DB 업데이트
        await this.prisma.plan.update({
          where: { id: plan.id },
          data: {
            carrier: rawObj.carrier || plan.carrier,
            planName: rawObj.plan_name || plan.planName,
            networkType: rawObj.network_type || plan.networkType,
            baseFee,
            dataAllowanceGb,
            voiceAllowanceMin,
          },
        });

        updatedCount++;
      } catch (error) {
        this.logger.error(`[Transform] Failed to transform plan ID: ${plan.id}. Error: ${error.message}`);
        throw error;
      }
    }

    this.logger.log(`[Transform] Successfully updated ${updatedCount} plans.`);
    return { success: true, count: updatedCount };
  }

  private parseBaseFee(val: any): number {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      // "69,000원(부가세포함)" -> 69000
      const digits = val.replace(/[^0-9]/g, '');
      const parsed = parseInt(digits, 10);
      if (!isNaN(parsed)) return parsed;
    }
    return 0;
  }

  private parseDataAllowance(val: any): number {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      if (val.includes('무제한')) return 9999;
      // "매일5GB+소진시5Mbps" -> 5
      // "50GB" -> 50
      const match = val.match(/([0-9.]+)\s*GB/i);
      if (match) {
        const parsed = parseFloat(match[1]);
        if (!isNaN(parsed)) return parsed;
      }
      // 숫자만 추출 시도
      const digits = val.replace(/[^0-9.]/g, '');
      const parsed = parseFloat(digits);
      if (!isNaN(parsed)) return parsed;
    }
    return 0;
  }

  private parseVoiceAllowance(val: any): number {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      if (val.includes('무제한')) return 9999;
      // "집/이동전화 무제한(영상/부가300분)" -> 기본 무제한이므로 9999로 매핑
      const match = val.match(/([0-9]+)\s*분/);
      if (match) {
        const parsed = parseInt(match[1], 10);
        if (!isNaN(parsed)) return parsed;
      }
      const digits = val.replace(/[^0-9]/g, '');
      const parsed = parseInt(digits, 10);
      if (!isNaN(parsed)) return parsed;
    }
    return 0;
  }
}
