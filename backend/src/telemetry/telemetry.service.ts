import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { XMLParser } from 'fast-xml-parser';

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

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
   * 외부 API를 호출하여 요금제 데이터를 가져오는 메서드
   * @param targetCaseId 환경 변수나 매개변수로 전달된 타겟 설정
   */
  async fetchData(targetCaseId: string): Promise<any> {
    const apiUrl = process.env.EXTERNAL_PLAN_API_URL;
    const apiKey = process.env.EXTERNAL_PLAN_API_KEY;
    
    // 외부 API URL이 정의되어 있지 않은 경우 기존 Mock 데이터를 사용 (하위 호환 및 테스트 목적)
    if (!apiUrl) {
      this.logger.warn('[Ingest] EXTERNAL_PLAN_API_URL is not set. Falling back to mock data.');
      const mockFilePath = path.join(process.cwd(), '../antigravity/mocks/epost_mvno_mock.json');
      if (!fs.existsSync(mockFilePath)) {
        throw new Error(`Mock file not found at ${mockFilePath}`);
      }

      const mockFileContent = fs.readFileSync(mockFilePath, 'utf-8');
      const mockData = JSON.parse(mockFileContent);
      const selectedCase = mockData.mocks.find((m: any) => m.case_id === targetCaseId);

      if (!selectedCase) {
        throw new Error(`Mock case not found: ${targetCaseId}`);
      }

      if (selectedCase.status === 'ERROR') {
        this.logger.error(`[Ingest] Mock API Error occurred. HTTP Status: ${selectedCase.http_status}`);
        throw new Error(`API_ERROR: ${selectedCase.response_data.message || 'Unknown error'}`);
      }

      return selectedCase;
    }

    // 실제 외부 API 호출 로직
    this.logger.log(`[Ingest] Fetching data from external API: ${apiUrl}`);
    try {
      // 공공데이터포털 규격에 맞춰 ServiceKey를 URL Query 파라미터로 부착
      const requestUrl = apiKey ? `${apiUrl}?ServiceKey=${apiKey}` : apiUrl;

      const response = await firstValueFrom(
        this.httpService.get(requestUrl, {
          timeout: 10000, // 10초 타임아웃
          headers: {
            'Accept': 'application/xml, text/xml, */*',
          },
          responseType: 'text', // XML 응답을 텍스트로 처리
        })
      );
      
      // fast-xml-parser를 이용한 파싱
      const parser = new XMLParser({
        ignoreAttributes: false,
        parseAttributeValue: true,
      });
      const parsedData = parser.parse(response.data);
      
      // XML 규격 매핑: AlddlChargeResponse -> alddlCharge 배열
      const root = parsedData.AlddlChargeResponse;
      if (!root || !root.cmmMsgHeader || root.cmmMsgHeader.successYN !== 'Y') {
        throw new Error(`API Response Error or Invalid Format: ${JSON.stringify(root?.cmmMsgHeader || 'Unknown')}`);
      }

      let rawPlans = root.alddlCharge || [];
      // 결과가 단건일 경우 객체로 반환되므로 배열 정규화 처리
      if (!Array.isArray(rawPlans)) {
        rawPlans = [rawPlans];
      }
      
      // DB가 요구하는 JSON (plans) 포맷으로 매핑
      const mappedPlans = rawPlans.map((item: any) => ({
        carrier: item.telecomName,
        plan_name: item.chargeName,
        network_type: item.telecomGenerationType,
        base_fee: String(item.chargeAmount || 0),
        data_allowance_gb: String(item.dataAmount || 0), // (MB 단위이나 기존 DB 컬럼 명칭 유지)
        voice_allowance_min: String(item.voiceAmount || 0),
        raw_description: JSON.stringify(item),
      }));

      return {
        status: 'SUCCESS',
        http_status: response.status,
        response_data: {
          total_count: mappedPlans.length,
          plans: mappedPlans
        }
      };
    } catch (error) {
      this.logger.error(`[Ingest] External API Error occurred: ${error.message}`);
      throw new Error(`API_ERROR: ${error.message}`);
    }
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

    // 변경된 내용만 업데이트(Upsert)하는 로직으로 개편 (DB I/O 및 다운타임 방지)
    // 파이프라인 구동 시 예기치 못한 크러시가 발생해도 데이터가 오염되지 않도록 트랜잭션 사용
    await this.prisma.$transaction(async (tx) => {
      for (const plan of plans) {
        const carrier = plan.carrier || '';
        const planName = plan.plan_name || '';

        await tx.plan.upsert({
          where: {
            carrier_planName: {
              carrier,
              planName,
            },
          },
          update: {
            networkType: plan.network_type || '',
            rawPlanDescription: JSON.stringify(plan),
          },
          create: {
            carrier,
            planName,
            networkType: plan.network_type || '',
            baseFee: 0, // transform 단계에서 파싱하여 업데이트할 것이므로 기본값 설정
            dataAllowanceGb: 0,
            voiceAllowanceMin: 0,
            rawPlanDescription: JSON.stringify(plan),
          },
        });
      }
    });

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
        // throw error; // 에러가 발생해도 중단하지 않고 다음 요금제 처리 진행 (배치 로깅 형태)
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
