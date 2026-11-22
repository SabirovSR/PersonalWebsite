import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';

export const siteOrigin = new URL(process.env.SITE_URL ?? 'https://website.lab.sabirov.tech').origin;

export function languages(path: string) {
  return {
    ru: `${siteOrigin}/ru${path}`,
    en: `${siteOrigin}/en${path}`,
    'x-default': `${siteOrigin}/ru${path}`,
  };
}

export async function pageMetadata(locale: Locale, path: '' | '/business'): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: path ? 'business.meta' : 'meta' });
  const title = t('title');
  const description = t('description');
  const urls = languages(path);
  const canonical = urls[locale];
  return {
    title: { absolute: title },
    description,
    alternates: { canonical, languages: urls },
    openGraph: {
      type: 'website', title, description, url: canonical,
      locale: locale === 'ru' ? 'ru_RU' : 'en_US',
      alternateLocale: locale === 'ru' ? 'en_US' : 'ru_RU',
      images: ['/avatar.jpg'],
    },
    twitter: { card: 'summary', title, description, images: ['/avatar.jpg'] },
  };
}
