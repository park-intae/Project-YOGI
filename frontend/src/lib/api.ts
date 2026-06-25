import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

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
  return config;
});

export interface UserPlanDto {
  carrier: string;
  planName: string;
  networkType: string;
  baseFee: number;
  dataAllowanceGb: number;
  voiceAllowanceMin: number;
}

export interface UserDemandDto {
  preferredCarrier?: string;
  preferredNetworkType?: string;
  maxFee?: number;
  minDataGb?: number;
  minVoiceMin?: number;
}

export interface CreateSessionDto {
  userPlan?: UserPlanDto;
  userDemand?: UserDemandDto;
}

export interface SessionResponseDto {
  id: string; // input_id
  sessionId: string;
}

export interface RecommendationResponseDto {
  recommendations: any[]; // replace with actual recommendation interface when known
}

export const yogiApi = {
  createSession: async (data: CreateSessionDto): Promise<SessionResponseDto> => {
    const response = await apiClient.post<SessionResponseDto>('/v1/recommandations', data);
    return response.data;
  },
  
  getRecommendations: async (inputId: string): Promise<RecommendationResponseDto> => {
    const response = await apiClient.get<RecommendationResponseDto>(`/v1/recommendations/${inputId}`);
    return response.data;
  }
};
