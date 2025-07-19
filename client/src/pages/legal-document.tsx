import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { Header } from "@/components/header";
import Footer from "@/components/footer";
import { RichTextDisplay } from "@/components/ui/rich-text-editor";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import SeoHead from "@/components/seo-head";

interface LegalDocument {
  id: string;
  type: string;
  titleEn: string;
  titleFr: string;
  contentEn: string;
  contentFr: string;
  isActive: boolean;
  updatedAt: string;
}

export default function LegalDocumentPage() {
  // Support both new and legacy URL patterns
  const [legacyMatch, legacyParams] = useRoute("/legal/:type");
  const [frMatch, frParams] = useRoute("/fr-FR/:slug");
  const [enMatch, enParams] = useRoute("/en-US/:slug");
  
  const { language, legacyLanguage, detectLanguageFromPath } = useLanguage();
  const [document, setDocument] = useState<LegalDocument | null>(null);

  const { data: legalDocs = [] } = useQuery<LegalDocument[]>({
    queryKey: ['/api/legal-documents'],
  });

  useEffect(() => {
    if (legalDocs.length === 0) return;

    let docType: string | null = null;
    
    // Determine document type from URL
    if (frMatch && frParams?.slug) {
      // French URLs: /fr-FR/mentions-legales, /fr-FR/politique-confidentialite, etc.
      const slugMap: Record<string, string> = {
        'mentions-legales': 'mentions-legales',
        'politique-confidentialite': 'politique-confidentialite',
        'politique-cookies': 'politique-cookies',
        'conditions-generales-vente': 'cgv',
        'conditions-generales-utilisation': 'cgu'
      };
      docType = slugMap[frParams.slug];
    } else if (enMatch && enParams?.slug) {
      // English URLs: /en-US/legal-notice, /en-US/privacy-policy, etc.
      const slugMap: Record<string, string> = {
        'legal-notice': 'mentions-legales',
        'privacy-policy': 'politique-confidentialite',
        'cookie-policy': 'politique-cookies',
        'terms-of-sale': 'cgv',
        'terms-of-use': 'cgu'
      };
      docType = slugMap[enParams.slug];
    } else if (legacyMatch && legacyParams?.type) {
      // Legacy URLs: /legal/mentions-legales, /legal/politique-confidentialite
      docType = legacyParams.type;
    }

    if (docType) {
      const foundDoc = legalDocs.find(doc => doc.type === docType && doc.isActive);
      setDocument(foundDoc || null);
    }
  }, [frMatch, frParams, enMatch, enParams, legacyMatch, legacyParams, legalDocs]);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {legacyLanguage === 'fr' ? 'Document non trouvé' : 'Document not found'}
            </h1>
            <p className="text-gray-600 mb-8">
              {legacyLanguage === 'fr' 
                ? 'Le document demandé n\'existe pas ou n\'est pas disponible.'
                : 'The requested document does not exist or is not available.'
              }
            </p>
            <Button 
              onClick={() => window.history.back()}
              className="bg-memopyk-navy hover:bg-memopyk-dark-blue text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {legacyLanguage === 'fr' ? 'Retour' : 'Back'}
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const title = legacyLanguage === 'fr' ? document.titleFr : document.titleEn;
  const content = legacyLanguage === 'fr' ? document.contentFr : document.contentEn;

  // Determine current page type for SEO based on document type
  const currentPage = document.type;

  return (
    <div className="min-h-screen bg-gray-50">
      <SeoHead 
        page={currentPage}
        title={title}
        description={content.replace(/<[^>]*>/g, '').substring(0, 160) + '...'}
        alternateUrls={(() => {
          const urlMappings: Record<string, { fr: string; en: string }> = {
            'mentions-legales': { fr: '/fr-FR/mentions-legales', en: '/en-US/legal-notice' },
            'politique-confidentialite': { fr: '/fr-FR/politique-confidentialite', en: '/en-US/privacy-policy' },
            'politique-cookies': { fr: '/fr-FR/politique-cookies', en: '/en-US/cookie-policy' },
            'cgv': { fr: '/fr-FR/conditions-generales-vente', en: '/en-US/terms-of-sale' },
            'cgu': { fr: '/fr-FR/conditions-generales-utilisation', en: '/en-US/terms-of-use' }
          };
          const mapping = urlMappings[document.type];
          return mapping ? { 'fr-FR': mapping.fr, 'en-US': mapping.en } : {};
        })()}
      />
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-20">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <Button 
              onClick={() => window.history.back()}
              variant="outline"
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === 'fr' ? 'Retour' : 'Back'}
            </Button>
            
            <h1 className="text-3xl font-bold text-memopyk-navy mb-2">
              {title}
            </h1>
            
            <p className="text-gray-600 text-sm">
              {language === 'fr' ? 'Dernière mise à jour: ' : 'Last updated: '}
              {new Date(document.updatedAt).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <RichTextDisplay content={content} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}