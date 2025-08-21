import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { HeroSection } from '@/components/sections/hero';
import { CatalogSection } from '@/components/sections/catalog';
import { AiAdvisorSection } from '@/components/sections/ai-advisor';
import { CommunitySection } from '@/components/sections/community';
import { ContactSection } from '@/components/sections/contact';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <CatalogSection />
        <AiAdvisorSection />
        <CommunitySection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
