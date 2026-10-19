import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import { getCarrierFilter } from '../common/utils/carrier.util';

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);
  private genAI!: GoogleGenerativeAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const apiKey =
      this.configService.get<string>('GEMINI_API_KEY') ||
      process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      this.logger.warn(
        'GEMINI_API_KEY is missing! Initialized with mock mode.',
      );
    }
  }

  async createSession(sessionId: string, dto: CreateSessionDto) {
    if (dto.input_type === 'PLAN' || dto.input_type === 'BOTH') {
      if (!dto.current_plan)
        throw new BadRequestException(
          'current_plan is required for this input_type.',
        );
    }
    if (dto.input_type === 'DEMAND' || dto.input_type === 'BOTH') {
      if (!dto.demand_condition)
        throw new BadRequestException(
          'demand_condition is required for this input_type.',
        );
    }

    return this.prisma.$transaction(async (tx) => {
      const inputSession = await tx.inputSession.create({
        data: {
          sessionId,
        },
      });

      if (dto.current_plan) {
        await tx.userPlan.create({
          data: {
            inputId: inputSession.id,
            carrier: dto.current_plan.actual_carrier,
            baseNetwork: dto.current_plan.actual_base_network || 'UNKNOWN',
            planName: dto.current_plan.actual_plan_name,
            networkType: 'UNKNOWN', // Legacy field fallback
            baseFee: dto.current_plan.actual_monthly_fee,
            dataAllowanceGb: dto.current_plan.actual_data_usage,
            voiceAllowanceMin: dto.current_plan.actual_voice_usage,
          },
        });
      }

      if (dto.demand_condition) {
        await tx.userDemand.create({
          data: {
            inputId: inputSession.id,
            preferredCarrier: dto.demand_condition.preferred_carrier_type,
            preferredBaseNetwork: dto.demand_condition.preferred_base_network,
            preferredNetworkType: dto.demand_condition.preferred_network_type,
            maxFee: dto.demand_condition.max_budget,
            minDataGb: dto.demand_condition.min_data_gb,
            minVoiceMin: dto.demand_condition.min_voice_min,
          },
        });
      }

      return await tx.inputSession.findUnique({
        where: { id: inputSession.id },
        include: {
          userPlan: true,
          userDemand: true,
        },
      });
    });
  }

  /**
   * 데이터 제공량(GB)을 스코어링 연산용 수치로 정규화합니다.
   * 무제한(-1 또는 999 이상)은 150GB 상한선으로 정규화하며, 결측치/음수는 0으로 방어합니다.
   */
  private normalizeDataGb(val: any): number {
    if (val === undefined || val === null) return 0;
    const num = Number(val);
    if (isNaN(num)) return 0;
    if (num === -1 || num >= 999) return 150;
    return Math.max(0, num);
  }

  /**
   * 음성 통화 제공량(분)을 스코어링 연산용 수치로 정규화합니다.
   * 무제한(-1 또는 999 이상)은 1000분 상한선으로 정규화하며, 결측치/음수는 0으로 방어합니다.
   */
  private normalizeVoiceMin(val: any): number {
    if (val === undefined || val === null) return 0;
    const num = Number(val);
    if (isNaN(num)) return 0;
    if (num === -1 || num >= 999) return 1000;
    return Math.max(0, num);
  }

  /**
   * 가중치 기반 다차원 정량 스코어링 엔진 (100점 만점)
   * - 1) 요금 절감 및 예산 효율 (Price & Savings Score): 가중치 45% (최대 45점)
   * - 2) 데이터 제공량 충족도 (Data Fit Score): 가중치 40% (최대 40점)
   * - 3) 음성 통화량 충족도 (Voice Fit Score): 가중치 15% (최대 15점)
   */
  public calculatePlanScore(plan: any, userPlan?: any, demand?: any): number {
    // 1. 요금 절감 및 예산 효율 점수 (최대 45점)
    const planFee = Math.max(0, Number(plan?.baseFee) || 0);
    const userFee = Math.max(0, Number(userPlan?.baseFee) || 0);
    const maxBudget = Math.max(0, Number(demand?.maxFee) || 0);

    const referenceFee =
      userFee > 0 ? userFee : maxBudget > 0 ? maxBudget : 50000;

    let priceScore = 0;
    if (planFee <= referenceFee) {
      const savingsRatio = (referenceFee - planFee) / referenceFee;
      priceScore = 20 + Math.min(1, savingsRatio) * 25;
    } else {
      const overRatio = (planFee - referenceFee) / referenceFee;
      priceScore = Math.max(0, 15 * (1 - overRatio));
    }

    // 2. 데이터 제공량 충족도 점수 (최대 40점)
    const targetDataGb = Math.max(
      this.normalizeDataGb(userPlan?.dataAllowanceGb),
      this.normalizeDataGb(demand?.minDataGb),
    );
    const planDataGb = this.normalizeDataGb(plan?.dataAllowanceGb);

    let dataScore = 0;
    if (targetDataGb > 0) {
      if (planDataGb >= targetDataGb) {
        const bonusRatio = Math.min(
          1,
          (planDataGb - targetDataGb) / Math.max(targetDataGb, 10),
        );
        dataScore = 32 + bonusRatio * 8;
      } else {
        const fitRatio = planDataGb / targetDataGb;
        dataScore = Math.pow(fitRatio, 1.5) * 25;
      }
    } else {
      dataScore = Math.min(1, planDataGb / 50) * 40;
    }

    // 3. 음성 통화량 충족도 점수 (최대 15점)
    const targetVoiceMin = Math.max(
      this.normalizeVoiceMin(userPlan?.voiceAllowanceMin),
      this.normalizeVoiceMin(demand?.minVoiceMin),
    );
    const planVoiceMin = this.normalizeVoiceMin(plan?.voiceAllowanceMin);

    let voiceScore = 0;
    if (targetVoiceMin > 0) {
      if (planVoiceMin >= targetVoiceMin) {
        const bonusRatio = Math.min(
          1,
          (planVoiceMin - targetVoiceMin) / Math.max(targetVoiceMin, 100),
        );
        voiceScore = 12 + bonusRatio * 3;
      } else {
        const fitRatio = planVoiceMin / targetVoiceMin;
        voiceScore = fitRatio * 10;
      }
    } else {
      voiceScore = Math.min(1, planVoiceMin / 300) * 15;
    }

    return Number((priceScore + dataScore + voiceScore).toFixed(2));
  }

  private async getCandidatePlans(demand: any, limit = 15, userPlan?: any) {
    const where: any = { baseFee: { gt: 0 } };

    if (demand?.maxFee)
      where.baseFee = { ...where.baseFee, lte: demand.maxFee };
    if (demand?.preferredCarrier) where.carrier = demand.preferredCarrier;
    if (demand?.preferredBaseNetwork)
      where.baseNetwork = demand.preferredBaseNetwork;
    if (demand?.preferredNetworkType)
      where.networkType = demand.preferredNetworkType;

    const candidates = await this.prisma.plan.findMany({
      where,
      orderBy: { baseFee: 'asc' },
      select: {
        id: true,
        carrier: true,
        baseNetwork: true,
        planName: true,
        baseFee: true,
        dataAllowanceGb: true,
        voiceAllowanceMin: true,
        planUrl: true,
      },
    });

    if (!candidates || candidates.length === 0) {
      return [];
    }

    const scoredCandidates = candidates
      .map((plan) => ({
        plan,
        score: this.calculatePlanScore(plan, userPlan, demand),
      }))
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return (Number(a.plan?.baseFee) || 0) - (Number(b.plan?.baseFee) || 0);
      })
      .map((item) => item.plan);

    return scoredCandidates.slice(0, limit);
  }

  async getRecommendationsData(
    inputId: string,
    sessionId: string,
    isDevMode = false,
  ) {
    const session = await this.prisma.inputSession.findUnique({
      where: { id: inputId },
      include: {
        userPlan: true,
        userDemand: true,
      },
    });

    if (!session) {
      throw new NotFoundException(
        'Session data not found for the given input_id',
      );
    }

    if (session.sessionId !== sessionId) {
      throw new ForbiddenException('Forbidden. Session ID mismatch.');
    }

    const candidatePlans = await this.getCandidatePlans(
      session.userDemand,
      3,
      session.userPlan,
    );
    const userBaseFee = session.userPlan?.baseFee || 0;

    const recommendedPlans = candidatePlans.map((cp, idx) => {
      const expectedSavings = Math.max(0, userBaseFee - cp.baseFee);
      return {
        rank: idx + 1,
        plan_id: cp.id.toString(),
        plan_url: cp.planUrl || null,
        carrier_name: cp.carrier,
        base_network: cp.baseNetwork || '알 수 없음',
        plan_name: cp.planName,
        price: cp.baseFee,
        data_allowance: cp.dataAllowanceGb,
        data_speed_limit: 0,
        expected_savings: expectedSavings,
      };
    });

    return {
      input_id: inputId,
      recommended_at: new Date().toISOString(),
      recommended_plans: recommendedPlans,
    };
  }

  async getMoreRecommendationsData(
    inputId: string,
    sessionId: string,
    excludedIds: string[],
    isDevMode = false,
  ) {
    const session = await this.prisma.inputSession.findUnique({
      where: { id: inputId },
      include: {
        userPlan: true,
        userDemand: true,
      },
    });

    if (!session) {
      throw new NotFoundException(
        'Session data not found for the given input_id',
      );
    }

    if (session.sessionId !== sessionId) {
      throw new ForbiddenException('Forbidden. Session ID mismatch.');
    }

    let candidatePlans = await this.getCandidatePlans(
      session.userDemand,
      15,
      session.userPlan,
    );

    if (excludedIds && excludedIds.length > 0) {
      candidatePlans = candidatePlans.filter(
        (p) => !excludedIds.includes(p.id.toString()),
      );
    }

    const additionalCandidates = candidatePlans.slice(0, 5);

    if (additionalCandidates.length === 0) {
      return {
        input_id: inputId,
        recommended_at: new Date().toISOString(),
        recommended_plans: [],
      };
    }

    const userBaseFee = session.userPlan?.baseFee || 0;

    const recommendedPlans = additionalCandidates.map((cp, idx) => {
      const expectedSavings = Math.max(0, userBaseFee - cp.baseFee);
      return {
        rank: idx + 4, // Just a visual continuation, might not be accurate if excludedIds length differs, but let's keep it simple
        plan_id: cp.id.toString(),
        plan_url: cp.planUrl || null,
        carrier_name: cp.carrier,
        base_network: cp.baseNetwork || '알 수 없음',
        plan_name: cp.planName,
        price: cp.baseFee,
        data_allowance: cp.dataAllowanceGb,
        data_speed_limit: 0,
        expected_savings: expectedSavings,
      };
    });

    return {
      input_id: inputId,
      recommended_at: new Date().toISOString(),
      recommended_plans: recommendedPlans,
    };
  }

  async getRecommendationSummary(
    inputId: string,
    sessionId: string,
    isDevMode = false,
  ) {
    const session = await this.prisma.inputSession.findUnique({
      where: { id: inputId },
      include: {
        userPlan: true,
        userDemand: true,
      },
    });

    if (!session) {
      throw new NotFoundException(
        'Session data not found for the given input_id',
      );
    }

    if (session.sessionId !== sessionId) {
      throw new ForbiddenException('Forbidden. Session ID mismatch.');
    }

    const candidatePlans = await this.getCandidatePlans(
      session.userDemand,
      3,
      session.userPlan,
    );

    if (isDevMode || !this.genAI || process.env.NODE_ENV === 'test') {
      this.logger.warn(
        'Running in Dev/Mock mode or Gemini API key not found. Returning mock summary.',
      );
      return {
        ai_summary_comment:
          'API 키가 없거나 개발(Mock) 모드이므로 임시 요약 멘트를 반환합니다.',
      };
    }

    try {
      const promptPath = path.join(
        process.cwd(),
        '../../antigravity/prompts/recommendation_summary_v1.md',
      );
      let promptTemplate = fs.readFileSync(promptPath, 'utf-8');

      const up = session.userPlan || ({} as any);
      const ud = session.userDemand || ({} as any);

      const compactCandidates = candidatePlans.map((cp) => ({
        planName: cp.planName,
        price: cp.baseFee,
        carrier: cp.carrier,
        dataAllowanceGb: cp.dataAllowanceGb,
        voiceAllowanceMin: cp.voiceAllowanceMin,
      }));

      promptTemplate = promptTemplate
        .replace('{{user_carrier}}', up.carrier || '없음')
        .replace('{{user_plan_name}}', up.planName || '없음')
        .replace('{{user_base_fee}}', up.baseFee?.toString() || '0')
        .replace(
          '{{candidate_plans_json}}',
          JSON.stringify(compactCandidates, null, 2),
        );

      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0,
          responseMimeType: 'application/json',
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              ai_summary_comment: { type: SchemaType.STRING },
            },
            required: ['ai_summary_comment'],
          },
        },
      });

      this.logger.log(
        `Calling Gemini API (gemini-2.5-flash) for inputId: ${inputId}`,
      );

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API timeout')), 10000),
      );

      const result = (await Promise.race([
        model.generateContent(promptTemplate),
        timeoutPromise,
      ])) as any;

      const responseText = result.response.text();
      const parsed = JSON.parse(responseText);

      return {
        ai_summary_comment: parsed.ai_summary_comment,
      };
    } catch (error) {
      this.logger.error(`AI Summary failed: ${(error as Error).message}`);
      throw new ServiceUnavailableException('AI 요약 생성 실패');
    }
  }
}
