import { useLanguage } from "@/hooks/use-language";
import { Clock, Crosshair, Heart, Smile } from "lucide-react";

export function WhyMemopykSection() {
  const { t } = useLanguage();

  const features = [
    {
      icon: Clock,
      title: { fr: 'Gain de temps', en: 'Time Saving' },
      description: { 
        fr: 'Nos monteurs experts créent votre film en quelques semaines, vous évitant des mois d\'apprentissage du montage vidéo.',
        en: 'Our expert editors create your film in just weeks, saving you months of learning video editing.'
      }
    },
    {
      icon: Crosshair,
      title: { fr: 'Simple', en: 'Simple' },
      description: { 
        fr: 'Interface intuitive, communication claire et tarification transparente. Collaborez facilement en famille.',
        en: 'Intuitive interface, clear communication and transparent pricing. Collaborate easily as a family.'
      }
    },
    {
      icon: Heart,
      title: { fr: 'Personnalisé', en: 'Personalized' },
      description: { 
        fr: 'Chaque film est unique, créé spécialement pour votre histoire familiale avec consultation personnelle.',
        en: 'Each film is unique, specially created for your family story with personal consultation.'
      }
    },
    {
      icon: Smile,
      title: { fr: 'Sans stress', en: 'Stress-Free' },
      description: { 
        fr: 'Gestion professionnelle complète avec sécurité entreprise et support dédié. Plus de 1000 familles nous font confiance.',
        en: 'Complete professional management with enterprise security and dedicated support. Over 1000 families trust us.'
      }
    }
  ];

  return (
    <section id="pourquoi" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-playfair text-4xl lg:text-5xl font-bold text-memopyk-navy mb-6">
            {t('why.title', { fr: 'Pourquoi MEMOPYK', en: 'Why MEMOPYK' })}
          </h2>
          <p className="text-xl text-memopyk-blue max-w-3xl mx-auto">
            {t('why.subtitle', { 
              fr: 'Les avantages qui font de MEMOPYK le choix privilégié des familles pour préserver leurs souvenirs',
              en: 'The advantages that make MEMOPYK the preferred choice for families to preserve their memories'
            })}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            
            return (
              <div key={index} className="text-center group">
                <div className="w-20 h-20 bg-memopyk-cream rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-memopyk-highlight transition-colors">
                  <IconComponent className="h-10 w-10 text-memopyk-navy group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-playfair text-2xl font-bold text-memopyk-navy mb-4">
                  {t(`why.feature${index + 1}.title`, feature.title)}
                </h3>
                <p className="text-memopyk-blue leading-relaxed">
                  {t(`why.feature${index + 1}.description`, feature.description)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
