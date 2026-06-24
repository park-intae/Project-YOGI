import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SessionsService {
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

  async getRecommendationsPrompt(sessionId: string, inputId: string) {
    const session = await this.prisma.inputSession.findUnique({
      where: { id: inputId },
      include: {
        userPlan: true,
        userDemand: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session data not found for the given input_id');
    }

    if (session.sessionId !== sessionId) {
      throw new ForbiddenException('You do not have permission to access this data');
    }

    const plans = await this.prisma.plan.findMany();
    const promptPath = path.join(process.cwd(), '../antigravity/prompts/recommendation_v1.md');
    let promptTemplate = fs.readFileSync(promptPath, 'utf8');

    const up = session.userPlan || {} as any;
    const ud = session.userDemand || {} as any;

    const replacements: Record<string, string> = {
      '{{user_carrier}}': up.carrier ?? '정보 없음',
      '{{user_plan_name}}': up.planName ?? '정보 없음',
      '{{user_network_type}}': up.networkType ?? '정보 없음',
      '{{user_base_fee}}': String(up.baseFee ?? '0'),
      '{{user_data_allowance_gb}}': String(up.dataAllowanceGb ?? '0'),
      '{{user_voice_allowance_min}}': String(up.voiceAllowanceMin ?? '0'),
      '{{preferred_carrier}}': ud.preferredCarrier ?? '상관 없음',
      '{{preferred_network_type}}': ud.preferredNetworkType ?? '상관 없음',
      '{{max_fee}}': String(ud.maxFee ?? '상관 없음'),
      '{{min_data_gb}}': String(ud.minDataGb ?? '상관 없음'),
      '{{min_voice_min}}': String(ud.minVoiceMin ?? '상관 없음'),
      '{{candidate_plans_json}}': JSON.stringify(plans, null, 2),
    };

    for (const [key, value] of Object.entries(replacements)) {
      promptTemplate = promptTemplate.replace(new RegExp(key, 'g'), value);
    }

    return {
      inputId: session.id,
      prompt: promptTemplate,
    };
  }
}
