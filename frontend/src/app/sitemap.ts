import type { MetadataRoute } from 'next';
import { locales } from '@/i18n';
import { languages } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/business'].flatMap((path) => {
    const translations = languages(path);
    return locales.map((locale) => ({
      url: translations[locale],
      alternates: { languages: translations },
    }));
  });
}
