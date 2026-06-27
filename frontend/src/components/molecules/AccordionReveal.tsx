'use client';

import React, { useEffect, useState, useRef } from 'react';

interface AccordionRevealProps {
  children: React.ReactNode;
  isOpen: boolean;
  className?: string;
}

export default function AccordionReveal({ children, isOpen, className = '' }: AccordionRevealProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  // Always initialize isExpanding to false to guarantee the 0fr -> 1fr transition 
  // even if it mounts with isOpen=true (like with instant mockup data)
  const [isExpanding, setIsExpanding] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousHeightRef = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Wait a tick for React to render the DOM, then start transition
      const timer = setTimeout(() => setIsExpanding(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsExpanding(false);
      // Wait for transition to finish before unmounting
      const timer = setTimeout(() => setShouldRender(false), 700);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // ResizeObserver to track height changes and scroll by the difference
  useEffect(() => {
    if (!containerRef.current || !isExpanding) return;

    // Reset previous height when expanding starts
    previousHeightRef.current = containerRef.current.getBoundingClientRect().height;

    const observer = new ResizeObserver((entries) => {
      if (!isExpanding) return;
      for (let entry of entries) {
        const currentHeight = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
        if (previousHeightRef.current > 0) {
          const diff = currentHeight - previousHeightRef.current;
          // If height increased, scroll down by the exact difference to keep viewport locked to expansion
          if (diff > 0 && diff < 800) {
            window.scrollBy({ top: diff, behavior: 'instant' });
          }
        }
        previousHeightRef.current = currentHeight;
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isExpanding]);

  if (!shouldRender) return null;

  return (
    <div
      ref={containerRef}
      className={`grid transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        isExpanding ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
      } ${className}`}
    >
      <div className="overflow-hidden min-h-0">
        {children}
      </div>
    </div>
  );
}
