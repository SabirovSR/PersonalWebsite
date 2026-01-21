import type { Metadata } from 'next';
import { JetBrains_Mono, Outfit } from 'next/font/google';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-mono',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://sabirov.tech'),
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
  authors: [{ name: 'Сабиров Савелий Русланович', url: 'https://sabirov.tech' }],
  creator: 'Сабиров Савелий Русланович',
  publisher: 'Сабиров Савелий Русланович',
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E⚡%3C/text%3E%3C/svg%3E",
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    alternateLocale: ['en_US'],
    url: 'https://sabirov.tech',
    title: 'Сабиров Савелий — Software Developer & DevOps',
    description: 'Backend разработчик и DevOps инженер. Специализируюсь на C#, Python, Docker и Kubernetes.',
    siteName: 'Sabirov Saveliy Portfolio',
    images: [
      {
        url: '/avatar.jpg',
        width: 350,
        height: 350,
        alt: 'Сабиров Савелий',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Сабиров Савелий — Software Developer',
    description: 'Backend Developer & DevOps Enthusiast',
    images: ['/avatar.jpg'],
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
  alternates: {
    canonical: 'https://sabirov.tech',
    languages: {
      'ru-RU': 'https://sabirov.tech/ru',
      'en-US': 'https://sabirov.tech/en',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <head>
        <link rel="preload" href="/avatar.jpg" as="image" />
      </head>
      <body className={`${jetbrainsMono.variable} ${outfit.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
