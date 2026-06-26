import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DiagnosticForm from './DiagnosticForm';
import { yogiApi } from '@/lib/api';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn() }),
}));

vi.mock('@/lib/api', () => ({
  yogiApi: {
    createSession: vi.fn(),
  },
}));

describe('DiagnosticForm component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form elements', () => {
    render(<DiagnosticForm />);
    expect(screen.getByText('나에게 딱 맞는 요금제를 찾아보세요')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /AI 추천 요금제 확인하기/i })).toBeInTheDocument();
  });

  it('submits form data correctly', async () => {
    vi.mocked(yogiApi.createSession).mockResolvedValueOnce({ id: 'test-session-id' });
    render(<DiagnosticForm />);
    
    const submitButton = screen.getByRole('button', { name: /AI 추천 요금제 확인하기/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(yogiApi.createSession).toHaveBeenCalled();
    });
  });
});
