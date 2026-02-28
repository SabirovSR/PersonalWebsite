import dynamic from 'next/dynamic';
import { Navigation } from '@/components/Navigation';
import { Hero } from '@/components/Hero';
import { BlogContactSection } from '@/components/BlogContactSection';
import { fetchStatus, fetchBlogPosts } from '@/lib/api.server';

// Dynamic imports for below-the-fold components (code splitting, SSR enabled)
const About = dynamic(() => import('@/components/About').then(mod => ({ default: mod.About })));
const Skills = dynamic(() => import('@/components/Skills').then(mod => ({ default: mod.Skills })));
const Experience = dynamic(() => import('@/components/Experience').then(mod => ({ default: mod.Experience })));
const Projects = dynamic(() => import('@/components/Projects').then(mod => ({ default: mod.Projects })));
const Footer = dynamic(() => import('@/components/Footer').then(mod => ({ default: mod.Footer })));

export default async function Home() {
  const [initialStatus, initialPosts] = await Promise.all([
    fetchStatus(),
    fetchBlogPosts(),
  ]);

  return (
    <main>
      <Navigation />
      <Hero initialStatus={initialStatus} />
      <About />
      <Skills />
      <Experience />
      <Projects />
      <BlogContactSection initialPosts={initialPosts} />
      <Footer />
    </main>
  );
}
