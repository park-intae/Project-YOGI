import '@testing-library/jest-dom/vitest';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

// Mock react-chartjs-2 to prevent canvas ownerDocument errors
vi.mock('react-chartjs-2', () => ({
  Doughnut: () => null,
  Chart: () => null,
}));
