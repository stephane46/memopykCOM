import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

interface LegalDocumentProps {
  type: string;
}

interface LegalDocumentData {
  id: string;
  type: string;
  titleEn: string;
  titleFr: string;
  contentEn: string;
  contentFr: string;
  isActive: boolean;
  updatedAt: string;
}

export default function LegalDocument({ type }: LegalDocumentProps) {
  const { language } = useLanguage();
  
  const { data: document, isLoading, error } = useQuery<LegalDocumentData>({
    queryKey: [`/api/legal-documents/type/${type}`],
    enabled: !!type,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-memopyk-cream">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/2 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded w-5/6"></div>
              <div className="h-4 bg-gray-300 rounded w-4/6"></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-memopyk-cream">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-memopyk-navy mb-4">Document non trouvé</h1>
            <p className="text-memopyk-blue">Ce document légal n'existe pas ou n'est pas disponible.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const title = language === 'fr' ? document.titleFr : document.titleEn;
  const content = language === 'fr' ? document.contentFr : document.contentEn;

  return (
    <div className="min-h-screen bg-memopyk-cream">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="font-playfair text-4xl font-bold text-memopyk-navy mb-8">
            {title}
          </h1>
          <div 
            className="prose prose-lg max-w-none text-memopyk-blue"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>
      <Footer />
    </div>
  );
}