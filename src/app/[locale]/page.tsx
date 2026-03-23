import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { NeuronGlowProvider } from '@/contexts/NeuronGlowContext';

export default function HomePage() {
  return (
    <NeuronGlowProvider>
      <Navbar />
      <HeroSection />
    </NeuronGlowProvider>
  );
}
