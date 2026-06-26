import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import OptionCard from './OptionCard';

describe('OptionCard component', () => {
  it('renders current mode title correctly', () => {
    render(<OptionCard mode="current" selectedMode="current" onClick={() => {}} />);
    expect(screen.getByText('현재 사용 정보 입력')).toBeInTheDocument();
  });

  it('renders custom mode title correctly', () => {
    render(<OptionCard mode="custom" selectedMode="custom" onClick={() => {}} />);
    expect(screen.getByText('원하는 옵션 선택')).toBeInTheDocument();
  });

  it('calls onClick when button is clicked', () => {
    const handleClick = vi.fn();
    render(<OptionCard mode="current" selectedMode="custom" onClick={handleClick} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
