// Simple language hook without React dependencies
export function useLanguage() {
  // Get language from URL path
  const detectLanguageFromPath = () => {
    if (typeof window === 'undefined') return 'fr';
    
    try {
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      const firstPart = pathParts[0];
      
      if (firstPart === 'en-US') return 'en';
      return 'fr'; // Default to French
    } catch {
      return 'fr';
    }
  };

  const language = detectLanguageFromPath();

  return {
    language: language === 'fr' ? 'fr-FR' : 'en-US',
    legacyLanguage: language,
    setLanguage: () => {},
    getLanguagePath: (path: string) => path,
    detectLanguageFromPath: () => null,
    t: (key: string, options?: { fr: string; en: string }) => {
      if (language === 'fr') {
        return options?.fr || key;
      }
      return options?.en || key;
    }
  };
}

// Simple provider that just wraps children without React
export function LanguageProvider({ children }: { children: any }) {
  // Use pure JavaScript/DOM to avoid React dependency
  if (typeof children === 'object' && children.props) {
    return children;
  }
  return children || null;
}