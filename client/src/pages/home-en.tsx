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

export default function HomeEn() {
  const [location, navigate] = useLocation();

  // Force English language context
  useEffect(() => {
    const html = document.documentElement;
    html.lang = "en-US";
    html.dir = "ltr";
  }, []);

  return (
    <LanguageProvider>
      <SeoHead 
        page="home"
        title="MEMOPYK - Professional Memory Films"
        description="Transform your personal photos and videos into professional cinematic memory films. Bilingual French-English service with creative expertise."
        canonicalUrl="/en-US"
        alternateUrls={{
          "fr-FR": "/fr-FR",
          "en-US": "/en-US"
        }}
        ogImage="/og-image-en.jpg"
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