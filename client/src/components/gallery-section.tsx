import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Eye } from "lucide-react";
import type { GalleryItemData } from "@/lib/types";

export function GallerySection() {
  const { language, t } = useLanguage();

  const { data: galleryItems = [] } = useQuery<GalleryItemData[]>({
    queryKey: ['/api/gallery-items'],
  });

  const activeItems = galleryItems.filter(item => item.isActive);

  return (
    <section id="gallery" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-playfair text-4xl md:text-5xl font-bold text-memopyk-navy mb-6">
            {t('gallery.title', { 
              fr: 'Notre Portfolio', 
              en: 'Our Portfolio' 
            })}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light">
            {t('gallery.subtitle', { 
              fr: 'Découvrez nos créations cinématographiques qui transforment vos souvenirs en œuvres d\'art', 
              en: 'Discover our cinematic creations that transform your memories into works of art' 
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activeItems.map((item) => (
            <Card key={item.id} className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="relative aspect-video overflow-hidden">
                {item.videoUrl ? (
                  <video 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    muted
                    loop
                    playsInline
                    poster={language === 'fr' ? item.imageUrlFr : item.imageUrlEn}
                    onMouseEnter={(e) => e.currentTarget.play()}
                    onMouseLeave={(e) => e.currentTarget.pause()}
                  >
                    <source src={item.videoUrl} type="video/mp4" />
                  </video>
                ) : (
                  <img 
                    src={language === 'fr' ? item.imageUrlFr : item.imageUrlEn}
                    alt={language === 'fr' ? item.titleFr : item.titleEn}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                    <Button 
                      size="lg" 
                      className="bg-memopyk-highlight hover:bg-orange-600 text-white rounded-full shadow-lg"
                    >
                      {item.videoUrl ? (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          {t('gallery.play', { fr: 'Voir', en: 'Watch' })}
                        </>
                      ) : (
                        <>
                          <Eye className="w-5 h-5 mr-2" />
                          {t('gallery.view', { fr: 'Voir', en: 'View' })}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              
              <CardContent className="p-6">
                <h3 className="font-playfair text-xl font-semibold text-memopyk-navy mb-3">
                  {language === 'fr' ? item.titleFr : item.titleEn}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {language === 'fr' ? item.descriptionFr : item.descriptionEn}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-memopyk-highlight font-semibold">
                    {language === 'fr' ? item.priceFr : item.priceEn}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-memopyk-highlight text-memopyk-highlight hover:bg-memopyk-highlight hover:text-white"
                    onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    {t('gallery.contact', { fr: 'Contactez-nous', en: 'Contact Us' })}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {activeItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {t('gallery.empty', { 
                fr: 'Aucun élément de galerie disponible pour le moment.', 
                en: 'No gallery items available at the moment.' 
              })}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}