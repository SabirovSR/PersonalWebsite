import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ParallaxBackground } from '@/components/ParallaxBackground';
import { FloatingParticles } from '@/components/FloatingParticles';
import { Terminal } from '@/components/Terminal';

// Force dynamic rendering for i18n routes
export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// JSON-LD structured data
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Сабиров Савелий Русланович',
  alternateName: 'Sabirov Saveliy',
  url: 'https://sabirov.tech',
  image: 'https://sabirov.tech/avatar.jpg',
  jobTitle: 'Software Developer',
  worksFor: {
    '@type': 'Organization',
    name: 'ГНИВЦ',
    description: 'Генеральный подрядчик ФНС России',
  },
  knowsAbout: [
    'C#',
    '.NET',
    'Python',
    'FastAPI',
    'Docker',
    'Kubernetes',
    'PostgreSQL',
    'DevOps',
    'Backend Development',
    'Software Engineering',
  ],
  sameAs: [
    'https://github.com/SabirovSR',
    'https://t.me/savik175',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'contact@sabirov.tech',
    contactType: 'Professional',
  },
};

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <ParallaxBackground />
            <FloatingParticles />
            <Terminal />
            <div className="bg-grid" />
            <div className="bg-gradient-overlay" />
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
