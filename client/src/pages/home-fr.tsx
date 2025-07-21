import { useLocation } from "wouter";
import { useEffect } from "react";
import SeoHead from "@/components/seo-head";
import { LanguageProvider } from "@/hooks/use-language";
import { Header } from "@/components/header";
import HeroVideoCarousel from "@/components/hero-video-carousel-simple";
import KeyVisualSection from "@/components/key-visual-section";
import HowItWorksSection from "@/components/how-it-works-section";
import GallerySection from "@/components/gallery-section-final2025";
import WhyMemopykSection from "@/components/why-memopyk-section";
import ContactSection from "@/components/contact-section";
import FAQSection from "@/components/faq-section";
import Footer from "@/components/footer";

export default function HomeFr() {
  const [location, navigate] = useLocation();

  // Force French language context
  useEffect(() => {
    const html = document.documentElement;
    html.lang = "fr-FR";
    html.dir = "ltr";
  }, []);

  return (
    <LanguageProvider>
      <SeoHead 
        page="home"
        title="MEMOPYK - Films de Mémoire Professionnels"
        description="Transformez vos photos et vidéos personnelles en films de mémoire cinématographiques professionnels. Service bilingue français-anglais avec expertise créative."
        canonicalUrl="/fr-FR"
        alternateUrls={{
          "fr-FR": "/fr-FR",
          "en-US": "/en-US"
        }}
        ogImage="/og-image-fr.jpg"
      />
      
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Header />
        <HeroVideoCarousel />
        <KeyVisualSection />
        <HowItWorksSection />
        <GallerySection />
        <WhyMemopykSection />
        <ContactSection />
        <FAQSection />
        <Footer />
      </div>
    </LanguageProvider>
  );
}