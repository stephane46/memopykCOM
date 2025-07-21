import { useLanguage } from '@/hooks/use-language';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';

type LegalDocument = {
  id: string;
  type: string;
  titleEn: string;
  titleFr: string;
  contentEn: string;
  contentFr: string;
  isActive: boolean;
  updatedAt: string;
};

export default function Footer() {
  const { language, legacyLanguage } = useLanguage();
  
  const { data: legalDocuments = [] } = useQuery<LegalDocument[]>({
    queryKey: ['/api/legal-documents'],
  });

  const getLegalTitle = (doc: LegalDocument) => {
    return legacyLanguage === 'fr' ? doc.titleFr : doc.titleEn;
  };

  // Generate proper localized URLs for legal documents
  const getLegalUrl = (docType: string) => {
    const urlMappings = {
      'mentions-legales': {
        fr: `/${language}/mentions-legales`,
        en: `/${language}/legal-notice`
      },
      'politique-confidentialite': {
        fr: `/${language}/politique-confidentialite`, 
        en: `/${language}/privacy-policy`
      },
      'politique-cookies': {
        fr: `/${language}/politique-cookies`,
        en: `/${language}/cookie-policy`
      },
      'cgv': {
        fr: `/${language}/conditions-generales-vente`,
        en: `/${language}/terms-of-sale`
      },
      'cgu': {
        fr: `/${language}/conditions-generales-utilisation`,
        en: `/${language}/terms-of-use`
      }
    };
    
    const mapping = urlMappings[docType as keyof typeof urlMappings];
    if (mapping) {
      return legacyLanguage === 'fr' ? mapping.fr : mapping.en;
    }
    
    // Fallback to legacy URL structure during transition
    return `/legal/${docType}`;
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Split legal documents into two groups
  const legalDocsGroup1 = legalDocuments
    .filter(doc => doc.isActive && ['mentions-legales', 'politique-confidentialite', 'politique-cookies'].includes(doc.type));
  
  const legalDocsGroup2 = legalDocuments
    .filter(doc => doc.isActive && ['cgv', 'cgu'].includes(doc.type))
    .sort((a, b) => {
      // Ensure CGV (Terms of Sale) comes before CGU (Terms of Use)
      const order = ['cgv', 'cgu'];
      return order.indexOf(a.type) - order.indexOf(b.type);
    });

  return (
    <footer className="bg-[#011526] text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: First group of legal documents */}
          <div>
            <ul className="text-gray-300 space-y-3">
              {legalDocsGroup1.map(doc => (
                <li key={doc.id}>
                  <Link 
                    href={getLegalUrl(doc.type)}
                    className="hover:text-white transition-colors text-left block"
                  >
                    {getLegalTitle(doc)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Second group of legal documents + FAQ */}
          <div>
            <ul className="text-gray-300 space-y-3">
              {legalDocsGroup2.map(doc => (
                <li key={doc.id}>
                  <Link 
                    href={getLegalUrl(doc.type)}
                    className="hover:text-white transition-colors text-left block"
                  >
                    {getLegalTitle(doc)}
                  </Link>
                </li>
              ))}
              <li>
                <button 
                  onClick={() => scrollToSection('faq')}
                  className="hover:text-white transition-colors text-left"
                >
                  FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
            <div className="text-gray-300 space-y-3">
              <div className="flex items-center space-x-2">
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.479 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                  <path d="M11.893 0C5.337 0 .002 5.335 0 11.892c-.001 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654C8.098 23.5 10.059 24 12.05 24c6.554 0 11.89-5.335 11.893-11.892C23.945 5.552 18.447.003 11.893 0z"/>
                </svg>
                <span>{legacyLanguage === 'fr' ? 'Nous contacter' : 'Contact us'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                <span>info@memopyk.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-gray-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4">
              <p className="text-gray-400 text-sm">
                © 2025 MEMOPYK. {legacyLanguage === 'fr' ? 'Tous droits réservés.' : 'All rights reserved.'}
              </p>
              <Link 
                href="/admin" 
                className="text-gray-500 hover:text-gray-400 text-xs transition-colors"
              >
                Admin
              </Link>
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Facebook</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Instagram</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.418-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.928.875 1.418 2.026 1.418 3.323s-.49 2.448-1.418 3.244c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.406c-.315 0-.595-.122-.807-.315-.21-.193-.315-.472-.315-.787 0-.315.105-.594.315-.787.212-.193.492-.315.807-.315.315 0 .595.122.807.315.21.193.315.472.315.787 0 .315-.105.594-.315.787-.212.193-.492.315-.807.315z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">YouTube</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}