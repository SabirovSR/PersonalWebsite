'use client';

import { AnimatedSection } from './AnimatedSection';
import { TiltCard } from './TiltCard';
import { useTranslations } from 'next-intl';

export function Skills() {
  const t = useTranslations('skills');

  const skillCategories = [
    {
      icon: '💻',
      title: t('categories.development'),
      skills: ['C#', '.NET', 'Python', 'FastAPI', 'REST API'],
    },
    {
      icon: '🗄️',
      title: t('categories.databases'),
      skills: ['PostgreSQL', 'Oracle', 'MongoDB', 'Redis', 'SQL'],
    },
    {
      icon: '⚛️',
      title: t('categories.frontend'),
      skills: ['React*', 'JavaScript', 'TypeScript', 'HTML/CSS'],
    },
    {
      icon: '🐳',
      title: t('categories.devops'),
      skills: ['Docker', 'Git', 'CI/CD', 'Linux', 'Kubernetes*'],
    },
    {
      icon: '📊',
      title: t('categories.monitoring'),
      skills: ['Grafana', 'Prometheus', 'Loki', 'Promtail'],
    },
    {
      icon: '📨',
      title: t('categories.messaging'),
      skills: ['RabbitMQ', 'Celery', 'Kafka*'],
    },
  ];

  return (
    <section className="py-20 md:py-32 relative z-[1]" id="skills">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Header */}
        <AnimatedSection variant="fadeUp" className="text-center mb-16">
          <span className="font-mono text-sm text-[var(--accent-primary)] block mb-4">
            {t('section')}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-[600px] mx-auto">
            {t('description')}
          </p>
        </AnimatedSection>

        {/* Skills grid with stagger animation */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skillCategories.map((category, i) => (
            <AnimatedSection key={category.title} delay={i * 0.1} variant="fadeUp">
              <TiltCard className="card p-8 relative overflow-hidden group h-full">
                <div className="w-[50px] h-[50px] bg-[var(--bg-tertiary)] rounded-xl flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform duration-300">
                  {category.icon}
                </div>

                <h3 className="text-xl font-bold mb-4 text-[var(--text-primary)]">
                  {category.title}
                </h3>

                <div className="flex flex-wrap gap-2">
                  {category.skills.map(skill => (
                    <span key={skill} className="skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </TiltCard>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection delay={0.8} variant="fadeUp">
          <p className="text-center mt-8 font-mono text-sm text-[var(--text-muted)]">
            {t('learning')}
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
}
