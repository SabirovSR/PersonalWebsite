'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function ParallaxBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Animated gradient mesh with smooth transitions */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at ${50 + mousePosition.x * 8}% ${50 + mousePosition.y * 8}%, 
              rgba(0, 255, 136, 0.12) 0%, 
              transparent 60%),
            radial-gradient(circle at ${25 - mousePosition.x * 6}% ${75 - mousePosition.y * 6}%, 
              rgba(136, 0, 255, 0.08) 0%, 
              transparent 55%),
            radial-gradient(circle at ${75 - mousePosition.x * 7}% ${25 + mousePosition.y * 7}%, 
              rgba(0, 170, 255, 0.08) 0%, 
              transparent 55%),
            radial-gradient(circle at ${40 + mousePosition.x * 5}% ${60 - mousePosition.y * 5}%, 
              rgba(0, 255, 136, 0.06) 0%, 
              transparent 50%)
          `,
          opacity: 0.4,
        }}
        animate={{
          background: [
            `radial-gradient(circle at ${50 + mousePosition.x * 8}% ${50 + mousePosition.y * 8}%, rgba(0, 255, 136, 0.12) 0%, transparent 60%),
             radial-gradient(circle at ${25 - mousePosition.x * 6}% ${75 - mousePosition.y * 6}%, rgba(136, 0, 255, 0.08) 0%, transparent 55%),
             radial-gradient(circle at ${75 - mousePosition.x * 7}% ${25 + mousePosition.y * 7}%, rgba(0, 170, 255, 0.08) 0%, transparent 55%),
             radial-gradient(circle at ${40 + mousePosition.x * 5}% ${60 - mousePosition.y * 5}%, rgba(0, 255, 136, 0.06) 0%, transparent 50%)`,
          ],
        }}
        transition={{
          duration: 0.3,
          ease: 'easeOut',
        }}
      />

      {/* Subtle noise texture overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='4' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />

      {/* Additional animated gradient layers for smooth transitions */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 100% 50% at 50% 0%, 
              rgba(0, 255, 136, 0.05) 0%, 
              transparent 70%),
            radial-gradient(ellipse 80% 40% at 0% 100%, 
              rgba(136, 0, 255, 0.04) 0%, 
              transparent 60%),
            radial-gradient(ellipse 80% 40% at 100% 100%, 
              rgba(0, 170, 255, 0.04) 0%, 
              transparent 60%)
          `,
        }}
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}
