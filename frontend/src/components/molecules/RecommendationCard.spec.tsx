import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecommendationCard from './RecommendationCard';

describe('RecommendationCard component', () => {
  const mockRec = {
    plan: {
      carrier: 'SKT',
      planName: '5GX 프라임',
      baseFee: 89000,
      dataAllowanceGb: 9999,
      voiceAllowanceMin: 9999,
    },
    reason: '데이터 무제한 요금제입니다.',
  };

  it('renders plan name and fee', () => {
    render(<RecommendationCard idx={0} rec={mockRec} currentFee={100000} />);
    expect(screen.getByText('5GX 프라임')).toBeInTheDocument();
    expect(screen.getByText('월 89,000원')).toBeInTheDocument();
  });

  it('renders saving amount if diff > 0', () => {
    render(<RecommendationCard idx={0} rec={mockRec} currentFee={100000} />);
    expect(screen.getByText(/11,000원 절약/)).toBeInTheDocument();
    expect(screen.getByText(/132,000원 절약/)).toBeInTheDocument();
  });
});
