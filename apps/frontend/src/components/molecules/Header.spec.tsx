// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';

import { describe, it, expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);
import Header from './Header';

describe('Header component', () => {
  it('renders the title', () => {
    render(<Header />);
    expect(screen.getByText('요금제 비교')).toBeInTheDocument();
  });

  it('renders the help button', () => {
    render(<Header />);
    expect(screen.getAllByRole('button', { name: /이용 방법/i })[0]).toBeInTheDocument();
  });
});
