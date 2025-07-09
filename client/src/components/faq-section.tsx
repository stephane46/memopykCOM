import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { ChevronDown } from "lucide-react";
import type { FaqData } from "@/lib/types";

export function FaqSection() {
  const { language, t } = useLanguage();
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const { data: faqs = [] } = useQuery<FaqData[]>({
    queryKey: ['/api/faqs'],
  });

  const activeFaqs = faqs.filter(faq => faq.isActive);
  
  // Group FAQs by section
  const faqsBySection = activeFaqs.reduce((acc, faq) => {
    if (!acc[faq.section]) {
      acc[faq.section] = {
        name: language === 'fr' ? faq.sectionNameFr : faq.sectionNameEn,
        order: faq.sectionOrder,
        faqs: []
      };
    }
    acc[faq.section].faqs.push(faq);
    return acc;
  }, {} as Record<string, { name: string; order: number; faqs: FaqData[] }>);

  // Sort sections by order
  const sortedSections = Object.entries(faqsBySection).sort(([, a], [, b]) => a.order - b.order);

  const toggleFaq = (faqId: string) => {
    setOpenFaq(openFaq === faqId ? null : faqId);
  };

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-playfair text-4xl lg:text-5xl font-bold text-memopyk-navy mb-6">
            {t('faq.title', { fr: 'Questions Fréquentes', en: 'Frequently Asked Questions' })}
          </h2>
          <p className="text-xl text-memopyk-blue">
            {t('faq.subtitle', { 
              fr: 'Tout ce que vous devez savoir sur nos services de films mémoire',
              en: 'Everything you need to know about our memory film services'
            })}
          </p>
        </div>
        
        <div className="space-y-8">
          {sortedSections.map(([sectionKey, section]) => (
            <div key={sectionKey} className="faq-section">
              <h3 className="font-playfair text-2xl font-bold text-memopyk-navy mb-6 border-b border-memopyk-cream pb-2">
                {section.name}
              </h3>
              
              <div className="space-y-4">
                {section.faqs
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((faq) => (
                    <div key={faq.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleFaq(faq.id)}
                        className="w-full text-left p-6 hover:bg-memopyk-cream transition-colors flex justify-between items-center"
                      >
                        <span className="font-semibold text-memopyk-navy pr-4">
                          {language === 'fr' ? faq.questionFr : faq.questionEn}
                        </span>
                        <ChevronDown 
                          className={`h-5 w-5 text-memopyk-blue transition-transform flex-shrink-0 ${
                            openFaq === faq.id ? 'transform rotate-180' : ''
                          }`} 
                        />
                      </button>
                      
                      {openFaq === faq.id && (
                        <div className="px-6 pb-6 text-memopyk-blue">
                          <div className="prose prose-sm max-w-none">
                            {language === 'fr' ? faq.answerFr : faq.answerEn}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
          
          {activeFaqs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-memopyk-blue">
                {t('faq.noFaqs', { 
                  fr: 'Aucune question fréquente disponible pour le moment.',
                  en: 'No frequently asked questions available at the moment.'
                })}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
