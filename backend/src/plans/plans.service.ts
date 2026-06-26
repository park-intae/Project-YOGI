import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlans(
    carrierType?: string,
    networkType?: string,
    minPrice?: number,
    maxPrice?: number
  ) {
    const where: any = {};

    if (carrierType) {
      if (carrierType === '알뜰폰') {
        where.carrier = { notIn: ['SKT', 'KT', 'LGU_PLUS'] };
      } else {
        where.carrier = carrierType;
      }
    }

    if (networkType) {
      where.networkType = networkType;
    }

    if (minPrice || maxPrice) {
      where.baseFee = {};
      if (minPrice) where.baseFee.gte = Number(minPrice);
      if (maxPrice) where.baseFee.lte = Number(maxPrice);
    }

    const plans = await this.prisma.plan.findMany({
      where,
      orderBy: { baseFee: 'asc' },
    });

    return plans.map(p => ({
      plan_id: p.id.toString(),
      carrier_name: p.carrier,
      plan_name: p.planName,
      price: p.baseFee,
      data_allowance: p.dataAllowanceGb,
      data_speed_limit: 0, // Fallback as DB does not have speed limit
      voice_allowance: p.voiceAllowanceMin,
      network_type: p.networkType,
    }));
  }
}
