'use client';

import clsx from 'clsx';
import { useInView } from '@/hooks/useInView';
import { useTranslations } from 'next-intl';

export function BusinessHero() {
  const { ref, inView } = useInView();
  const t = useTranslations('business.hero');
  const points = t.raw('points') as string[];

  return (
    <section className="pt-28 pb-16 md:pb-24 relative z-[1]" id="top">
      <div className="max-w-[1200px] mx-auto px-6">
        <div
          ref={ref}
          className={clsx(
            'max-w-[800px] transition-all duration-600',
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          <span className="font-mono text-sm text-[var(--accent-primary)] block mb-4">
            {t('section')}
          </span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            {t('title')}
          </h1>
          <p className="text-lg text-[var(--text-secondary)] mb-8 leading-relaxed">
            {t('lead')}
          </p>
          <ul className="space-y-3 text-[var(--text-secondary)]">
            {points.map((p) => (
              <li key={p} className="flex gap-3 items-start">
                <span className="text-[var(--accent-primary)] mt-1">▹</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
