import { Controller, Get, Query } from '@nestjs/common';
import { PlansService } from './plans.service';

@Controller('api/v1/plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  async getPlans(
    @Query('carrier_type') carrierType?: string,
    @Query('network_type') networkType?: string,
    @Query('min_price') minPrice?: number,
    @Query('max_price') maxPrice?: number,
  ) {
    return this.plansService.getPlans(carrierType, networkType, minPrice, maxPrice);
  }
}
