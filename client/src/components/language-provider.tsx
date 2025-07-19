import { LanguageProvider as BaseLanguageProvider, useLanguage } from "@/hooks/use-language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  return <BaseLanguageProvider>{children}</BaseLanguageProvider>;
}

// Re-export useLanguage for components that import from this file
export { useLanguage };
