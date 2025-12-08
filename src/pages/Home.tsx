import HeroSlider from '@/components/home/HeroSlider';
import InfoBanner from '@/components/home/InfoBanner';
import CategorySlider from '@/components/home/CategorySlider';
import DiscountBanner from '@/components/common/DiscountBanner';
import ProblemSolver from '@/components/home/ProblemSolver';
import ProductShowcase from '@/components/home/ProductShowcase';
import AboutSection from '@/components/home/AboutSection';
import BenefitsSlider from '@/components/home/BenefitsSlider';
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
      {/* Hero Slider */}
      <HeroSlider />

      {/* Info Banner */}
      <InfoBanner />

      {/* Category Slider */}
      <CategorySlider />

      {/* Problem Solver */}
      <ProblemSolver />

      {/* Product Showcase */}
      <ProductShowcase />

      {/* About Brand Section */}
      <AboutSection />

      {/* Benefits Slider */}
      <BenefitsSlider />

      {/* Discount Banner (only for non-authenticated users) */}
      <DiscountBanner />
    </div>
    </>
  );
}