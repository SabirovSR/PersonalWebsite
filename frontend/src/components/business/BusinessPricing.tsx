'use client';

import clsx from 'clsx';
import { useInView } from '@/hooks/useInView';
import { useTranslations } from 'next-intl';
import { TiltCard } from '@/components/TiltCard';

export function BusinessPricing() {
  const { ref, inView } = useInView();
  const t = useTranslations('business.pricing');

  const tiers = t.raw('tiers') as Array<{
    id: string;
    name: string;
    price: string;
    time: string;
    features: string[];
  }>;
  const exampleItems = t.raw('examples.items') as Array<{ text: string }>;

  return (
    <section className="py-16 md:py-24 relative z-[1]" id="pricing">
      <div className="max-w-[1200px] mx-auto px-6">
        <div
          ref={ref}
          className={clsx(
            'text-center mb-14 transition-all duration-600',
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

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {tiers.map((tier, i) => (
            <div
              key={tier.id}
              className={clsx(
                'transition-all duration-600 h-full',
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              )}
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <TiltCard
                className={clsx(
                  'card p-6 md:p-8 card-shadow-lg flex flex-col h-full min-h-[200px]'
                )}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                  <h3 className="text-xl font-bold">{tier.name}</h3>
                  <span className="font-mono text-sm text-[var(--accent-primary)]">{tier.time}</span>
                </div>
                <p className="text-lg font-mono text-[var(--accent-secondary)] mb-6">{tier.price}</p>
                <ul className="space-y-2 text-sm text-[var(--text-secondary)] flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-[var(--accent-primary)]">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </TiltCard>
            </div>
          ))}
        </div>

        <div
          className={clsx(
            'transition-all duration-600 mb-12',
            inView ? 'opacity-100' : 'opacity-0'
          )}
        >
          <TiltCard className="card p-8 md:p-10 border-[var(--accent-primary)]/30 h-full">
            <h3 className="text-xl font-bold mb-3">{t('retainer.title')}</h3>
            <p className="text-[var(--text-secondary)] mb-2 leading-relaxed">{t('retainer.description')}</p>
            <p className="text-sm font-mono text-[var(--accent-primary)]">{t('retainer.note')}</p>
          </TiltCard>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-4 text-center">{t('examples.title')}</h3>
          <ul className="max-w-[720px] mx-auto space-y-3 text-[var(--text-secondary)] text-sm md:text-base">
            {exampleItems.map((ex) => (
              <li key={ex.text} className="flex gap-3 items-start">
                <span className="text-[var(--accent-primary)]">📦</span>
                <span>{ex.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
