import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { Play, Clock, FileImage, Film } from 'lucide-react';

interface GalleryItem {
  id: string;
  titleFr: string;
  titleEn: string;
  descriptionFr: string;
  descriptionEn: string;
  durationFr: string;
  durationEn: string;
  imageUrlFr: string;
  imageUrlEn: string;
  videoUrlFr: string;
  videoUrlEn: string;
  isActive: boolean;
  orderIndex: number;
}

export default function GalleryWorking() {
  const { language } = useLanguage();
  const [playingVideoId, setPlayingVideoId] = React.useState<string | null>(null);

  const { data: galleryItems = [], isLoading } = useQuery({
    queryKey: ['/api/gallery-items'],
  });

  const activeItems = galleryItems
    .filter((item: GalleryItem) => item.isActive)
    .sort((a: GalleryItem, b: GalleryItem) => a.orderIndex - b.orderIndex);

  const handlePlayVideo = (itemId: string) => {
    setPlayingVideoId(itemId);
  };

  const handleVideoEnd = () => {
    setPlayingVideoId(null);
  };

  if (isLoading) {
    return (
      <section className="py-20 bg-[#F2EBDC]">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-[#011526] mb-8">
              {language === 'fr' ? 'Galerie' : 'Gallery'}
            </h2>
            <p className="text-gray-600">Loading gallery items...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-[#F2EBDC]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-[#011526] mb-6">
            {language === 'fr' ? 'Notre Galerie' : 'Our Gallery'}
          </h2>
          <p className="text-xl text-[#2A4759] max-w-3xl mx-auto leading-relaxed">
            {language === 'fr' 
              ? 'Découvrez nos créations vidéo exceptionnelles qui transforment vos moments précieux en souvenirs cinématographiques inoubliables.'
              : 'Discover our exceptional video creations that transform your precious moments into unforgettable cinematic memories.'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {activeItems.map((item: GalleryItem) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              {/* Video/Image Container */}
              <div className="relative h-64 bg-gray-100">
                {playingVideoId === item.id ? (
                  <video
                    src={language === 'fr' ? item.videoUrlFr : item.videoUrlEn}
                    className="w-full h-full object-cover"
                    controls
                    autoPlay
                    onEnded={handleVideoEnd}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <img
                      src={language === 'fr' ? item.imageUrlFr : item.imageUrlEn}
                      alt={language === 'fr' ? item.titleFr : item.titleEn}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                      <button
                        onClick={() => handlePlayVideo(item.id)}
                        className="bg-white bg-opacity-90 hover:bg-opacity-100 text-[#011526] rounded-full w-16 h-16 flex items-center justify-center transform hover:scale-110 transition-all duration-200"
                      >
                        <Play className="w-6 h-6 ml-1" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-[#011526] mb-3">
                  {language === 'fr' ? item.titleFr : item.titleEn}
                </h3>
                
                <p className="text-[#8D9FA6] mb-4 text-sm line-clamp-2">
                  {language === 'fr' ? item.descriptionFr : item.descriptionEn}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[#8D9FA6] text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{language === 'fr' ? item.durationFr : item.durationEn}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-[#8D9FA6]">
                    <div className="flex items-center gap-1">
                      <FileImage className="w-4 h-4" />
                      <span>{language === 'fr' ? 'Cinéma' : 'Cinema'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Film className="w-4 h-4" />
                      <span>{language === 'fr' ? 'Montage' : 'Editing'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {activeItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#8D9FA6] text-lg">
              {language === 'fr' 
                ? 'Aucun élément de galerie disponible pour le moment.'
                : 'No gallery items available at the moment.'
              }
            </p>
          </div>
        )}
      </div>
    </section>
  );
}