'use client';

import { useEffect } from 'react';

// Keep the document language in sync on client-side locale changes.
export function LangSetter({ lang }: { lang: string }) {
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return null;
}
