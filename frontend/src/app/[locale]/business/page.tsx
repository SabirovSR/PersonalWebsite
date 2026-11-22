import { pageMetadata } from '@/lib/seo';
import type { Locale } from '@/i18n';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Contact } from '@/components/Contact';
import { StatusThemeSync } from '@/components/StatusThemeSync';
import { BusinessHero } from '@/components/business/BusinessHero';
import { BusinessServices } from '@/components/business/BusinessServices';
import { BusinessPricing } from '@/components/business/BusinessPricing';
import { fetchStatus } from '@/lib/api.server';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return pageMetadata(locale, '/business');
}

export default async function BusinessPage() {
  const initialStatus = await fetchStatus();

  return (
    <main>
      <StatusThemeSync initialStatus={initialStatus} />
      <Navigation />
      <BusinessHero />
      <BusinessServices />
      <BusinessPricing />
      <Contact
        hasBlog={false}
        formSource="business"
        showTariffSelect
        contactHeaderScope="business"
      />
      <Footer />
    </main>
  );
}
