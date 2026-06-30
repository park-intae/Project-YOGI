import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
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
  private genAI: GoogleGenerativeAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async createSession(sessionId: string, dto: CreateSessionDto) {
    if (dto.input_type === 'PLAN' || dto.input_type === 'BOTH') {
      if (!dto.current_plan) throw new BadRequestException('current_plan is required for this input_type.');
    }
    if (dto.input_type === 'DEMAND' || dto.input_type === 'BOTH') {
      if (!dto.demand_condition) throw new BadRequestException('demand_condition is required for this input_type.');
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

  private async getCandidatePlans(demand: any, limit = 15) {
    const where: any = { baseFee: { gt: 0 } };
    
    if (demand?.maxFee) where.baseFee = { ...where.baseFee, lte: demand.maxFee };
    if (demand?.preferredCarrier) where.carrier = demand.preferredCarrier;
    if (demand?.preferredBaseNetwork) where.baseNetwork = demand.preferredBaseNetwork;
    if (demand?.preferredNetworkType) where.networkType = demand.preferredNetworkType;

    return this.prisma.plan.findMany({
      where,
      orderBy: { baseFee: 'asc' },
      take: limit,
      select: {
        id: true,
        carrier: true,
        planName: true,
        baseFee: true,
        dataAllowanceGb: true,
        voiceAllowanceMin: true,
      }
    });
  }

  async getRecommendationsPrompt(inputId: string, sessionId: string) {
    const session = await this.prisma.inputSession.findUnique({
      where: { id: inputId },
      include: {
        userPlan: true,
        userDemand: true,
      }
    });

    if (!session) {
      throw new NotFoundException('Session data not found for the given input_id');
    }

    if (session.sessionId !== sessionId) {
      throw new ForbiddenException('Forbidden. Session ID mismatch.');
    }

    const candidatePlans = await this.getCandidatePlans(session.userDemand, 10);
    
    // Fallback to mock data if no apiKey or AI fails
    const mockFallback = {
      input_id: inputId,
      recommended_at: new Date().toISOString(),
      ai_summary_comment: 'API 키가 없어 임시 모의 데이터를 반환합니다.',
      recommended_plans: [
        {
          rank: 1,
          plan_id: candidatePlans[0]?.id?.toString() || 'mock-id-1',
          carrier_name: '우체국알뜰(모빙)',
          base_network: 'SKT망',
          plan_name: '5G 다이렉트 45',
          price: 69000,
          data_allowance: 250,
          data_speed_limit: 5,
          expected_savings: 20000,
        },
        {
          rank: 2,
          plan_id: candidatePlans[1]?.id?.toString() || 'mock-id-2',
          carrier_name: '프리티',
          base_network: 'KT망',
          plan_name: '초이스 베이직',
          price: 55000,
          data_allowance: 10,
          data_speed_limit: 1,
          expected_savings: 34000,
        },
        {
          rank: 3,
          plan_id: candidatePlans[2]?.id?.toString() || 'mock-id-3',
          carrier_name: '큰사람',
          base_network: 'LGU+망',
          plan_name: '5G 안심 15GB+',
          price: 47000,
          data_allowance: 12,
          data_speed_limit: 1,
          expected_savings: 42000,
        },
        {
          plan_id: candidatePlans[3]?.id?.toString() || 'mock-id-4',
          carrier_name: '이야기모바일',
          base_network: 'SKT망',
          plan_name: '이야기 5G 라이트',
          price: 33000,
          data_allowance: 15,
          data_speed_limit: 3,
          expected_savings: 56000,
        }
      ]
    };

    if (!this.genAI || process.env.NODE_ENV === 'test') {
      this.logger.warn('Gemini API key not found or running in test mode. Returning mock data.');
      return mockFallback;
    }

    try {
      const promptPath = path.join(process.cwd(), '../antigravity/prompts/recommendation_v1.md');
      let promptTemplate = fs.readFileSync(promptPath, 'utf-8');

      const up = session.userPlan || {} as any;
      const ud = session.userDemand || {} as any;

      promptTemplate = promptTemplate
        .replace('{{user_carrier}}', up.carrier || '없음')
        .replace('{{user_plan_name}}', up.planName || '없음')
        .replace('{{user_network_type}}', up.networkType || '없음')
        .replace('{{user_base_fee}}', up.baseFee?.toString() || '0')
        .replace('{{user_data_allowance_gb}}', up.dataAllowanceGb?.toString() || '0')
        .replace('{{user_voice_allowance_min}}', up.voiceAllowanceMin?.toString() || '0')
        .replace('{{preferred_carrier}}', ud.preferredCarrier || '상관 없음')
        .replace('{{preferred_network_type}}', ud.preferredNetworkType || '상관 없음')
        .replace('{{max_fee}}', ud.maxFee?.toString() || '상관 없음')
        .replace('{{min_data_gb}}', ud.minDataGb?.toString() || '상관 없음')
        .replace('{{min_voice_min}}', ud.minVoiceMin?.toString() || '상관 없음')
        .replace('{{candidate_plans_json}}', JSON.stringify(candidatePlans, null, 2));

      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              ai_summary_comment: { type: SchemaType.STRING },
              recommended_plans: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    rank: { type: SchemaType.INTEGER },
                    plan_id: { type: SchemaType.STRING },
                    carrier_name: { type: SchemaType.STRING },
                    base_network: { type: SchemaType.STRING },
                    plan_name: { type: SchemaType.STRING },
                    price: { type: SchemaType.INTEGER },
                    data_allowance: { type: SchemaType.NUMBER },
                    data_speed_limit: { type: SchemaType.NUMBER },
                    expected_savings: { type: SchemaType.INTEGER }
                  },
                  required: ['rank', 'plan_id', 'carrier_name', 'base_network', 'plan_name', 'price', 'data_allowance', 'data_speed_limit', 'expected_savings']
                }
              }
            },
            required: ['ai_summary_comment', 'recommended_plans']
          }
        }
      });

      this.logger.log(`Calling Gemini API for inputId: ${inputId}`);
      const result = await model.generateContent(promptTemplate);
      const responseText = result.response.text();
      
      const parsed = JSON.parse(responseText);
      
      return {
        input_id: inputId,
        recommended_at: new Date().toISOString(),
        ai_summary_comment: parsed.ai_summary_comment,
        recommended_plans: parsed.recommended_plans
      };

    } catch (error) {
      this.logger.error(`AI Recommendation failed: ${error.message}`);
      return mockFallback; // Fallback
    }
  }
}
