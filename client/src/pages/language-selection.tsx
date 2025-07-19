import { useEffect } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import { LanguageSelector } from "@/components/language-selector";
import SeoHead from "@/components/seo-head";

export default function LanguageSelectionPage() {
  const [, setLocation] = useLocation();
  const { detectLanguageFromPath } = useLanguage();

  useEffect(() => {
    // If we're already on a language-specific path, don't show this page
    const detectedLanguage = detectLanguageFromPath();
    if (detectedLanguage) {
      return; // Let the regular routing handle it
    }

    // Check if user has a saved preference and redirect them
    const savedLanguage = localStorage.getItem('memopyk-language-v2');
    if (savedLanguage && (savedLanguage === 'fr-FR' || savedLanguage === 'en-US')) {
      setLocation(`/${savedLanguage}/`);
      return;
    }
  }, [detectLanguageFromPath, setLocation]);

  const handleLanguageSelect = (language: 'fr-FR' | 'en-US') => {
    // Navigation is handled by LanguageSelector component
    console.log(`Language selected: ${language}`);
  };

  return (
    <>
      <SeoHead 
        page="language-selection"
        title="MEMOPYK - Choose your language / Choisissez votre langue"
        description="Select your preferred language for MEMOPYK memory film service. Sélectionnez votre langue préférée pour le service de films mémoire MEMOPYK."
        noIndex={true}
      />
      <LanguageSelector onLanguageSelect={handleLanguageSelect} />
    </>
  );
}