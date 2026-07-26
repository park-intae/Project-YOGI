// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';

import { describe, it, expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);
import RecommendationCard from './RecommendationCard';

describe('RecommendationCard component', () => {
  const mockRec = {
    rank: 1,
    plan_id: '1',
    carrier_name: 'SKT',
    plan_name: '5GX 프라임',
    price: 89000,
    data_allowance: 9999,
    data_speed_limit: 0,
    expected_savings: 11000,
  };

  it('renders plan name and fee', () => {
    render(<RecommendationCard idx={0} rec={mockRec} currentFee={100000} />);
    expect(screen.getByText('5GX 프라임')).toBeInTheDocument();
    expect(screen.getByText('월 89,000원')).toBeInTheDocument();
  });

  it('renders saving amount if diff > 0', () => {
    render(<RecommendationCard idx={0} rec={mockRec} currentFee={100000} />);
    expect(screen.getAllByText(/11,000/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/132,000/)[0]).toBeInTheDocument();
  });
});
