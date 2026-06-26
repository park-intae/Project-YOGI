import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecommendationList from './RecommendationList';

describe('RecommendationList component', () => {
  const mockRecs = Array.from({ length: 5 }, (_, i) => ({
    plan: {
      carrier: 'SKT',
      planName: `Plan ${i + 1}`,
      baseFee: 50000 + i * 10000,
      dataAllowanceGb: 10 * (i + 1),
      voiceAllowanceMin: 9999,
    },
    reason: `Reason ${i + 1}`,
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
    const button = screen.getByRole('button', { name: /다른 요금제 더 보기/i });
    fireEvent.click(button);
    
    expect(screen.getByText('Plan 4')).toBeInTheDocument();
    expect(screen.getByText('Plan 5')).toBeInTheDocument();
  });
});
