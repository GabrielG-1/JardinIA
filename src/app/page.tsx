import { HeroSection } from '@/components/sections/hero';
import { CatalogSection } from '@/components/sections/catalog';
import { AiAdvisorSection } from '@/components/sections/ai-advisor';
import { CommunitySection } from '@/components/sections/community';
import { ContactSection } from '@/components/sections/contact';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CatalogSection />
      <AiAdvisorSection />
      <CommunitySection />
      <ContactSection />
    </>
  );
}
