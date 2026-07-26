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

import type {
  CurrentPlanDto,
  DemandConditionDto,
  CreateSessionDto,
  SessionResponseDto,
  RecommendedPlanDto,
  RecommendationResponseDto,
  RecommendationSummaryDto,
  PlanFilterParams,
} from '@yogi/shared-types';

export type {
  CurrentPlanDto,
  DemandConditionDto,
  CreateSessionDto,
  SessionResponseDto,
  RecommendedPlanDto,
  RecommendationResponseDto,
  RecommendationSummaryDto,
  PlanFilterParams,
};


export const yogiApi = {
  createSession: async (data: CreateSessionDto): Promise<SessionResponseDto> => {
    const response = await apiClient.post<SessionResponseDto>('/v1/recommendations', data);
    return response.data;
  },
  
  getRecommendations: async (inputId: string): Promise<RecommendationResponseDto> => {
    let devMode = false;
    if (typeof window !== 'undefined') {
      devMode = localStorage.getItem('dev_mode') === 'true';
    }
    const response = await apiClient.get<RecommendationResponseDto>(`/v1/recommendations/${inputId}`, {
      params: { dev_mode: devMode }
    });
    return response.data;
  },

  getMoreRecommendations: async (inputId: string, excludedIds: string[]): Promise<RecommendationResponseDto> => {
    let devMode = false;
    if (typeof window !== 'undefined') {
      devMode = localStorage.getItem('dev_mode') === 'true';
    }
    const excludedIdsStr = excludedIds.join(',');
    const response = await apiClient.get<RecommendationResponseDto>(`/v1/recommendations/${inputId}/more`, {
      params: { excluded_ids: excludedIdsStr, dev_mode: devMode }
    });
    return response.data;
  },

  getRecommendationSummary: async (inputId: string): Promise<RecommendationSummaryDto> => {
    let devMode = false;
    if (typeof window !== 'undefined') {
      devMode = localStorage.getItem('dev_mode') === 'true';
    }
    const response = await apiClient.get<RecommendationSummaryDto>(`/v1/recommendations/${inputId}/summary`, {
      params: { dev_mode: devMode }
    });
    return response.data;
  },

  getPlans: async (params?: PlanFilterParams): Promise<any[]> => {
    const response = await apiClient.get<any[]>('/v1/plans', { params });
    return response.data;
  }
};
