import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';

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
}
