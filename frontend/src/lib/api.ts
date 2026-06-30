import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Session ID Management
export const getSessionId = () => {
  if (typeof window === 'undefined') return '';
  let sessionId = localStorage.getItem('session_uuid');
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem('session_uuid', sessionId);
  }
  return sessionId;
};

// Add interceptor to include X-Session-ID
apiClient.interceptors.request.use((config) => {
  const sessionId = getSessionId();
  if (sessionId) {
    config.headers['X-Session-ID'] = sessionId;
  }
  console.log('[Axios Request]', config.method?.toUpperCase(), config.baseURL, config.url);
  return config;
});

export interface CurrentPlanDto {
  actual_carrier: string;
  actual_plan_name: string;
  actual_monthly_fee: number;
  actual_data_usage: number;
  actual_voice_usage: number;
}

export interface DemandConditionDto {
  preferred_carrier_type?: string;
  preferred_network_type?: string;
  max_budget?: number;
}

export interface CreateSessionDto {
  input_type: 'PLAN' | 'DEMAND' | 'BOTH';
  current_plan?: CurrentPlanDto;
  demand_condition?: DemandConditionDto;
}

export interface SessionResponseDto {
  id: string; // input_id
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
  ai_summary_comment: string;
  recommended_plans: RecommendedPlanDto[];
}

export interface PlanFilterParams {
  carrier_type?: string;
  network_type?: string;
  min_price?: number;
  max_price?: number;
}

export const yogiApi = {
  createSession: async (data: CreateSessionDto): Promise<SessionResponseDto> => {
    const response = await apiClient.post<SessionResponseDto>('/v1/recommendations', data);
    return response.data;
  },
  
  getRecommendations: async (inputId: string): Promise<RecommendationResponseDto> => {
    const response = await apiClient.get<RecommendationResponseDto>(`/v1/recommendations/${inputId}`);
    return response.data;
  },

  getPlans: async (params?: PlanFilterParams): Promise<any[]> => {
    const response = await apiClient.get<any[]>('/v1/plans', { params });
    return response.data;
  }
};
