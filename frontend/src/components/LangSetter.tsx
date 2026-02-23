'use client';

import { useEffect } from 'react';

/**
 * Sets the lang attribute on <html> after mount.
 * Required because the root layout cannot know the current locale,
 * and the locale layout must not render its own <html> element.
 */
export function LangSetter({ lang }: { lang: string }) {
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return null;
}
