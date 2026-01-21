'use client';

import { useInView } from '@/hooks/useInView';
import clsx from 'clsx';
import { TiltCard } from './TiltCard';
import { useTranslations } from 'next-intl';

export function Experience() {
  const { ref, inView } = useInView();
  const t = useTranslations('experience');

  const experiences = t.raw('jobs') as Array<{
    date: string;
    title: string;
    company: string;
    description: string;
    tech: string[];
  }>;

  return (
    <section className="py-20 md:py-32 relative z-[1]" id="experience">
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

        {/* Timeline */}
        <div className="max-w-[800px] mx-auto relative pl-10 md:pl-0">
          {/* Timeline line */}
          <div className="absolute left-0 md:left-0 top-0 h-full w-[2px] bg-gradient-to-b from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-purple)]" />

          {experiences.map((exp, i) => (
            <div
              key={exp.title}
              className={clsx(
                'relative pl-10 pb-12 last:pb-0 transition-all duration-600',
                inView ? 'translate-y-0' : 'translate-y-8'
              )}
              style={{ transitionDelay: `${(i + 1) * 150}ms` }}
            >
              {/* Timeline dot */}
              <div className="absolute left-[-7px] top-0 w-4 h-4 bg-[var(--accent-primary)] rounded-full border-[3px] border-[var(--bg-secondary)]" />

              <TiltCard className="card p-7 hover:translate-x-3 transition-transform duration-400">
                <div className="font-mono text-sm text-[var(--accent-primary)] mb-2">
                  {exp.date}
                </div>
                <h3 className="text-xl font-bold mb-2">{exp.title}</h3>
                <div className="text-[var(--text-secondary)] mb-4">{exp.company}</div>
                <p className="text-[var(--text-secondary)] leading-7 mb-4">
                  {exp.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {exp.tech.map(t => (
                    <span
                      key={t}
                      className="font-mono text-xs px-3 py-1 bg-[var(--bg-tertiary)] rounded text-[var(--accent-secondary)]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </TiltCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
