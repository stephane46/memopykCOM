import { useLanguage } from "@/hooks/use-language";
import { Upload, Wand2, Heart, Sparkles } from "lucide-react";

export function HowItWorksSection() {
  const { t, language } = useLanguage();

  const cards = [
    {
      id: 1,
      icon: Upload,
      image: "/Images/How_we_work_Step1.png",
      titleEn: "You Upload",
      titleFr: "Téléversement",
      contentEn: "Send us your photos and videos exactly as they are — no need to sort, rename, or organize. We accept all formats and even support collaborative uploads, so your whole family can contribute.\n\nYou'll also receive a short questionnaire to tell us more about your story — whether it's a vague idea or a detailed vision.",
      contentFr: "Envoyez-nous vos photos et vidéos telles qu'elles sont — inutile de trier, renommer ou organiser. Nous acceptons tous les formats, et proposons même des envois collaboratifs pour que toute la famille puisse contribuer.\n\nVous recevrez également un court questionnaire pour nous en dire plus sur votre histoire — qu'elle soit encore floue ou déjà bien construite.",
      tagEn: "You",
      tagFr: "Vous",
      isHighlight: false,
      gradient: "from-blue-600 to-blue-800"
    },
    {
      id: 2,
      icon: Wand2,
      image: "/Images/How_we_work_Step2.png",
      titleEn: "We Create",
      titleFr: "Sélection & Montage",
      contentEn: "We go through every file to identify the most meaningful moments. Then we propose a personalized storyline, suggest music, duration, and format — everything tailored to your memories.\n\nNeed to talk it through? A consultation is always available, free of charge.",
      contentFr: "Nous passons en revue chaque fichier pour repérer les moments les plus marquants. Puis, nous vous proposons un scénario personnalisé, avec des suggestions de musique, de durée et de format — tout est pensé pour sublimer vos souvenirs.\n\nBesoin d'en discuter ? Une consultation est toujours possible, gratuitement.",
      tagEn: "MEMOPYK",
      tagFr: "MEMOPYK",
      isHighlight: true,
      gradient: "from-orange-500 to-red-600"
    },
    {
      id: 3,
      icon: Heart,
      image: "/Images/How_we_work_Step3.png",
      titleEn: "You Enjoy & Share",
      titleFr: "C'est prêt !",
      contentEn: "Once you approve the plan, we bring your memory film to life. Expect a beautifully crafted result within 1-3 weeks, with two revision rounds included.\n\nYou'll receive a high-quality, ready-to-share masterpiece — perfect for gifting or keeping.",
      contentFr: "Une fois le plan validé, nous donnons vie à votre film de souvenirs. Vous recevrez un résultat soigné en 1 à 3 semaines, avec deux séries de retours incluses.\n\nVous obtenez une création prête à être partagée — idéale à offrir ou à conserver précieusement.",
      tagEn: "You",
      tagFr: "Vous",
      isHighlight: false,
      gradient: "from-green-600 to-emerald-700"
    }
  ];

  return (
    <section className="relative py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-200 to-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-600 rounded-2xl mb-6 shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-memopyk-navy via-memopyk-dark-blue to-indigo-800 bg-clip-text text-transparent mb-6">
            {language === 'fr' ? 'Comment Ça Marche' : 'How It Works'}
          </h2>
          
          <p className="text-xl md:text-2xl text-memopyk-dark-blue max-w-4xl mx-auto leading-relaxed">
            {language === 'fr' 
              ? '3 étapes faciles pour transformer le chaos en un film souvenir'
              : '3 easy steps to turn chaos into a memory film'
            }
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 items-center">
          {cards.map((card, index) => {
            const Icon = card.icon;
            const title = language === 'fr' ? card.titleFr : card.titleEn;
            const content = language === 'fr' ? card.contentFr : card.contentEn;
            const tag = language === 'fr' ? card.tagFr : card.tagEn;

            return (
              <div
                key={card.id}
                className={`relative group transition-all duration-500 hover:transform hover:scale-105 hover:-translate-y-2 ${
                  card.isHighlight ? 'md:scale-110' : ''
                }`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Animated background glow */}
                <div className={`absolute inset-0 bg-gradient-to-r ${card.gradient} rounded-3xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-500`}></div>
                
                {/* Main card */}
                <div className={`relative bg-white/90 backdrop-blur-sm rounded-3xl p-8 lg:p-10 shadow-xl border border-white/20 transition-all duration-500 group-hover:shadow-2xl flex flex-col ${
                  card.isHighlight 
                    ? 'h-[680px] ring-2 ring-orange-500/50 shadow-orange-500/20' 
                    : 'h-[620px] hover:shadow-blue-500/10'
                }`}>
                  
                  {/* Floating tag */}
                  <div className={`absolute -top-4 -right-4 px-4 py-2 rounded-full text-sm font-bold shadow-lg transform rotate-3 transition-transform duration-300 group-hover:rotate-6 ${
                    card.isHighlight 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-orange-500/50' 
                      : 'bg-gradient-to-r from-memopyk-sky-blue to-blue-500 text-white shadow-blue-500/50'
                  }`}>
                    {tag}
                  </div>

                  {/* Step Image */}
                  <div className="mb-8 flex justify-center">
                    <div className="relative group-hover:scale-105 transition-transform duration-300">
                      <img 
                        src={card.image} 
                        alt={title}
                        className="w-48 h-48 object-contain rounded-2xl"
                      />
                      {/* Glow effect behind image */}
                      <div className={`absolute inset-0 bg-gradient-to-r ${card.gradient} rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-500 -z-10`}></div>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className={`text-3xl font-bold mb-6 ${
                    card.isHighlight 
                      ? 'bg-gradient-to-r from-orange-600 to-red-700 bg-clip-text text-transparent' 
                      : 'text-memopyk-navy'
                  }`}>
                    {title}
                  </h3>

                  {/* Content */}
                  <div className="space-y-4 flex-1 flex flex-col justify-center">
                    {content.split('\n\n').map((paragraph, paragraphIndex) => (
                      <p key={paragraphIndex} className="text-memopyk-dark-blue leading-relaxed text-base">
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {/* Bottom accent line */}
                  <div className={`mt-6 h-1 w-full rounded-full bg-gradient-to-r ${
                    card.isHighlight 
                      ? 'from-orange-500 to-red-500' 
                      : 'from-memopyk-sky-blue to-blue-500'
                  } transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default HowItWorksSection;