import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { ChevronDown } from "lucide-react";
import { RichTextDisplay } from "@/components/ui/rich-text-editor";
import type { Faq, FaqSection } from "@shared/schema";

function FAQSection() {
  const { language, t } = useLanguage();
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<string[]>([]);

  const { data: faqs = [] } = useQuery<Faq[]>({
    queryKey: ['/api/faqs'],
  });

  const { data: sections = [] } = useQuery<FaqSection[]>({
    queryKey: ['/api/faq-sections'],
  });

  const activeFaqs = faqs.filter(faq => faq.isActive);
  const activeSections = sections.filter(section => section.isActive);
  
  // Group FAQs by section
  const faqsBySection = activeFaqs.reduce((acc, faq) => {
    const section = activeSections.find(s => s.id === faq.sectionId);
    if (section && !acc[section.id]) {
      acc[section.id] = {
        name: language === 'fr' ? section.nameFr : section.nameEn,
        order: section.orderIndex,
        faqs: []
      };
    }
    if (section) {
      acc[section.id].faqs.push(faq);
    }
    return acc;
  }, {} as Record<string, { name: string; order: number; faqs: Faq[] }>);

  // Sort sections by order
  const sortedSections = Object.entries(faqsBySection).sort(([, a], [, b]) => a.order - b.order);

  // Auto-open first section and first FAQ when data loads
  useEffect(() => {
    if (activeFaqs.length > 0 && openFaq === null && openSections.length === 0) {
      const firstSection = sortedSections[0];
      if (firstSection && firstSection[1].faqs.length > 0) {
        // Open first section
        setOpenSections([firstSection[0]]);
        // Open first FAQ in first section
        const firstFaq = firstSection[1].faqs.sort((a, b) => a.orderIndex - b.orderIndex)[0];
        setOpenFaq(firstFaq.id);
      }
    }
  }, [activeFaqs.length]); // Only depend on the LENGTH of activeFaqs, not the array itself

  const toggleSection = (sectionId: string, event?: React.MouseEvent) => {
    console.log('🔧 toggleSection called with:', sectionId, 'Current openSections:', openSections);
    
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Accordion behavior: only one section can be open at a time
    setOpenSections(prev => {
      const newSections = prev.includes(sectionId) 
        ? [] // Close if already open
        : [sectionId]; // Open only this section, close others
      console.log('🔧 Setting new sections:', newSections);
      return newSections;
    });
    // Close any open FAQ when section changes
    setOpenFaq(null);
  };

  const toggleFaq = (faqId: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Accordion behavior: close current if same, otherwise open new one
    setOpenFaq(openFaq === faqId ? null : faqId);
  };

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-poppins text-4xl lg:text-5xl font-bold text-memopyk-navy mb-6">
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
          {sortedSections.map(([sectionKey, section]) => {
            const isSectionOpen = openSections.includes(sectionKey);
            
            return (
              <div key={sectionKey} className="faq-section">
                {/* Section Header - Only this should be clickable */}
                <div
                  onClick={(e) => {
                    console.log('🔧 Section click detected:', sectionKey, 'Current open:', openSections);
                    toggleSection(sectionKey, e);
                  }}
                  className="cursor-pointer group mb-6"
                >
                  <h3 className="font-poppins text-2xl font-bold text-memopyk-navy border-b border-memopyk-cream pb-2 flex justify-between items-center group-hover:text-memopyk-blue transition-colors">
                    {section.name}
                    <ChevronDown 
                      className={`h-6 w-6 text-memopyk-orange transition-all duration-300 ${
                        isSectionOpen ? 'transform rotate-180' : ''
                      }`} 
                    />
                  </h3>
                </div>
                
                {/* Section Content - Not clickable */}
                <div className={`space-y-4 transition-all duration-300 ease-in-out overflow-hidden ${
                  isSectionOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  {section.faqs
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((faq) => (
                      <div key={faq.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                        <button
                          onClick={(e) => toggleFaq(faq.id, e)}
                          className="w-full text-left p-6 hover:bg-memopyk-cream transition-all duration-200 flex justify-between items-center group"
                        >
                          <span className="font-semibold text-memopyk-navy pr-4 group-hover:text-memopyk-blue transition-colors">
                            {language === 'fr' ? faq.questionFr : faq.questionEn}
                          </span>
                          <ChevronDown 
                            className={`h-5 w-5 text-memopyk-blue transition-all duration-300 flex-shrink-0 ${
                              openFaq === faq.id ? 'transform rotate-180' : ''
                            }`} 
                          />
                        </button>
                        
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          openFaq === faq.id ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                        }`}>
                          <div className="px-6 pb-6 text-memopyk-blue border-t border-memopyk-cream bg-gray-50">
                            <div className="pt-4">
                              <RichTextDisplay 
                                content={language === 'fr' ? faq.answerFr : faq.answerEn}
                                className="prose prose-sm max-w-none text-memopyk-blue"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            );
            })}
          
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

export { FAQSection };
export default FAQSection;
