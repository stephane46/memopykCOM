import { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";

// Updated to use full IETF language codes
type Language = 'fr-FR' | 'en-US';
type LegacyLanguage = 'fr' | 'en'; // For backward compatibility

interface LanguageContextType {
  language: Language;
  legacyLanguage: LegacyLanguage; // For components still using old format
  setLanguage: (lang: Language) => void;
  getLanguagePath: (path: string) => string;
  detectLanguageFromPath: () => Language | null;
  t: (key: string, options?: { fr: string; en: string }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Map IETF codes to legacy codes for backward compatibility
const toLegacyLanguage = (lang: Language): LegacyLanguage => {
  return lang === 'fr-FR' ? 'fr' : 'en';
};

// Detect language from browser Accept-Language header
const detectBrowserLanguage = (): Language => {
  if (typeof window === 'undefined') return 'fr-FR';
  
  const browserLang = navigator.language || navigator.languages?.[0];
  if (browserLang?.startsWith('en')) return 'en-US';
  return 'fr-FR'; // Default to French
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [language, setLanguageState] = useState<Language>('fr-FR');

  // Detect language from URL path
  const detectLanguageFromPath = (): Language | null => {
    const pathParts = location.split('/').filter(Boolean);
    const firstPart = pathParts[0];
    
    if (firstPart === 'fr-FR') return 'fr-FR';
    if (firstPart === 'en-US') return 'en-US';
    return null;
  };

  // Generate language-prefixed paths
  const getLanguagePath = (path: string): string => {
    const currentLang = detectLanguageFromPath() || language;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `/${currentLang}/${cleanPath}`.replace(/\/$/, '') || `/${currentLang}`;
  };

  useEffect(() => {
    // Priority: URL > localStorage > browser detection
    const pathLanguage = detectLanguageFromPath();
    if (pathLanguage) {
      setLanguageState(pathLanguage);
      document.documentElement.lang = toLegacyLanguage(pathLanguage);
      return;
    }

    const savedLanguage = localStorage.getItem('memopyk-language-v2') as Language;
    if (savedLanguage && (savedLanguage === 'fr-FR' || savedLanguage === 'en-US')) {
      setLanguageState(savedLanguage);
      document.documentElement.lang = toLegacyLanguage(savedLanguage);
      return;
    }

    // Fallback to browser detection
    const detectedLanguage = detectBrowserLanguage();
    setLanguageState(detectedLanguage);
    document.documentElement.lang = toLegacyLanguage(detectedLanguage);
  }, [location]);

  const handleSetLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('memopyk-language-v2', lang);
    document.documentElement.lang = toLegacyLanguage(lang);
  };

  const t = (key: string, options?: { fr: string; en: string }) => {
    if (options) {
      const legacyLang = toLegacyLanguage(language);
      return options[legacyLang];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{
      language,
      legacyLanguage: toLegacyLanguage(language),
      setLanguage: handleSetLanguage,
      getLanguagePath,
      detectLanguageFromPath,
      t
    }}>
      {children}
    </LanguageContext.Provider>
  );
}
