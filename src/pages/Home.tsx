import HeroSlider from '@/components/home/HeroSlider';
import InfoBanner from '@/components/home/InfoBanner';
import CategorySlider from '@/components/home/CategorySlider';
import DiscountBanner from '@/components/common/DiscountBanner';
import ProblemSolver from '@/components/home/ProblemSolver';
import ProductShowcase from '@/components/home/ProductShowcase';
import AboutSection from '@/components/home/AboutSection';
import SEOHead from '@/components/seo/SEOHead';
import { OrganizationStructuredData } from '@/components/seo/StructuredData';

export default function Home() {
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://svitanok.com';
  
  return (
    <>
      <SEOHead
        title="Головна"
        description="Svitanok - якісна косметика для догляду за шкірою. Широкий асортимент продуктів для здорової та красивої шкіри."
        url="/"
        type="website"
      />
      <OrganizationStructuredData
        organization={{
          name: 'Svitanok',
          url: siteUrl,
          logo: `${siteUrl}/images/logo.png`,
        }}
      />
      <div>
      {}
      <HeroSlider />

      {}
      <InfoBanner />

      {}
      <CategorySlider />

      {}
      <ProblemSolver />

      {}
      <ProductShowcase />

      {}
      <AboutSection />

      {}
      
      {}
      <DiscountBanner />
    </div>
    </>
  );
}