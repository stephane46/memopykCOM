import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Play, Film, FileImage } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { GalleryItem } from '@shared/schema';

export default function GallerySection() {
  const { language } = useLanguage();
  const [fullHeightVideoId, setFullHeightVideoId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { data: galleryItems = [], isLoading } = useQuery<GalleryItem[]>({
    queryKey: ['/api/gallery-items'],
  });

  // Get stored dimensions from admin panel
  const getStoredDimensions = (item: GalleryItem) => {
    return {
      width: item.width || 1920,
      height: item.height || 1080
    };
  };

  // Get effective dimensions for display
  const getEffectiveDimensions = (item: GalleryItem) => {
    const stored = getStoredDimensions(item);
    const maxWidth = 400; // Maximum width for gallery
    const scale = stored.width > maxWidth ? maxWidth / stored.width : 1;
    
    return {
      width: Math.round(stored.width * scale),
      height: Math.round(stored.height * scale),
      aspectRatio: stored.width / stored.height
    };
  };

  // Handle play button click
  const handlePlayButtonClick = (itemId: string) => {
    console.log(`🎯 Play button clicked for item: ${itemId}`);
    setFullHeightVideoId(itemId);
  };

  // Handle video loaded
  const handleVideoLoaded = (itemId: string, videoElement: HTMLVideoElement) => {
    console.log(`📹 Video loaded for item: ${itemId}`);
  };

  // Global click handler to stop videos
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Don't stop if clicking on video or video controls
      if (target.tagName === 'VIDEO' || target.closest('video')) {
        return;
      }
      
      // Don't stop if clicking on play button
      if (target.closest('.play-button')) {
        return;
      }
      
      // Stop all videos
      setFullHeightVideoId(null);
      setPlayingVideo(null);
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  if (isLoading) {
    return (
      <section className="py-20 bg-gradient-to-br from-[#F2EBDC] to-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D67C4A] mx-auto"></div>
            <p className="mt-4 text-[#8D9FA6]">
              {language === 'fr' ? 'Chargement de la galerie...' : 'Loading gallery...'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const activeItems = galleryItems.filter(item => item.isActive);

  return (
    <section className="py-20 bg-gradient-to-br from-[#F2EBDC] to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-[#011526] mb-4">
            {language === 'fr' ? 'Nos Réalisations' : 'Our Portfolio'}
          </h2>
          <p className="text-xl text-[#8D9FA6] max-w-2xl mx-auto">
            {language === 'fr' 
              ? 'Découvrez nos films mémoire personnalisés, chacun unique et émouvant'
              : 'Discover our custom memory films, each unique and moving'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activeItems.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-[#8D9FA6] text-lg">
                {language === 'fr' ? 'Aucun élément de galerie disponible' : 'No gallery items available'}
              </p>
            </div>
          ) : (
            activeItems.map((item) => {
              // COMPLETE CARD REPLACEMENT: When video is playing, show ONLY the video
              if (fullHeightVideoId === item.id) {
                const effectiveDimensions = getEffectiveDimensions(item);
                
                return (
                  <div 
                    key={item.id}
                    data-gallery-card
                    data-card-id={item.id}
                    className="bg-[#F2EBDC] rounded-lg overflow-hidden transition-all duration-300"
                    style={{ 
                      height: 'fit-content',
                      width: 'fit-content',
                      margin: '0 auto'
                    }}
                  >
                    <div 
                      className="relative"
                      style={{
                        width: `${effectiveDimensions.width}px`,
                        height: `${effectiveDimensions.height}px`
                      }}
                    >
                      <video
                        ref={videoRef}
                        src={(language === 'fr' ? item.videoUrlFr : item.videoUrlEn)?.replace('http://supabase.memopyk.org:8001/object/public/', '/api/video-proxy/')}
                        style={{ 
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        autoPlay
                        loop
                        muted={isMuted}
                        playsInline
                        preload="metadata"
                        onLoadedMetadata={(e) => {
                          e.currentTarget.preload = 'auto';
                          handleVideoLoaded(item.id, e.currentTarget);
                        }}
                        onLoadedData={(e) => {
                          e.currentTarget.play().catch(console.error);
                        }}
                      />
                    </div>
                  </div>
                );
              }
              
              // NORMAL CARD STRUCTURE: When video is NOT playing
              return (
                <div 
                  key={item.id}
                  data-gallery-card
                  data-card-id={item.id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                  style={{ height: '550px' }}
                >
                  {/* Thumbnail/Video Area */}
                  <div className="relative bg-gray-100" style={{ height: '250px' }}>
                    {/* Always show thumbnail - video replacement handled above */}
                    <>
                      {/* Display image or gradient background */}
                      {(() => {
                        const imageUrl = language === 'fr' ? item.imageUrlFr : item.imageUrlEn;
                        if (imageUrl) {
                          return (
                            <img 
                              src={imageUrl.replace('http://supabase.memopyk.org:8001/object/public/', '/api/video-proxy/')}
                              alt={language === 'fr' ? item.titleFr : item.titleEn}
                              className="w-full h-full object-bottom"
                              style={{ height: '250px' }}
                            />
                          );
                        }
                        return (
                          <div className={`w-full h-full ${
                            item.orderIndex === 1 ? 'bg-gradient-to-br from-[#89BAD9] to-[#2A4759]' :
                            item.orderIndex === 2 ? 'bg-gradient-to-br from-[#D67C4A] to-[#8D9FA6]' :
                            item.orderIndex === 3 ? 'bg-gradient-to-br from-[#2A4759] to-[#011526]' :
                            'bg-gradient-to-br from-[#8D9FA6] to-[#89BAD9]'
                          }`} />
                        );
                      })()}
                      
                      {/* Play Button */}
                      {(language === 'fr' ? item.videoUrlFr : item.videoUrlEn) && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <button
                            type="button"
                            className="play-button w-16 h-16 bg-[#D67C4A]/90 rounded-full flex items-center justify-center shadow-lg hover:bg-[#D67C4A] transition-all duration-300 cursor-pointer animate-pulse-elegant z-50"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setFullHeightVideoId(item.id);
                            }}
                          >
                            <Play className="w-8 h-8 ml-1 text-white pointer-events-none" fill="currentColor" />
                          </button>
                        </div>
                      )}
                    </>

                    {/* Content Stats Overlay */}
                    <div className="absolute top-3 left-3 bg-black/60 text-white px-3 py-1 rounded-lg text-sm">
                      <div>{language === 'fr' ? item.contentStatsFr : item.contentStatsEn}</div>
                      <div className="text-xs mt-0.5 opacity-60">
                        {language === 'fr' ? 'fournies par le Client' : 'provided by Client'}
                      </div>
                    </div>

                    {/* Price Tag */}
                    {(language === 'fr' ? item.priceFr : item.priceEn) && (
                      <div className="absolute bottom-3 right-3 bg-[#D67C4A]/80 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {language === 'fr' ? item.priceFr : item.priceEn}
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="px-6 pb-6 pt-1" style={{ height: '300px' }}>
                    {/* Title */}
                    <h3 className="text-xl font-bold text-[#011526] mb-1">
                      {language === 'fr' ? item.titleFr : item.titleEn}
                    </h3>

                    {/* Duration */}
                    <div className="flex items-center text-[#8D9FA6] mb-3">
                      <Film className="w-4 h-4 mr-2" />
                      <span className="text-sm">
                        {language === 'fr' ? item.durationFr : item.durationEn}
                      </span>
                    </div>

                    {/* Features */}
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <FileImage className="w-4 h-4 mr-3 mt-1 text-[#D67C4A] flex-shrink-0" />
                        <span className="text-sm text-[#2A4759]" style={{ height: '100px' }}>
                          {language === 'fr' ? item.feature1Fr : item.feature1En}
                        </span>
                      </div>
                      <div className="flex items-start">
                        <Film className="w-4 h-4 mr-3 mt-1 text-[#D67C4A] flex-shrink-0" />
                        <span className="text-sm text-[#2A4759]" style={{ height: '100px' }}>
                          {language === 'fr' ? item.feature2Fr : item.feature2En}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}