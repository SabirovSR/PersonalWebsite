'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/** Parse hex color #rrggbb → "r, g, b" string for use inside rgba(). */
function hexToRgbStr(hex: string): string {
  const clean = hex.trim().replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function readAccentRgb(): string {
  const hex =
    getComputedStyle(document.documentElement)
      .getPropertyValue('--accent-primary')
      .trim() || '#6b7280';
  return hexToRgbStr(hex);
}

export function ParallaxBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [accentRgb, setAccentRgb] = useState('107, 114, 128'); // gray fallback

  useEffect(() => {
    setAccentRgb(readAccentRgb());
    const observer = new MutationObserver(() => setAccentRgb(readAccentRgb()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-status', 'class'],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const mx = mousePosition.x;
  const my = mousePosition.y;

  const mainGradient = `
    radial-gradient(circle at ${50 + mx * 8}% ${50 + my * 8}%,
      rgba(${accentRgb}, 0.12) 0%, transparent 60%),
    radial-gradient(circle at ${25 - mx * 6}% ${75 - my * 6}%,
      rgba(136, 0, 255, 0.08) 0%, transparent 55%),
    radial-gradient(circle at ${75 - mx * 7}% ${25 + my * 7}%,
      rgba(0, 170, 255, 0.08) 0%, transparent 55%),
    radial-gradient(circle at ${40 + mx * 5}% ${60 - my * 5}%,
      rgba(${accentRgb}, 0.06) 0%, transparent 50%)
  `;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute inset-0"
        style={{ background: mainGradient, opacity: 0.4 }}
        animate={{ background: [mainGradient] }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />

      {/* Subtle noise texture for depth */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='4' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />

      {/* Slow-breathing accent gradient */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 100% 50% at 50% 0%,
              rgba(${accentRgb}, 0.05) 0%, transparent 70%),
            radial-gradient(ellipse 80% 40% at 0% 100%,
              rgba(136, 0, 255, 0.04) 0%, transparent 60%),
            radial-gradient(ellipse 80% 40% at 100% 100%,
              rgba(0, 170, 255, 0.04) 0%, transparent 60%)
          `,
        }}
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
