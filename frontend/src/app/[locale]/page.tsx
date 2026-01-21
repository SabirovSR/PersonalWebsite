'use client';

import dynamic from 'next/dynamic';
import { Navigation } from '@/components/Navigation';
import { Hero } from '@/components/Hero';

// Dynamic imports for below-the-fold components
const About = dynamic(() => import('@/components/About').then(mod => ({ default: mod.About })), {
  ssr: true,
});

const Skills = dynamic(() => import('@/components/Skills').then(mod => ({ default: mod.Skills })), {
  ssr: true,
});

const Experience = dynamic(() => import('@/components/Experience').then(mod => ({ default: mod.Experience })), {
  ssr: true,
});

const Projects = dynamic(() => import('@/components/Projects').then(mod => ({ default: mod.Projects })), {
  ssr: true,
});

const Contact = dynamic(() => import('@/components/Contact').then(mod => ({ default: mod.Contact })), {
  ssr: true,
});

const Footer = dynamic(() => import('@/components/Footer').then(mod => ({ default: mod.Footer })), {
  ssr: true,
});

export default function Home() {
  return (
    <main>
      <Navigation />
      <Hero />
      <About />
      <Skills />
      <Experience />
      <Projects />
      <Contact />
      <Footer />
    </main>
  );
}
