// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
expect.extend(matchers);
afterEach(cleanup);

import DiagnosticForm from './DiagnosticForm';
import { yogiApi } from '../../lib/api';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn() }),
}));

vi.mock('../../lib/api', () => ({
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
    expect(screen.getByText('통신 3사 요금 내지 마세요, 알뜰폰으로 반값 할인받기')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /AI 추천 요금제 확인하기/i })).toBeInTheDocument();
  });

  it('submits form data correctly', async () => {
    vi.mocked(yogiApi.createSession).mockResolvedValueOnce({ id: 'test-session-id' } as any);
    render(<DiagnosticForm />);
    
    const submitButton = screen.getByRole('button', { name: /AI 추천 요금제 확인하기/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(yogiApi.createSession).toHaveBeenCalled();
    });
  });

  it('displays error message when API call fails', async () => {
    vi.mocked(yogiApi.createSession).mockRejectedValueOnce({
      response: { data: { message: 'API Error message' } }
    });
    render(<DiagnosticForm />);
    
    const submitButton = screen.getByRole('button', { name: /AI 추천 요금제 확인하기/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('API Error message')).toBeInTheDocument();
    });
  });

  it('toggles unlimited checkboxes', () => {
    render(<DiagnosticForm />);
    
    // By default, it's unlimited. Let's uncheck them.
    const checkboxes = screen.getAllByRole('checkbox', { hidden: true });
    checkboxes.forEach((cb) => {
      fireEvent.click(cb);
    });

    const dataInput = screen.getByPlaceholderText('예: 100');
    expect(dataInput).not.toBeDisabled();
    
    const voiceInputs = screen.getAllByPlaceholderText('예: 300');
    expect(voiceInputs[0]).not.toBeDisabled();
    expect(voiceInputs[1]).not.toBeDisabled();
  });
});
