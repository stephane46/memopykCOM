import { useLanguage } from '@/hooks/use-language';
import { Clock, Zap, Heart, Smile, Star, CheckCircle } from 'lucide-react';

interface WhyMemopykItem {
  id: string;
  icon: any;
  titleFr: string;
  titleEn: string;
  contentFr: string;
  contentEn: string;
  gradient: string;
}

const whyMemopykItems: WhyMemopykItem[] = [
  {
    id: 'time-saving',
    icon: Clock,
    titleFr: 'Gain de temps',
    titleEn: 'Time saving',
    contentFr: '★ Envoyez-nous vos photos et vidéos telles quelles. Pas besoin de trier, classer, organiser ou renommer.\n\n★ Plusieurs personnes (amis, famille) peuvent participer à l\'étape de téléversement des fichiers sources.',
    contentEn: '★ Give us your source photos and videos as they are. No culling, sorting, organizing or renaming is required.\n\n★ Multiple people (friends, family) can contribute to the source files upload step.',
    gradient: 'from-[#D67C4A] via-[#89BAD9] to-[#8D9FA6]'
  },
  {
    id: 'simple',
    icon: Zap,
    titleFr: 'Simple',
    titleEn: 'Simple',
    contentFr: '★ Nous acceptons tous les formats de fichiers, depuis tous les appareils.\n\n★ Nous nous occupons de tous les aspects techniques (durée, musique, orientation, etc.) et vous proposons un projet sur mesure.',
    contentEn: '★ We accept all file formats, from all devices.\n\n★ We take care of all technical details (duration, music, orientation, etc.) and give you a tailor-made proposal.',
    gradient: 'from-[#2A4759] via-[#011526] to-[#8D9FA6]'
  },
  {
    id: 'personalized',
    icon: Heart,
    titleFr: 'Personnalisé',
    titleEn: 'Personalized',
    contentFr: '★ Nous gérons tous les détails techniques (durée, musique, orientation, etc.) et vous soumettons une proposition adaptée à vos souvenirs.\n\n★ Aucun robot, aucune IA : nous sommes à votre écoute pour comprendre vos envies et vos idées.',
    contentEn: '★ We take care of all technical details (duration, music, orientation, etc.) and give you a tailor-made proposal.\n\n★ No AI nor robot: we are here to listen to your needs and ideas.',
    gradient: 'from-[#89BAD9] via-[#8D9FA6] to-[#2A4759]'
  },
  {
    id: 'stress-free',
    icon: Smile,
    titleFr: 'Sans stress',
    titleEn: 'Stress-free',
    contentFr: '★ Une équipe dédiée pour votre film.\n\n★ Qualité professionnelle.\n\n★ Étapes claires, délais maîtrisés.',
    contentEn: '★ Dedicated team to your film.\n\n★ Professional quality.\n\n★ Clear steps, predictable turnaround.',
    gradient: 'from-[#D67C4A] via-[#011526] to-[#2A4759]'
  }
];

function WhyMemopykSection() {
  const { language } = useLanguage();

  return (
    <section id="pourquoi" className="relative py-24 bg-memopyk-cream overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-memopyk-sky-blue/20 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-memopyk-blue-gray/20 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-memopyk-navy rounded-2xl mb-6 shadow-lg">
            <Star className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold text-memopyk-navy mb-6">
            {language === 'fr' ? 'POURQUOI MEMOPYK' : 'WHY MEMOPYK'}
          </h2>
          
          <p className="text-xl md:text-2xl text-memopyk-dark-blue max-w-4xl mx-auto leading-relaxed">
            {language === 'fr' 
              ? 'Découvrez les avantages qui font de MEMOPYK votre partenaire idéal'
              : 'Discover the advantages that make MEMOPYK your ideal partner'
            }
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {whyMemopykItems.map((item, index) => {
            const Icon = item.icon;
            const title = language === 'fr' ? item.titleFr : item.titleEn;
            const content = language === 'fr' ? item.contentFr : item.contentEn;
            


            return (
              <div
                key={item.id}
                className="relative group transition-all duration-500 hover:transform hover:scale-105 hover:-translate-y-2"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Animated background glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} rounded-3xl blur-lg opacity-20 group-hover:opacity-40 transition-all duration-500 group-hover:scale-110`}></div>
                
                {/* Pulsing border effect */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${item.gradient} opacity-30 group-hover:opacity-60 transition-opacity duration-500`}></div>
                
                {/* Main card */}
                <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl p-6 lg:p-8 shadow-xl border border-white/30 transition-all duration-500 group-hover:shadow-2xl hover:shadow-memopyk-sky-blue/10 h-[420px] flex flex-col">
                  
                  {/* Icon */}
                  <div className="mb-6 flex justify-center">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 relative overflow-hidden`}>
                      {/* Animated shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                      {item.id === 'time-saving' && <Clock className="w-8 h-8 text-white relative z-10" strokeWidth={2.5} />}
                      {item.id === 'simple' && <Zap className="w-8 h-8 text-white relative z-10" strokeWidth={2.5} />}
                      {item.id === 'personalized' && <Heart className="w-8 h-8 text-white relative z-10" strokeWidth={2.5} />}
                      {item.id === 'stress-free' && <Smile className="w-8 h-8 text-white relative z-10" strokeWidth={2.5} />}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-memopyk-navy mb-6 text-center">
                    {title}
                  </h3>

                  {/* Content */}
                  <div className="space-y-3 flex-1 flex flex-col justify-center">
                    {content.split('\n\n').map((paragraph, paragraphIndex) => (
                      <p key={paragraphIndex} className="text-memopyk-dark-blue leading-relaxed text-sm">
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {/* Bottom accent line */}
                  <div className={`mt-4 h-2 w-full rounded-full bg-gradient-to-r ${item.gradient} transform scale-x-0 group-hover:scale-x-100 transition-all duration-700 origin-center shadow-lg`}></div>
                  
                  {/* Animated sparkle effect */}
                  <div className="absolute top-4 right-4 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-500 delay-200"></div>
                  <div className="absolute bottom-6 left-6 w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-75 group-hover:animate-pulse transition-all duration-500 delay-400"></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export { WhyMemopykSection };
export default WhyMemopykSection;