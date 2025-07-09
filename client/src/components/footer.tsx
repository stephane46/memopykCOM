import { useLanguage } from "@/hooks/use-language";
import { Link } from "wouter";
import { MessageCircle } from "lucide-react";

export function Footer() {
  const { t, language } = useLanguage();

  return (
    <footer className="bg-memopyk-cream text-memopyk-navy py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with description */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img 
              src="/logo.svg" 
              alt="MEMOPYK" 
              className="h-12 lg:h-16 w-auto"
            />
          </div>
          <p className="text-memopyk-blue max-w-3xl mx-auto text-lg leading-relaxed">
            {t('footer.description', { 
              fr: 'Avec MEMOPYK, votre archive emmêlée de milliers de photos et vidéos prend enfin du sens. Nous fouillons chaque prise pour dénicher les moments qui comptent, puis appliquons un montage professionnel pour les tisser en récits vidéo magnifiquement significatifs.',
              en: 'With MEMOPYK, your tangled archive of thousands of photos and videos finally makes sense. We comb through every shot to find the moments that matter, then apply professional editing to weave them into beautifully meaningful video stories.'
            })}
          </p>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-8">
          {/* Legal Documents - Left Column */}
          <div className="space-y-3">
            <Link 
              href="/legal-notice" 
              className="block text-memopyk-blue hover:text-memopyk-highlight transition-colors"
            >
              {t('footer.legalNotice', { fr: 'Mentions Légales', en: 'Legal Notice' })}
            </Link>
            <Link 
              href="/privacy-policy" 
              className="block text-memopyk-blue hover:text-memopyk-highlight transition-colors"
            >
              {t('footer.privacyPolicy', { fr: 'Politique de confidentialité', en: 'Privacy Policy' })}
            </Link>
            <Link 
              href="/cookie-policy" 
              className="block text-memopyk-blue hover:text-memopyk-highlight transition-colors"
            >
              {t('footer.cookiePolicy', { fr: 'Politique de cookies', en: 'Cookie Policy' })}
            </Link>
          </div>

          {/* Legal Documents - Middle Column */}
          <div className="space-y-3">
            <Link 
              href="/terms-of-sale" 
              className="block text-memopyk-blue hover:text-memopyk-highlight transition-colors"
            >
              {t('footer.termsOfSale', { fr: 'Conditions Générales de Vente', en: 'Terms of Sale' })}
            </Link>
            <Link 
              href="/terms-of-use" 
              className="block text-memopyk-blue hover:text-memopyk-highlight transition-colors"
            >
              {t('footer.termsOfUse', { fr: 'Conditions Générales d\'Utilisation', en: 'Terms of Use' })}
            </Link>
            <Link 
              href="/faq" 
              className="block text-memopyk-blue hover:text-memopyk-highlight transition-colors"
            >
              {t('footer.faq', { fr: 'FAQ', en: 'FAQ' })}
            </Link>
          </div>

          {/* Contact - Right Column */}
          <div className="space-y-3">
            <a 
              href="https://wa.me/33123456789" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-memopyk-blue hover:text-memopyk-highlight transition-colors"
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              {t('footer.contactUs', { fr: 'Contact us', en: 'Contact us' })}
            </a>
            <a 
              href="mailto:info@memopyk.com"
              className="flex items-center text-memopyk-blue hover:text-memopyk-highlight transition-colors"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              info@memopyk.com
            </a>
            <Link 
              href="/admin" 
              className="text-xs text-memopyk-blue/70 hover:text-memopyk-highlight transition-colors"
            >
              admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
