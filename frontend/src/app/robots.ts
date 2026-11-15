import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/', '/static/'],
      },
    ],
    sitemap: (process.env.SITE_URL ?? 'https://sabirov.tech') + '/sitemap.xml',
    host: (process.env.SITE_URL ?? 'https://sabirov.tech'),
  };
}
