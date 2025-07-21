import { useLanguage } from "@/hooks/use-language";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Edit } from "lucide-react";

interface CTASettings {
  id: string;
  titleFr: string;
  titleEn: string;
  subtitleFr: string;
  subtitleEn: string;
  button1TextFr: string;
  button1TextEn: string;
  button1UrlFr: string;
  button1UrlEn: string;
  button2TextFr: string;
  button2TextEn: string;
  button2UrlFr: string;
  button2UrlEn: string;
  isActive: boolean;
}

export default function CtaSection() {
  const { language } = useLanguage();
  
  const { data: ctaSettings } = useQuery({
    queryKey: ['/api/cta-settings/active'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const settings: CTASettings = ctaSettings || {
    id: 'default',
    titleFr: 'Contactez-nous ou demandez un devis personnalisé.',
    titleEn: 'Connect with us or request a personalized quote.',
    subtitleFr: 'Nous sommes là pour répondre à vos questions et vous aider à démarrer.',
    subtitleEn: 'We\'re here to answer your questions and help you get started.',
    button1TextFr: 'Prendre un rdv',
    button1TextEn: 'Book a Call',
    button1UrlFr: '#contact',
    button1UrlEn: '#contact',
    button2TextFr: 'Devis rapide',
    button2TextEn: 'Quick Quote',
    button2UrlFr: '#quote',
    button2UrlEn: '#quote',
    isActive: true
  };

  const title = language === 'fr' ? settings.titleFr : settings.titleEn;
  const subtitle = language === 'fr' ? settings.subtitleFr : settings.subtitleEn;
  const button1Text = language === 'fr' ? settings.button1TextFr : settings.button1TextEn;
  const button1Url = language === 'fr' ? settings.button1UrlFr : settings.button1UrlEn;
  const button2Text = language === 'fr' ? settings.button2TextFr : settings.button2TextEn;
  const button2Url = language === 'fr' ? settings.button2UrlFr : settings.button2UrlEn;

  return (
    <section id="contact" className="py-20 px-4" style={{ backgroundColor: '#2A4759' }}>
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 font-poppins">
          {title}
        </h2>
        <p className="text-lg text-white/90 mb-10 max-w-2xl mx-auto">
          {subtitle}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={button1Url}
            className="inline-flex items-center justify-center px-8 py-4 rounded-lg font-medium transition-all duration-300 hover:scale-105"
            style={{ backgroundColor: '#D67C4A', color: 'white' }}
          >
            <Calendar className="w-5 h-5 mr-2" />
            {button1Text}
          </a>
          
          <a
            href={button2Url}
            className="inline-flex items-center justify-center px-8 py-4 rounded-lg font-medium transition-all duration-300 hover:scale-105"
            style={{ backgroundColor: '#D67C4A', color: 'white' }}
          >
            <Edit className="w-5 h-5 mr-2" />
            {button2Text}
          </a>
        </div>
      </div>
    </section>
  );
}