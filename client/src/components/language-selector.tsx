import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, ArrowRight } from "lucide-react";

interface LanguageSelectorProps {
  onLanguageSelect: (language: 'fr-FR' | 'en-US') => void;
}

export function LanguageSelector({ onLanguageSelect }: LanguageSelectorProps) {
  const [, setLocation] = useLocation();
  const { setLanguage } = useLanguage();
  
  const handleLanguageSelection = (lang: 'fr-FR' | 'en-US') => {
    // Set language in context and localStorage
    setLanguage(lang);
    
    // Navigate to language-specific homepage  
    setLocation(`/${lang}/`);
    
    // Notify parent component
    onLanguageSelect(lang);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-memopyk-cream via-white to-memopyk-sky-blue flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <Globe className="w-16 h-16 mx-auto text-memopyk-navy mb-4" />
            <h1 className="text-2xl font-bold text-memopyk-navy mb-2">
              Welcome to MEMOPYK
            </h1>
            <p className="text-memopyk-dark-blue">
              Choose your preferred language / Choisissez votre langue
            </p>
          </div>
          
          <div className="space-y-4">
            <Button
              onClick={() => handleLanguageSelection('fr-FR')}
              className="w-full h-14 text-lg bg-memopyk-navy hover:bg-memopyk-dark-blue text-white group transition-all duration-300"
            >
              <span className="mr-3">🇫🇷</span>
              Français (France)
              <ArrowRight className="w-5 h-5 ml-auto group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button
              onClick={() => handleLanguageSelection('en-US')}
              className="w-full h-14 text-lg bg-memopyk-dark-blue hover:bg-memopyk-navy text-white group transition-all duration-300"
            >
              <span className="mr-3">🇺🇸</span>
              English (United States)  
              <ArrowRight className="w-5 h-5 ml-auto group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          
          <p className="text-sm text-memopyk-blue-gray mt-6">
            Your language preference will be saved for future visits
          </p>
        </CardContent>
      </Card>
    </div>
  );
}