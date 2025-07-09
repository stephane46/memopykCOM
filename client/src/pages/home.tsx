import { Header } from "@/components/header";
import { HeroVideoCarousel } from "@/components/hero-video-carousel";
import { AboutSection } from "@/components/about-section";
import { StepsSection } from "@/components/steps-section";
import { WhyMemopykSection } from "@/components/why-memopyk-section";
import { GallerySection } from "@/components/gallery-section";
import { ContactSection } from "@/components/contact-section";
import { FaqSection } from "@/components/faq-section";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div className="scroll-smooth">
      <Header />
      <HeroVideoCarousel />
      <AboutSection />
      <StepsSection />
      <WhyMemopykSection />
      <GallerySection />
      <ContactSection />
      <FaqSection />
      <Footer />
    </div>
  );
}
