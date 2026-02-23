'use client';

import { ReactNode, useEffect, useState } from 'react';
import Tilt from 'react-parallax-tilt';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /** Override the hover scale factor. Default: 1.02. Pass 1 to disable lift. */
  scale?: number;
}

/** Read the current --accent-primary CSS variable value. */
function readAccentHex(): string {
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue('--accent-primary')
      .trim() || '#6b7280'
  );
}

/**
 * TiltCard component that automatically disables tilt on mobile devices.
 * Glare color tracks the current status accent color.
 */
export function TiltCard({ children, className = '', scale = 1.02 }: TiltCardProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [glareColor, setGlareColor] = useState('#6b7280');

  useEffect(() => {
    setGlareColor(readAccentHex());
    const observer = new MutationObserver(() => setGlareColor(readAccentHex()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-status', 'class'],
    });
    return () => observer.disconnect();
  }, []);

  const tiltConfig = {
    tiltMaxAngleX: 5,
    tiltMaxAngleY: 5,
    glareEnable: true,
    glareMaxOpacity: 0.1,
    glareColor,
    glareBorderRadius: '1rem',
    glarePosition: 'all' as const,
    scale,
    transitionSpeed: 400,
    trackOnWindow: false,
    perspective: 1000,
    gyroscope: false,
    tiltEnable: !isMobile,
  };

  if (isMobile) {
    // On mobile, just return the children without tilt
    return <div className={className}>{children}</div>;
  }

  return (
    <Tilt {...tiltConfig} className={className}>
      <div
        style={{
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitFontSmoothing: 'subpixel-antialiased',
        }}
      >
        {children}
      </div>
    </Tilt>
  );
}
