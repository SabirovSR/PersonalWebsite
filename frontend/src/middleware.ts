import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n';

export default createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches and for root (`/`) redirects
  defaultLocale: 'ru',

  // Always use prefix for locale (e.g., /ru, /en)
  localePrefix: 'always',

  // Disable detection from Accept-Language and cookies,
  // so sabirov.tech always redirects to /ru
  //localeDetection: false,
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(ru|en)/:path*'],
};
