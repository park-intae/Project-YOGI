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

  it('shows more recommendations when button is clicked', () => {
    render(<RecommendationList recommendations={mockRecs} currentFee={100000} />);
    const button = screen.getAllByRole('button', { name: /다른 요금제 더 보기/i })[0];
    fireEvent.click(button);
    
    expect(screen.getByText('Plan 4')).toBeInTheDocument();
    expect(screen.getByText('Plan 5')).toBeInTheDocument();
  });
});
