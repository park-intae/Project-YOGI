import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Header from './Header';

describe('Header component', () => {
  it('renders the title', () => {
    render(<Header />);
    expect(screen.getByText('요금제 비교')).toBeInTheDocument();
  });

  it('renders the help button', () => {
    render(<Header />);
    expect(screen.getByRole('button', { name: /이용 방법/i })).toBeInTheDocument();
  });
});
