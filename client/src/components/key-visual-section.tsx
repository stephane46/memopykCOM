import { useLanguage } from "@/hooks/use-language";

export function KeyVisualSection() {
  const { t } = useLanguage();

  return (
    <section className="py-20 bg-memopyk-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Image */}
          <div className="order-2 lg:order-1 flex justify-center">
            <div className="relative">
              <img 
                src="/KeyVisualS.png" 
                alt={t("Memory transformation illustration", {
                  fr: "Illustration de transformation des souvenirs",
                  en: "Memory transformation illustration"
                })}
                className="w-full max-w-lg h-auto drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Right side - Text Content */}
          <div className="order-1 lg:order-2 space-y-8">
            <div className="space-y-6">
              <p className="text-lg text-memopyk-blue leading-relaxed font-medium">
                {t("keyVisual.description", {
                  fr: "Tant de souvenirs précieux finissent enfouis dans des téléphones, oubliés sur des disques durs ou entassés dans des cartons—perdus dans le chaos du quotidien.",
                  en: "So many precious memories end up buried in phones, forgotten on hard drives, or piled in boxes—lost in the chaos of everyday life."
                })}
              </p>
              
              <p className="text-lg text-memopyk-blue leading-relaxed font-medium">
                {t("keyVisual.solution", {
                  fr: "Laissez-nous sauver vos photos et vidéos et les transformer en un film personnel, unique et émouvant que vous garderez précieusement.",
                  en: "Let us rescue your photos and videos and transform them into a beautiful, personal film you'll truly treasure."
                })}
              </p>
            </div>

            {/* Call to action text */}
            <div className="text-center lg:text-left">
              <p className="text-2xl font-bold text-memopyk-navy font-playfair">
                {t("keyVisual.tagline", {
                  fr: "Simple. Personnalisé.",
                  en: "Simple. Customized."
                })}
              </p>
            </div>

            {/* Optional decorative element */}
            <div className="flex items-center space-x-3 justify-center lg:justify-start">
              <div className="w-12 h-0.5 bg-memopyk-highlight"></div>
              <div className="w-8 h-0.5 bg-memopyk-sky"></div>
              <div className="w-4 h-0.5 bg-memopyk-highlight"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default KeyVisualSection;