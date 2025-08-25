import { HeroSection } from '@/components/sections/hero';
import { CatalogSection } from '@/components/sections/catalog';
import { AiAdvisorSection } from '@/components/sections/ai-advisor';
import { CommunitySection } from '@/components/sections/community';
import { ContactSection } from '@/components/sections/contact';
import { LocationSection } from '@/components/sections/location';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CatalogSection />
      <AiAdvisorSection />
      <CommunitySection />
      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 py-20 px-4">
        <ContactSection />
        <LocationSection />
      </div>
    </>
  );
}
