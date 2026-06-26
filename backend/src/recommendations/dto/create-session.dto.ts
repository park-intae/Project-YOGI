import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, ValidateNested, IsIn } from 'class-validator';

export class CurrentPlanDto {
  @ApiProperty({ example: 'KT', description: '현재 이용 중인 통신사' })
  @IsString()
  actual_carrier: string;

  @ApiProperty({ example: 'LTE 데이터ON', description: '현재 요금제명' })
  @IsString()
  actual_plan_name: string;

  @ApiProperty({ example: 69000, description: '기본료' })
  @IsInt()
  actual_monthly_fee: number;

  @ApiProperty({ example: 15.5, description: '기본 제공 데이터 (GB)' })
  @IsNumber()
  actual_data_usage: number;

  @ApiProperty({ example: 180, description: '기본 제공 음성통화 (분, 무제한은 -1 등)' })
  @IsInt()
  actual_voice_usage: number;
}

export class DemandConditionDto {
  @ApiProperty({ required: false, example: '알뜰폰', description: '선호 통신사' })
  @IsOptional()
  @IsString()
  preferred_carrier_type?: string;

  @ApiProperty({ required: false, example: 'LTE', description: '선호 네트워크 타입' })
  @IsOptional()
  @IsString()
  preferred_network_type?: string;

  @ApiProperty({ required: false, example: 40000, description: '최대 지불 가능 금액' })
  @IsOptional()
  @IsInt()
  max_budget?: number;
}

export class CreateSessionDto {
  @ApiProperty({ example: 'BOTH', description: '입력 타입 (PLAN, DEMAND, BOTH)' })
  @IsString()
  @IsIn(['PLAN', 'DEMAND', 'BOTH'])
  input_type: string;

  @ApiProperty({ required: false, type: CurrentPlanDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CurrentPlanDto)
  current_plan?: CurrentPlanDto;

  @ApiProperty({ required: false, type: DemandConditionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DemandConditionDto)
  demand_condition?: DemandConditionDto;
}
