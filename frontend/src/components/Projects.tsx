'use client';

import { useInView } from '@/hooks/useInView';
import clsx from 'clsx';
import { TiltCard } from './TiltCard';
import { useTranslations } from 'next-intl';

export function Projects() {
  const { ref, inView } = useInView();
  const t = useTranslations('projects');

  const projects = t.raw('items') as Array<{
    icon: string;
    title: string;
    description: string;
    tech: string[];
  }>;

  return (
    <section className="py-20 md:py-32 relative z-[1]" id="projects">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Header */}
        <div
          ref={ref}
          className={clsx(
            'text-center mb-16 transition-all duration-600',
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          <span className="font-mono text-sm text-[var(--accent-primary)] block mb-4">
            {t('section')}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-[600px] mx-auto">
            {t('description')}
          </p>
        </div>

        {/* Projects grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, i) => (
            <TiltCard
              key={project.title}
              className={clsx(
                'card overflow-hidden hover:shadow-[0_20px_40px_rgba(0,255,136,0.1)] transition-all duration-600',
                inView ? 'translate-y-0' : 'translate-y-8'
              )}
            >
              <div
                style={{ transitionDelay: `${(i + 1) * 100}ms` }}
              >
                {/* Project image/icon */}
                <div className="h-[200px] bg-[var(--bg-tertiary)] flex items-center justify-center text-6xl border-b border-[var(--border-color)]">
                  {project.icon}
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3">{project.title}</h3>
                  <p className="text-[var(--text-secondary)] text-sm mb-4 line-clamp-4">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.tech.map(t => (
                      <span
                        key={t}
                        className="font-mono text-xs px-3 py-1 bg-[var(--bg-tertiary)] rounded text-[var(--accent-primary)]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
}
