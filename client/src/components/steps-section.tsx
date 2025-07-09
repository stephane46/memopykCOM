import { useLanguage } from "@/hooks/use-language";
import { CloudUpload, Video, Download, Check } from "lucide-react";

export function StepsSection() {
  const { t } = useLanguage();

  const steps = [
    {
      icon: CloudUpload,
      number: 1,
      title: { fr: 'Téléchargement Sécurisé', en: 'Secure Upload' },
      features: [
        { fr: 'Plateforme sécurisée pour vos médias', en: 'Secure platform for your media' },
        { fr: 'Support de tous formats photo/vidéo', en: 'All photo/video formats supported' },
        { fr: 'Collaboration familiale facilitée', en: 'Easy family collaboration' },
        { fr: 'Stockage entreprise sécurisé', en: 'Enterprise-grade secure storage' }
      ]
    },
    {
      icon: Video,
      number: 2,
      title: { fr: 'Montage Professionnel', en: 'Professional Editing' },
      features: [
        { fr: 'Monteurs experts dédiés', en: 'Dedicated expert editors' },
        { fr: 'Musique personnalisée sélectionnée', en: 'Custom music selection' },
        { fr: 'Approche narrative unique', en: 'Unique storytelling approach' },
        { fr: 'Contrôle qualité multi-étapes', en: 'Multi-stage quality control' }
      ]
    },
    {
      icon: Download,
      number: 3,
      title: { fr: 'Livraison Rapide', en: 'Fast Delivery' },
      features: [
        { fr: 'Délai de 2-3 semaines', en: '2-3 weeks turnaround' },
        { fr: 'Formats HD/4K multiples', en: 'Multiple HD/4K formats' },
        { fr: 'Accès et téléchargement en ligne', en: 'Online access and download' },
        { fr: 'Options physiques USB/DVD', en: 'Physical USB/DVD options' }
      ]
    }
  ];

  return (
    <section id="processus" className="py-20 bg-memopyk-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-playfair text-4xl lg:text-5xl font-bold text-memopyk-navy mb-6">
            {t('steps.title', { fr: '3 Étapes Faciles', en: '3 Easy Steps' })}
          </h2>
          <p className="text-xl text-memopyk-blue max-w-3xl mx-auto">
            {t('steps.subtitle', { 
              fr: 'Un processus simple et professionnel pour transformer vos souvenirs en chef-d\'œuvre cinématographique',
              en: 'A simple and professional process to transform your memories into a cinematic masterpiece'
            })}
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            
            return (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-memopyk-highlight rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <span className="bg-memopyk-sky text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {t('steps.step', { fr: `Étape ${step.number}`, en: `Step ${step.number}` })}
                  </span>
                </div>
                <h3 className="font-playfair text-2xl font-bold text-memopyk-navy mb-4 text-center">
                  {t(`step${step.number}.title`, step.title)}
                </h3>
                <ul className="text-memopyk-blue space-y-2 mb-6">
                  {step.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-memopyk-highlight mr-2 mt-0.5 flex-shrink-0" />
                      <span>{t(`step${step.number}.feature${featureIndex + 1}`, feature)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
