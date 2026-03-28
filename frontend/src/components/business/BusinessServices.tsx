'use client';

import clsx from 'clsx';
import { useInView } from '@/hooks/useInView';
import { TiltCard } from '@/components/TiltCard';
import { useTranslations } from 'next-intl';

export function BusinessServices() {
  const { ref, inView } = useInView();
  const t = useTranslations('business.services');

  const items = t.raw('items') as Array<{
    icon: string;
    title: string;
    problem: string;
    solution: string;
    stack: string;
  }>;

  return (
    <section className="py-16 md:py-24 relative z-[1]" id="services">
      <div className="max-w-[1200px] mx-auto px-6">
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
          <p className="text-lg text-[var(--text-secondary)] max-w-[640px] mx-auto">
            {t('description')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <TiltCard
              key={item.title}
              className={clsx(
                'card overflow-hidden card-shadow-lg transition-all duration-600 h-full',
                inView ? 'translate-y-0' : 'translate-y-8'
              )}
            >
              <div style={{ transitionDelay: `${(i + 1) * 80}ms` }} className="flex flex-col h-full">
                <div className="h-[140px] bg-[var(--bg-tertiary)] flex items-center justify-center text-5xl border-b border-[var(--border-color)]">
                  {item.icon}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-3">
                    <span className="font-mono text-[var(--accent-primary)] text-xs block mb-1">
                      {t('problemLabel')}
                    </span>
                    {item.problem}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)] mb-3 flex-1">
                    <span className="font-mono text-[var(--accent-primary)] text-xs block mb-1">
                      {t('solutionLabel')}
                    </span>
                    {item.solution}
                  </p>
                  <p className="font-mono text-xs text-[var(--accent-secondary)] border-t border-[var(--border-color)] pt-3">
                    {item.stack}
                  </p>
                </div>
              </div>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
}
