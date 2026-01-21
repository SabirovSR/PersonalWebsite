'use client';

import { motion, Variants } from 'framer-motion';
import { ReactNode } from 'react';
import { useInView } from 'react-intersection-observer';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  variant?: 'fadeUp' | 'fadeDown' | 'fadeLeft' | 'fadeRight' | 'scale' | 'blur';
  threshold?: number;
  once?: boolean;
}

const variants: Record<string, Variants> = {
  fadeUp: {
    hidden: { y: 30 },
    visible: { y: 0 },
  },
  fadeDown: {
    hidden: { y: -30 },
    visible: { y: 0 },
  },
  fadeLeft: {
    hidden: { x: -30 },
    visible: { x: 0 },
  },
  fadeRight: {
    hidden: { x: 30 },
    visible: { x: 0 },
  },
  scale: {
    hidden: { scale: 0.9 },
    visible: { scale: 1 },
  },
  blur: {
    hidden: { filter: 'blur(4px)' },
    visible: { filter: 'blur(0px)' },
  },
};

export function AnimatedSection({
  children,
  className = '',
  delay = 0,
  duration = 0.6,
  variant = 'fadeUp',
  threshold = 0.1,
  once = true,
}: AnimatedSectionProps) {
  const { ref, inView } = useInView({
    threshold,
    triggerOnce: once,
  });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={variants[variant]}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.4, 0.25, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedListProps {
  children: ReactNode[];
  className?: string;
  staggerDelay?: number;
  itemDuration?: number;
  threshold?: number;
  once?: boolean;
}

export function AnimatedList({
  children,
  className = '',
  staggerDelay = 0.1,
  itemDuration = 0.5,
  threshold = 0.1,
  once = true,
}: AnimatedListProps) {
  const { ref, inView } = useInView({
    threshold,
    triggerOnce: once,
  });

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: itemDuration,
        ease: [0.25, 0.4, 0.25, 1],
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={container}
    >
      {children.map((child, index) => (
        <motion.div key={index} variants={item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
