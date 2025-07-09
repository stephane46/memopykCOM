import { LanguageProvider as BaseLanguageProvider } from "@/hooks/use-language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  return <BaseLanguageProvider>{children}</BaseLanguageProvider>;
}
