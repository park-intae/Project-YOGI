"use client";

import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ConcentricDonutChartProps {
  currentValue: number;
  recommendedValue: number;
  label: string;
  colorHex: string;
  size?: number;
}

export default function ConcentricDonutChart({
  currentValue,
  recommendedValue,
  label,
  colorHex,
  size = 64
}: ConcentricDonutChartProps) {
  // Handle "Unlimited" logic (usually denoted by 9999 or very large number in DB)
  const isCurrentUnlimited = currentValue >= 9999;
  const isRecUnlimited = recommendedValue >= 9999;

  // Determine an appropriate max scale for the rings
  let maxValue = 100; // Default scale
  if (isCurrentUnlimited || isRecUnlimited) {
    // If one is unlimited, we set a high baseline so the limited one shows as a fraction
    const maxLimited = Math.max(isCurrentUnlimited ? 0 : currentValue, isRecUnlimited ? 0 : recommendedValue);
    maxValue = maxLimited > 0 ? maxLimited * 1.5 : 100;
  } else {
    maxValue = Math.max(currentValue, recommendedValue);
    if (maxValue === 0) maxValue = 1; // Prevent division by zero
  }

  const currentDisplayVal = isCurrentUnlimited ? maxValue : currentValue;
  const recDisplayVal = isRecUnlimited ? maxValue : recommendedValue;

  const data = {
    datasets: [
      {
        // Outer Ring: Current Plan
        data: [currentDisplayVal, maxValue - currentDisplayVal],
        backgroundColor: ['#d1d5db', '#f3f4f6'], // Gray for current
        borderWidth: 1,
        borderColor: '#ffffff',
        hoverBackgroundColor: ['#9ca3af', '#f3f4f6'],
      },
      {
        // Inner Ring: Recommended Plan
        data: [recDisplayVal, maxValue - recDisplayVal],
        backgroundColor: [colorHex, '#f3f4f6'], // Main color for recommended
        borderWidth: 1,
        borderColor: '#ffffff',
        hoverBackgroundColor: [colorHex, '#f3f4f6'],
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '60%', // Creates the hollow center
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false, // Disable default canvas tooltip
        external: function (context: any) {
          // Tooltip Element
          let tooltipEl = document.getElementById('chartjs-custom-tooltip');

          if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.id = 'chartjs-custom-tooltip';
            tooltipEl.style.background = 'rgba(17, 24, 39, 0.9)'; // gray-900
            tooltipEl.style.borderRadius = '6px';
            tooltipEl.style.color = 'white';
            tooltipEl.style.opacity = '0';
            tooltipEl.style.pointerEvents = 'none';
            tooltipEl.style.position = 'absolute';
            tooltipEl.style.transform = 'translate(-50%, 10px)'; // Center horizontally, shift down slightly
            tooltipEl.style.transition = 'opacity .2s ease, transform .2s ease';
            tooltipEl.style.zIndex = '99999';
            tooltipEl.style.fontSize = '12px';
            tooltipEl.style.fontWeight = 'bold';
            tooltipEl.style.padding = '6px 10px';
            tooltipEl.style.whiteSpace = 'nowrap'; // Prevent text from wrapping/truncating
            tooltipEl.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            document.body.appendChild(tooltipEl);
          }

          const tooltipModel = context.tooltip;

          // Hide if no tooltip
          if (tooltipModel.opacity === 0) {
            tooltipEl.style.opacity = '0';
            tooltipEl.style.transform = 'translate(-50%, 0)';
            return;
          }

          // Set Text
          if (tooltipModel.body) {
            // Flatten the lines array properly and join them
            const bodyLines = tooltipModel.body.map((b: any) => b.lines.join(' '));
            tooltipEl.innerHTML = bodyLines.join('<br>');
          }

          const position = context.chart.canvas.getBoundingClientRect();
          let left = position.left + window.pageXOffset + tooltipModel.caretX;
          let top = position.top + window.pageYOffset + tooltipModel.caretY;

          // Prevent tooltip from going off the right side of the screen
          const screenWidth = window.innerWidth;
          if (left + 100 > screenWidth) { // Approximate tooltip width
            tooltipEl.style.transform = 'translate(-100%, 15px)';
          } else if (left - 100 < 0) {
            tooltipEl.style.transform = 'translate(0%, 15px)';
          } else {
            tooltipEl.style.transform = 'translate(-50%, 15px)'; // Default drop below cursor
          }

          // Display, position, and set styles
          tooltipEl.style.opacity = '1';
          tooltipEl.style.left = left + 'px';
          tooltipEl.style.top = top + 'px';
        },
        callbacks: {
          label: function (context: any) {
            const isOuter = context.datasetIndex === 0;
            const name = isOuter ? '기존 제공량' : '추천 제공량';
            let valStr = '';
            if (isOuter) {
              valStr = isCurrentUnlimited ? '무제한' : `${currentValue}`;
            } else {
              valStr = isRecUnlimited ? '무제한' : `${recommendedValue}`;
            }
            return `${name}: ${valStr}`;
          }
        }
      }
    },
    animation: {
      animateScale: true,
      animateRotate: true
    }
  };

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <Doughnut data={data} options={options} />
      {/* Center Label Overlay */}
      <div className="absolute flex items-center justify-center pointer-events-none">
        <span className="text-[10px] font-bold text-gray-500 whitespace-nowrap">{label}</span>
      </div>
    </div>
  );
}
