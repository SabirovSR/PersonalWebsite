'use client';

import { useInView } from '@/hooks/useInView';
import clsx from 'clsx';
import { TiltCard } from './TiltCard';
import { useTranslations } from 'next-intl';

export function About() {
  const { ref, inView } = useInView();
  const t = useTranslations('about');
  
  const stats = t.raw('stats') as Array<{ number: string; label: string; sublabel?: string }>;
  const terminalLines = t.raw('terminal.lines') as Array<{ prompt?: boolean; command?: string; output?: string; cursor?: boolean }>;

  return (
    <section className="py-20 md:py-32 relative z-[1]" id="about">
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

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Text content */}
          <div className={clsx(
            'transition-all duration-600 delay-200',
            inView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
          )}>
            <h3 className="text-2xl font-bold text-[var(--accent-primary)] mb-5">
              {t('text1')}
            </h3>
            
            <div className="space-y-4 text-[var(--text-secondary)] text-lg">
              <p>
                {t('text2')}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 mt-10">
              {stats.map((stat, i) => (
                <TiltCard
                  key={stat.label}
                  className={clsx(
                    'card p-6 transition-all duration-600',
                    inView ? 'translate-y-0' : 'translate-y-8'
                  )}
                >
                  <div
                    style={{ transitionDelay: `${(i + 1) * 100}ms` }}
                  >
                    <div className="text-4xl font-bold text-[var(--accent-primary)] font-mono">
                      {stat.number}
                    </div>
                    <div className="text-sm text-[var(--text-secondary)] mt-2">
                      {stat.label}
                      {stat.sublabel && (
                        <span className="block text-xs text-[var(--accent-primary)] mt-1">
                          {stat.sublabel}
                        </span>
                      )}
                    </div>
                  </div>
                </TiltCard>
              ))}
            </div>
          </div>

          {/* Terminal */}
          <div className={clsx(
            'card overflow-hidden transition-all duration-600 delay-300',
            inView ? 'translate-x-0' : 'translate-x-8'
          )}>
            {/* Terminal header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
              <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <span className="w-3 h-3 rounded-full bg-[#28ca42]" />
              <span className="ml-auto font-mono text-xs text-[var(--text-muted)]">
                sabirov@dev:~
              </span>
            </div>

            {/* Terminal body */}
            <div className="p-5 font-mono text-sm leading-7">
              {terminalLines.map((line, i) => (
                <div key={i} className={line.output ? 'pl-5 text-[var(--text-secondary)]' : ''}>
                  {line.prompt && (
                    <>
                      <span className="text-[var(--accent-primary)]">$</span>
                      <span className="text-[var(--text-primary)]">{line.command}</span>
                    </>
                  )}
                  {line.output && line.output}
                  {line.cursor && <span className="terminal-cursor" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
