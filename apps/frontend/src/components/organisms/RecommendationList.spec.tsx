// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
expect.extend(matchers);
afterEach(cleanup);

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

import RecommendationList from './RecommendationList';

describe('RecommendationList component', () => {
  const mockRecs = Array.from({ length: 5 }, (_, i) => ({
    rank: i + 1,
    plan_id: String(i + 1),
    carrier_name: 'SKT',
    plan_name: `Plan ${i + 1}`,
    price: 50000 + i * 10000,
    data_allowance: 10 * (i + 1),
    data_speed_limit: 0,
    expected_savings: 100000 - (50000 + i * 10000),
  }));

  it('renders only top 3 recommendations initially', () => {
    render(<RecommendationList recommendations={mockRecs} currentFee={100000} />);
    expect(screen.getByText('Plan 1')).toBeInTheDocument();
    expect(screen.getByText('Plan 2')).toBeInTheDocument();
    expect(screen.getByText('Plan 3')).toBeInTheDocument();
    expect(screen.queryByText('Plan 4')).not.toBeInTheDocument();
  });

  it('shows more recommendations when button is clicked (local expansion)', () => {
    render(<RecommendationList recommendations={mockRecs} currentFee={100000} inputId="test-id" />);
    const button = screen.getByRole('button', { name: /다른 요금제 더 보기/i });
    fireEvent.click(button);
    
    expect(screen.getByText('Plan 4')).toBeInTheDocument();
    expect(screen.getByText('Plan 5')).toBeInTheDocument();
  });

  it('calls API when there are 3 recommendations and load more is clicked', async () => {
    const { yogiApi } = await import('../../lib/api');
    vi.spyOn(yogiApi, 'getMoreRecommendations').mockResolvedValue({
      input_id: 'test-id',
      recommended_at: 'now',
      ai_summary_comment: 'test',
      recommended_plans: [{
        rank: 4,
        plan_id: '4',
        carrier_name: 'KT',
        plan_name: `Plan 4 from API`,
        price: 90000,
        data_allowance: 10,
        data_speed_limit: 0,
        expected_savings: 0,
        base_network: 'KT',
      }]
    });

    const smallRecs = mockRecs.slice(0, 3);
    render(<RecommendationList recommendations={smallRecs} currentFee={100000} inputId="test-id" />);
    
    const button = screen.getByRole('button', { name: /다른 요금제 더 보기/i });
    fireEvent.click(button);
    
    expect(screen.getByText(/AI가 추가 요금제를 분석 중입니다/i)).toBeInTheDocument();
    
    const newPlan = await screen.findByText('Plan 4 from API');
    expect(newPlan).toBeInTheDocument();
    expect(yogiApi.getMoreRecommendations).toHaveBeenCalledWith('test-id', ['1', '2', '3']);
  });

  it('filters recommendations by carrier', () => {
    const recsWithNetwork = [
      ...mockRecs.slice(0,3),
      { ...mockRecs[3], base_network: 'SKT망' },
      { ...mockRecs[4], base_network: 'KT망' },
    ];
    render(<RecommendationList recommendations={recsWithNetwork} currentFee={100000} inputId="test-id" />);
    
    const button = screen.getByRole('button', { name: /다른 요금제 더 보기/i });
    fireEvent.click(button);
    
    const filterKT = screen.getByRole('button', { name: 'KT망' });
    fireEvent.click(filterKT);
    
    expect(screen.getByText('Plan 5')).toBeInTheDocument();
    expect(screen.queryByText('Plan 4')).not.toBeInTheDocument();
  });
});
