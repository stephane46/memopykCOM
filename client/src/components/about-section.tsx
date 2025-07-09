import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

export function AboutSection() {
  const { t } = useLanguage();

  return (
    <section id="a-propos" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-playfair text-4xl lg:text-5xl font-bold text-memopyk-navy mb-6">
              {t('about.title', { fr: 'À propos de MEMOPYK', en: 'About MEMOPYK' })}
            </h2>
            <p className="text-lg text-memopyk-blue mb-6 leading-relaxed">
              {t('about.description1', { 
                fr: 'MEMOPYK transforme vos photos et vidéos personnelles en films mémoire cinématographiques grâce à nos monteurs experts. Sans intelligence artificielle, nous créons des expériences narratives authentiques qui préservent l\'essence de vos souvenirs familiaux.',
                en: 'MEMOPYK transforms your personal photos and videos into cinematic memory films through our expert editors. Without artificial intelligence, we create authentic narrative experiences that preserve the essence of your family memories.'
              })}
            </p>
            <p className="text-lg text-memopyk-blue mb-8 leading-relaxed">
              {t('about.description2', { 
                fr: 'Depuis notre création, nous avons aidé plus de 1000 familles à travers le monde à immortaliser leurs moments précieux dans des films professionnels de qualité cinématographique.',
                en: 'Since our founding, we have helped over 1000 families worldwide immortalize their precious moments in professional, cinematic-quality films.'
              })}
            </p>
            <Button 
              className="bg-memopyk-sky hover:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              onClick={() => document.getElementById('processus')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('about.cta', { fr: 'Découvrir notre processus', en: 'Discover our process' })}
            </Button>
          </div>
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
              alt="Professional video editing workspace" 
              className="rounded-2xl shadow-xl w-full" 
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Button 
                size="lg"
                className="bg-memopyk-highlight hover:bg-orange-600 text-white rounded-full p-6 shadow-lg transform hover:scale-110 transition-all"
              >
                <Play className="h-6 w-6 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
