import { getLocale } from 'next-intl/server';
import { siteOrigin } from '@/lib/seo';
import type { Metadata } from 'next';
import { JetBrains_Mono, Onest } from 'next/font/google';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-mono',
});

const onest = Onest({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: {
    default: 'Сабиров Савелий — Software Developer & DevOps Enthusiast',
    template: '%s | Sabirov Saveliy',
  },
  description: 'Сабиров Савелий — C# и Python разработчик, DevOps. Создаю надежные и масштабируемые решения для государственных информационных систем. ГНИВЦ, ФНС России.',
  keywords: [
    'C#',
    '.NET',
    'Python',
    'FastAPI',
    'Software Developer',
    'DevOps',
    'Docker',
    'Kubernetes',
    'PostgreSQL',
    'Kafka',
    'Backend Developer',
    'Сабиров Савелий',
    'Sabirov Saveliy',
  ],
  authors: [{ name: 'Сабиров Савелий Русланович', url: siteOrigin }],
  creator: 'Сабиров Савелий Русланович',
  publisher: 'Сабиров Савелий Русланович',
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E⚡%3C/text%3E%3C/svg%3E",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f9fc' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={await getLocale()} suppressHydrationWarning>
      <head>
        <link rel="preload" href="/avatar.jpg" as="image" />
        {/* Set neutral loading state synchronously before hydration to prevent accent-color flash */}
        <script dangerouslySetInnerHTML={{ __html: `document.documentElement.setAttribute('data-status','loading')` }} />
      </head>
      <body className={`${jetbrainsMono.variable} ${onest.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
