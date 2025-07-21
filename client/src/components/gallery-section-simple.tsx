import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Play, Pause, Clock, FileImage, Film } from 'lucide-react';

interface GalleryItem {
  id: string;
  titleFr: string;
  titleEn: string;
  descriptionFr: string;
  descriptionEn: string;
  durationFr: string;
  durationEn: string;
  imageUrl: string;
  videoUrlFr: string;
  videoUrlEn: string;
  isActive: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export default function GallerySection() {
  const { language } = useLanguage();
  const [playingVideoId, setPlayingVideoId] = React.useState<string | null>(null);

  const { data: galleryItems = [], isLoading } = useQuery({
    queryKey: ['/api/gallery-items'],
  });

  const activeItems = galleryItems
    .filter((item: GalleryItem) => item.isActive)
    .sort((a: GalleryItem, b: GalleryItem) => a.orderIndex - b.orderIndex);

  const handlePlayVideo = (itemId: string) => {
    console.log('🎬 Playing video:', itemId);
    setPlayingVideoId(itemId);
  };

  const handlePauseVideo = (itemId: string) => {
    console.log('⏸️ Pausing video:', itemId);
    setPlayingVideoId(null);
  };

  const handleTestClick = () => {
    console.log('🚨 GALLERY TEST BUTTON CLICKED');
    alert('Gallery test button works!');
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
          <h2 className="text-4xl font-bold text-[#011526] mb-4">
            {language === 'fr' ? 'Galerie' : 'Gallery'}
          </h2>
          <p className="text-lg text-[#8D9FA6] max-w-3xl mx-auto">
            {language === 'fr' 
              ? 'Découvrez nos créations de films-mémoires qui transforment vos souvenirs en œuvres cinématographiques émouvantes.'
              : 'Discover our memory film creations that transform your memories into moving cinematic works.'
            }
          </p>
          
          {/* Test button */}
          <Button 
            onClick={handleTestClick}
            className="mt-4 bg-green-500 hover:bg-green-600 text-white"
          >
            TEST GALLERY CLICK
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activeItems.map((item: GalleryItem) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-transform hover:scale-105"
            >
              {/* Image/Video Container */}
              <div className="relative h-64 bg-gray-100">
                {playingVideoId === item.id ? (
                  <video
                    src={language === 'fr' ? item.videoUrlFr : item.videoUrlEn}
                    className="w-full h-full object-cover"
                    controls
                    autoPlay
                    onEnded={() => setPlayingVideoId(null)}
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <img
                      src={item.imageUrl}
                      alt={language === 'fr' ? item.titleFr : item.titleEn}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                      <Button
                        onClick={() => handlePlayVideo(item.id)}
                        className="bg-white bg-opacity-80 hover:bg-opacity-100 text-[#011526] rounded-full w-16 h-16 flex items-center justify-center"
                      >
                        <Play className="w-6 h-6" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-[#011526] mb-2">
                  {language === 'fr' ? item.titleFr : item.titleEn}
                </h3>
                
                <p className="text-[#8D9FA6] mb-4 text-sm">
                  {language === 'fr' ? item.descriptionFr : item.descriptionEn}
                </p>

                <div className="flex items-center justify-between text-sm text-[#8D9FA6]">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{language === 'fr' ? item.durationFr : item.durationEn}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <FileImage className="w-4 h-4" />
                      <span>{language === 'fr' ? 'Cinématographie' : 'Cinematography'}</span>
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