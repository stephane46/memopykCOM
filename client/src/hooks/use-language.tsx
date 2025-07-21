import React from "react";

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

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined);

export function useLanguage(): LanguageContextType {
  const context = React.useContext(LanguageContext);
  if (context === undefined) {
    // Return a default context instead of throwing
    return {
      language: 'fr-FR',
      legacyLanguage: 'fr',
      setLanguage: () => {},
      getLanguagePath: (path: string) => path,
      detectLanguageFromPath: () => null,
      t: (key: string, options?: { fr: string; en: string }) => options?.fr || key
    };
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
  const [language, setLanguageState] = React.useState<Language>('fr-FR');

  // Detect language from URL path using browser location
  const detectLanguageFromPath = (): Language | null => {
    if (typeof window === 'undefined') return null;
    try {
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      const firstPart = pathParts[0];
      
      if (firstPart === 'fr-FR') return 'fr-FR';
      if (firstPart === 'en-US') return 'en-US';
      return null;
    } catch (error) {
      return null;
    }
  };

  // Generate language-prefixed paths
  const getLanguagePath = (path: string): string => {
    const currentLang = detectLanguageFromPath() || language;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `/${currentLang}/${cleanPath}`.replace(/\/$/, '') || `/${currentLang}`;
  };

  React.useEffect(() => {
    // Update language when URL changes
    const updateLanguageFromURL = () => {
      const urlLang = detectLanguageFromPath();
      if (urlLang && urlLang !== language) {
        setLanguageState(urlLang);
      }
    };

    updateLanguageFromURL();
    window.addEventListener('popstate', updateLanguageFromURL);
    
    return () => {
      window.removeEventListener('popstate', updateLanguageFromURL);
    };
  }, [language]);

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
  };

  // Simple translation function
  const t = (key: string, options?: { fr: string; en: string }) => {
    const currentLang = detectLanguageFromPath() || language;
    const legacyLang = toLegacyLanguage(currentLang);
    
    if (legacyLang === 'fr') {
      return options?.fr || key;
    }
    return options?.en || key;
  };

  const value: LanguageContextType = {
    language,
    legacyLanguage: toLegacyLanguage(language),
    setLanguage,
    getLanguagePath,
    detectLanguageFromPath,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}