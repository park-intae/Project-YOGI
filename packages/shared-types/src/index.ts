export interface CurrentPlanDto {
  actual_carrier: string;
  actual_base_network?: string;
  actual_plan_name: string;
  actual_monthly_fee: number;
  actual_data_usage: number;
  actual_voice_usage: number;
}

export interface DemandConditionDto {
  preferred_carrier_type?: string;
  preferred_base_network?: string;
  preferred_network_type?: string;
  max_budget?: number;
}

export interface CreateSessionDto {
  input_type: 'PLAN' | 'DEMAND' | 'BOTH';
  current_plan?: CurrentPlanDto;
  demand_condition?: DemandConditionDto;
}

export interface SessionResponseDto {
  id: string;
  sessionId: string;
}

export interface RecommendedPlanDto {
  rank: number;
  plan_id: string;
  carrier_name: string;
  base_network?: string;
  plan_name: string;
  plan_url?: string;
  price: number;
  data_allowance: number;
  data_speed_limit: number;
  expected_savings: number;
}

export interface RecommendationResponseDto {
  input_id: string;
  recommended_at: string;
  ai_summary_comment?: string;
  recommended_plans: RecommendedPlanDto[];
}

export interface RecommendationSummaryDto {
  ai_summary_comment: string;
}

export interface PlanFilterParams {
  carrier_type?: string;
  network_type?: string;
  min_price?: number;
  max_price?: number;
}
