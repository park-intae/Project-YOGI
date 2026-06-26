import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, Schema, Type } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';

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
    if (!dto.userPlan && !dto.userDemand) {
      throw new BadRequestException('At least one of userPlan or userDemand must be provided.');
    }

    return this.prisma.$transaction(async (tx) => {
      const inputSession = await tx.inputSession.create({
        data: {
          sessionId,
        },
      });

      if (dto.userPlan) {
        await tx.userPlan.create({
          data: {
            inputId: inputSession.id,
            carrier: dto.userPlan.carrier,
            planName: dto.userPlan.planName,
            networkType: dto.userPlan.networkType,
            baseFee: dto.userPlan.baseFee,
            dataAllowanceGb: dto.userPlan.dataAllowanceGb,
            voiceAllowanceMin: dto.userPlan.voiceAllowanceMin,
          },
        });
      }

      if (dto.userDemand) {
        await tx.userDemand.create({
          data: {
            inputId: inputSession.id,
            preferredCarrier: dto.userDemand.preferredCarrier,
            preferredNetworkType: dto.userDemand.preferredNetworkType,
            maxFee: dto.userDemand.maxFee,
            minDataGb: dto.userDemand.minDataGb,
            minVoiceMin: dto.userDemand.minVoiceMin,
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
    if (demand?.minDataGb) where.dataAllowanceGb = { gte: demand.minDataGb };
    if (demand?.minVoiceMin) where.voiceAllowanceMin = { gte: demand.minVoiceMin };
    if (demand?.preferredCarrier) where.carrier = demand.preferredCarrier;
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
      recommendations: [
        {
          plan: {
            carrier: 'SKT',
            planName: '5GX 레귤러 플러스',
            baseFee: 69000,
            dataAllowanceGb: 250,
            voiceAllowanceMin: 9999,
          },
          reason: '기존 무제한 요금제 대비 데이터 사용량이 적어 250GB 요금제로 낮추면 매월 20,000원을 절약할 수 있습니다.',
        },
        {
          plan: {
            carrier: 'KT',
            planName: '5G 슬림',
            baseFee: 55000,
            dataAllowanceGb: 10,
            voiceAllowanceMin: 9999,
          },
          reason: '필수적인 데이터만 사용하신다면 5G 슬림 요금제를 통해 통신비를 대폭 줄일 수 있습니다.',
        },
        {
          plan: {
            carrier: 'LGU+',
            planName: '5G 스탠다드',
            baseFee: 99000,
            dataAllowanceGb: 9999,
            voiceAllowanceMin: 9999,
          },
          reason: '데이터 무제한 혜택을 원하시며 추가적인 멤버십 혜택을 활용하고 싶다면 좋은 선택입니다.',
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

      // Inject Variables
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
            type: Type.OBJECT,
            properties: {
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    rank: { type: Type.INTEGER },
                    plan_id: { type: Type.INTEGER },
                    carrier: { type: Type.STRING },
                    plan_name: { type: Type.STRING },
                    base_fee: { type: Type.INTEGER },
                    data_allowance_gb: { type: Type.NUMBER },
                    voice_allowance_min: { type: Type.INTEGER },
                    reason: { type: Type.STRING }
                  },
                  required: ['rank', 'plan_id', 'carrier', 'plan_name', 'base_fee', 'data_allowance_gb', 'voice_allowance_min', 'reason']
                }
              }
            },
            required: ['recommendations']
          }
        }
      });

      this.logger.log(`Calling Gemini API for inputId: ${inputId}`);
      const result = await model.generateContent(promptTemplate);
      const responseText = result.response.text();
      
      const parsed = JSON.parse(responseText);
      
      // Map to UI format
      return {
        recommendations: parsed.recommendations.map((r: any) => ({
          plan: {
            carrier: r.carrier,
            planName: r.plan_name,
            baseFee: r.base_fee,
            dataAllowanceGb: r.data_allowance_gb,
            voiceAllowanceMin: r.voice_allowance_min,
          },
          reason: r.reason
        }))
      };

    } catch (error) {
      this.logger.error(`AI Recommendation failed: ${error.message}`);
      return mockFallback; // Fallback
    }
  }
}
