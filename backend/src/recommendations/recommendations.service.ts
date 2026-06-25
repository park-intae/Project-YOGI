import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class RecommendationsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async getRecommendationsPrompt(inputId: string) {
    const session = await this.prisma.inputSession.findUnique({
      where: { id: inputId },
    });

    if (!session) {
      throw new NotFoundException('Session data not found for the given input_id');
    }

    // Return mocked AI recommendations for UI validation
    return {
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
        },
        {
          plan: {
            carrier: 'SKT',
            planName: '5GX 베이직',
            baseFee: 49000,
            dataAllowanceGb: 8,
            voiceAllowanceMin: 9999,
          },
          reason: '데이터 사용량이 매우 적은 달을 위한 최소 비용 요금제입니다.',
        },
        {
          plan: {
            carrier: '알뜰폰',
            planName: '실속 무제한 11GB+',
            baseFee: 33000,
            dataAllowanceGb: 11,
            voiceAllowanceMin: 9999,
          },
          reason: '통신사 결합 할인이 필요 없다면 알뜰폰으로 최대의 가성비를 챙길 수 있습니다.',
        }
      ]
    };
  }
}
