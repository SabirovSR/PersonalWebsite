'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import clsx from 'clsx';
import { useInView } from '@/hooks/useInView';
import { TiltCard } from '@/components/TiltCard';

export function BusinessPromo() {
  const { ref, inView } = useInView();
  const t = useTranslations('business.promo');
  const locale = useLocale();
  const badge = t('badge');

  return (
    <section className="py-16 md:py-20 relative z-[1]" id="business-promo">
      <div className="max-w-[1200px] mx-auto px-6">
        <div
          ref={ref}
          className={clsx(
            'transition-all duration-600',
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          <TiltCard
            className={clsx(
              'card p-8 md:p-10 md:flex md:items-center md:justify-between gap-8 card-shadow-lg border border-[var(--accent-primary)]/25'
            )}
          >
            <div className="mb-6 md:mb-0">
              <span className="font-mono text-sm text-[var(--accent-primary)] block mb-2">
                {badge}
              </span>
              <h2 className="text-2xl md:text-3xl font-bold mb-3">{t('title')}</h2>
              <p className="text-[var(--text-secondary)] max-w-[640px] leading-relaxed">
                {t('description')}
              </p>
            </div>
            <Link
              href={`/${locale}/business`}
              className="btn-primary whitespace-nowrap shrink-0 inline-flex justify-center"
            >
              {t('cta')}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </TiltCard>
        </div>
      </div>
    </section>
  );
}
