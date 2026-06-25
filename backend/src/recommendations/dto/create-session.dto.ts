import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class UserPlanDto {
  @ApiProperty({ example: 'SKT', description: '현재 이용 중인 통신사' })
  @IsString()
  carrier: string;

  @ApiProperty({ example: '5G 스탠다드', description: '현재 요금제명' })
  @IsString()
  planName: string;

  @ApiProperty({ example: '5G', description: '네트워크 타입 (LTE/5G 등)' })
  @IsString()
  networkType: string;

  @ApiProperty({ example: 75000, description: '기본료' })
  @IsInt()
  baseFee: number;

  @ApiProperty({ example: 200, description: '기본 제공 데이터 (GB)' })
  @IsNumber()
  dataAllowanceGb: number;

  @ApiProperty({ example: -1, description: '기본 제공 음성통화 (분, 무제한은 -1 등)' })
  @IsInt()
  voiceAllowanceMin: number;
}

export class UserDemandDto {
  @ApiProperty({ required: false, example: 'KT', description: '선호 통신사' })
  @IsOptional()
  @IsString()
  preferredCarrier?: string;

  @ApiProperty({ required: false, example: 'LTE', description: '선호 네트워크 타입' })
  @IsOptional()
  @IsString()
  preferredNetworkType?: string;

  @ApiProperty({ required: false, example: 50000, description: '최대 지불 가능 금액' })
  @IsOptional()
  @IsInt()
  maxFee?: number;

  @ApiProperty({ required: false, example: 50, description: '최소 필요 데이터 (GB)' })
  @IsOptional()
  @IsNumber()
  minDataGb?: number;

  @ApiProperty({ required: false, example: 300, description: '최소 필요 음성통화 (분)' })
  @IsOptional()
  @IsInt()
  minVoiceMin?: number;
}

export class CreateSessionDto {
  @ApiProperty({ required: false, type: UserPlanDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserPlanDto)
  userPlan?: UserPlanDto;

  @ApiProperty({ required: false, type: UserDemandDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserDemandDto)
  userDemand?: UserDemandDto;
}
