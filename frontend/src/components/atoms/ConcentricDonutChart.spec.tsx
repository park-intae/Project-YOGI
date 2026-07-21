import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ConcentricDonutChart from './ConcentricDonutChart';

let capturedOptions: any = {};
vi.mock('react-chartjs-2', () => ({
  Doughnut: ({ options }: any) => {
    capturedOptions = options;
    return <div data-testid="mock-doughnut">Mock Doughnut</div>;
  }
}));

describe('ConcentricDonutChart', () => {
  it('renders correctly with limited values', () => {
    render(<ConcentricDonutChart currentValue={10} recommendedValue={20} label="Data" colorHex="#000" />);
    expect(screen.getByTestId('mock-doughnut')).toBeInTheDocument();
    
    const externalTooltip = capturedOptions.plugins.tooltip.external;
    const labelCallback = capturedOptions.plugins.tooltip.callbacks.label;

    expect(labelCallback({ datasetIndex: 0 })).toBe('기존 제공량: 10');
    expect(labelCallback({ datasetIndex: 1 })).toBe('추천 제공량: 20');

    const contextWithTooltip = {
      chart: { canvas: { getBoundingClientRect: () => ({ left: 100, top: 100 }) } },
      tooltip: { opacity: 1, caretX: 10, caretY: 10, body: [{ lines: ['Line 1'] }] }
    };
    
    externalTooltip(contextWithTooltip);
    const tooltipEl = document.getElementById('chartjs-custom-tooltip');
    expect(tooltipEl).not.toBeNull();
    expect(tooltipEl?.innerHTML).toBe('Line 1');

    externalTooltip({ tooltip: { opacity: 0 } });
    expect(tooltipEl?.style.opacity).toBe('0');
  });

  it('renders correctly with unlimited values', () => {
    render(<ConcentricDonutChart currentValue={9999} recommendedValue={9999} label="Voice" colorHex="#000" />);
    
    const labelCallback = capturedOptions.plugins.tooltip.callbacks.label;
    expect(labelCallback({ datasetIndex: 0 })).toBe('기존 제공량: 무제한');
    expect(labelCallback({ datasetIndex: 1 })).toBe('추천 제공량: 무제한');
  });

  it('handles tooltip position near right edge', () => {
    render(<ConcentricDonutChart currentValue={10} recommendedValue={10} label="Test" colorHex="#000" />);
    const externalTooltip = capturedOptions.plugins.tooltip.external;
    
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
    
    const contextNearRight = {
      chart: { canvas: { getBoundingClientRect: () => ({ left: 450, top: 100 }) } },
      tooltip: { opacity: 1, caretX: 0, caretY: 0, body: [{ lines: [] }] }
    };
    
    externalTooltip(contextNearRight);
    const tooltipEl = document.getElementById('chartjs-custom-tooltip');
    expect(tooltipEl?.style.transform).toBe('translate(-100%, 15px)');
  });

  it('handles tooltip position near left edge', () => {
    render(<ConcentricDonutChart currentValue={10} recommendedValue={10} label="Test" colorHex="#000" />);
    const externalTooltip = capturedOptions.plugins.tooltip.external;
    
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
    
    const contextNearLeft = {
      chart: { canvas: { getBoundingClientRect: () => ({ left: -50, top: 100 }) } },
      tooltip: { opacity: 1, caretX: 0, caretY: 0, body: [{ lines: [] }] }
    };
    
    externalTooltip(contextNearLeft);
    const tooltipEl = document.getElementById('chartjs-custom-tooltip');
    expect(tooltipEl?.style.transform).toBe('translate(0%, 15px)');
  });
});
