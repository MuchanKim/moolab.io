import { CursorGlow } from '@/components/CursorGlow';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { AboutSection } from '@/components/AboutSection';
import { Footer } from '@/components/Footer';

export default function HomePage() {
  return (
    <>
      <CursorGlow />
      <Navbar />
      <HeroSection />
      <AboutSection />
      <Footer />
    </>
  );
}
