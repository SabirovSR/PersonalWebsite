'use client';

import { ReactNode } from 'react';
import Tilt from 'react-parallax-tilt';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
}

/**
 * TiltCard component that automatically disables tilt on mobile devices
 */
export function TiltCard({ children, className = '' }: TiltCardProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Tilt configuration
  const tiltConfig = {
    tiltMaxAngleX: 5,
    tiltMaxAngleY: 5,
    glareEnable: true,
    glareMaxOpacity: 0.1,
    glareColor: '#00ff88',
    glareBorderRadius: '1rem',
    glarePosition: 'all' as const,
    scale: 1.02,
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
