import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getSessionId, yogiApi, apiClient } from './api';

describe('api.ts', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(Storage.prototype, 'getItem');
    vi.spyOn(Storage.prototype, 'setItem');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getSessionId', () => {
    it('should create and store a new UUID if none exists in localStorage', () => {
      const sessionId = getSessionId();
      expect(sessionId).toBeDefined();
      expect(sessionId.length).toBeGreaterThan(0);
      expect(localStorage.setItem).toHaveBeenCalledWith('session_uuid', sessionId);
    });

    it('should return existing UUID from localStorage', () => {
      localStorage.setItem('session_uuid', 'test-uuid');
      const sessionId = getSessionId();
      expect(sessionId).toBe('test-uuid');
      // Set was called in setup, but getSessionId itself should not call setItem
      expect(localStorage.setItem).toHaveBeenCalledTimes(1); 
    });
  });

  describe('apiClient interceptors', () => {
    it('should have request interceptor that attaches X-Session-ID', () => {
      localStorage.setItem('session_uuid', 'interceptor-uuid');
      
      // Simulate interceptor manually
      const handlers = (apiClient.interceptors.request as any).handlers;
      expect(handlers.length).toBeGreaterThan(0);
      
      const interceptorFn = handlers[0].fulfilled;
      const config = { headers: {} as any, url: '/test', baseURL: '/api', method: 'get' };
      
      const resultConfig = interceptorFn(config);
      expect(resultConfig.headers['X-Session-ID']).toBe('interceptor-uuid');
    });
  });

  describe('yogiApi', () => {
    it('createSession', async () => {
      const mockResponse = { id: 'input-123', sessionId: 'sess-123' };
      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ data: mockResponse });

      const result = await yogiApi.createSession({ input_type: 'DEMAND' });
      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith('/v1/recommendations', { input_type: 'DEMAND' });
    });

    it('getRecommendations with dev_mode true', async () => {
      localStorage.setItem('dev_mode', 'true');
      const mockResponse = { input_id: '123', recommended_plans: [] };
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockResponse });

      const result = await yogiApi.getRecommendations('123');
      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith('/v1/recommendations/123', { params: { dev_mode: true } });
    });

    it('getRecommendations with dev_mode false', async () => {
      const mockResponse = { input_id: '123', recommended_plans: [] };
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockResponse });

      const result = await yogiApi.getRecommendations('123');
      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith('/v1/recommendations/123', { params: { dev_mode: false } });
    });

    it('getMoreRecommendations', async () => {
      const mockResponse = { input_id: '123', recommended_plans: [] };
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockResponse });

      const result = await yogiApi.getMoreRecommendations('123', ['id1', 'id2']);
      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith('/v1/recommendations/123/more', { params: { excluded_ids: 'id1,id2', dev_mode: false } });
    });

    it('getPlans', async () => {
      const mockResponse = [{ id: 'plan1' }];
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockResponse });

      const result = await yogiApi.getPlans({ min_price: 100 });
      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith('/v1/plans', { params: { min_price: 100 } });
    });
  });
});
