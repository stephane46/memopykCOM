import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { Play, FileImage, Film } from 'lucide-react';

interface GalleryItem {
  id: string;
  titleFr: string;
  titleEn: string;
  videoUrlEn?: string;
  videoUrlFr?: string;
  videoWidthEn?: number;
  videoHeightEn?: number;
  videoAspectRatioEn?: number;
  videoOrientationEn?: string;
  videoWidthFr?: number;
  videoHeightFr?: number;
  videoAspectRatioFr?: number;
  videoOrientationFr?: string;
  imageUrlEn?: string;
  imageUrlFr?: string;
  priceEn?: string;
  priceFr?: string;
  contentStatsEn?: string;
  contentStatsFr?: string;
  durationEn?: string;
  durationFr?: string;
  feature1En?: string;
  feature1Fr?: string;
  feature2En?: string;
  feature2Fr?: string;
  orderIndex: number;
  isActive: boolean;
}

export default function GallerySection() {
  const { language } = useLanguage();
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState<Record<string, {width: number, height: number, aspectRatio: number}>>({});
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Convert language for compatibility with stored data
  const langCode = language === 'fr-FR' ? 'fr' : 'en';

  // Listen for gallery updates from admin panel
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'GALLERY_UPDATED') {
        queryClient.invalidateQueries({ queryKey: ['/api/gallery-items'] });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [queryClient]);

  const { data: items = [], isLoading } = useQuery<GalleryItem[]>({
    queryKey: ['/api/gallery-items'],
    staleTime: 0,
    gcTime: 0,
  });

  const activeItems = items.filter(item => item.isActive).slice(0, 6);

  // Get effective dimensions (stored or detected)
  const getEffectiveDimensions = (item: GalleryItem) => {
    const isEn = langCode === 'en';
    const width = isEn ? item.videoWidthEn : item.videoWidthFr;
    const height = isEn ? item.videoHeightEn : item.videoHeightFr;
    const aspectRatio = isEn ? item.videoAspectRatioEn : item.videoAspectRatioFr;

    if (width && height && aspectRatio) {
      return { width, height, aspectRatio };
    }

    return videoDimensions[item.id] || null;
  };

  const handleVideoLoaded = (itemId: string, video: HTMLVideoElement) => {
    const width = video.videoWidth;
    const height = video.videoHeight;
    const aspectRatio = width / height;

    setVideoDimensions(prev => ({
      ...prev,
      [itemId]: { width, height, aspectRatio }
    }));
  };

  const handlePlayButtonClick = (itemId: string) => {
    if (playingVideo !== itemId) {
      setPlayingVideo(itemId);
    }
  };

  const stopVideo = () => {
    setPlayingVideo(null);
  };

  // Global click handler to stop videos
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (sectionRef.current?.contains(target)) {
        if (target.closest('.play-button') || target.closest('video')) {
          return;
        }

        if (target.closest('[data-gallery-card]')) {
          const cardElement = target.closest('[data-gallery-card]') as HTMLElement;
          const cardId = cardElement.getAttribute('data-card-id');

          if (cardId !== playingVideo && playingVideo) {
            stopVideo();
          }
        } else if (playingVideo) {
          stopVideo();
        }
      } else if (playingVideo) {
        stopVideo();
      }
    };

    if (playingVideo) {
      document.addEventListener('click', handleGlobalClick);
    }

    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [playingVideo]);

  if (isLoading) {
    return (
      <section className="py-20 bg-[#F2EBDC]">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-[#011526] mb-8">
              {langCode === 'fr' ? 'Galerie' : 'Gallery'}
            </h2>
            <p className="text-[#8D9FA6]">
              {langCode === 'fr' ? 'Chargement...' : 'Loading...'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="py-20 bg-[#F2EBDC]">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-[#011526] mb-6">
            {langCode === 'fr' ? 'Notre Galerie' : 'Our Gallery'}
          </h2>
          <p className="text-xl text-[#2A4759] max-w-3xl mx-auto leading-relaxed">
            {langCode === 'fr'
              ? 'Découvrez nos créations vidéo exceptionnelles qui transforment vos moments précieux en souvenirs cinématographiques inoubliables.'
              : 'Discover our exceptional video creations that transform your precious moments into unforgettable cinematic memories.'
            }
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {activeItems.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <p className="text-[#8D9FA6] text-lg">
                {langCode === 'fr' ? 'Aucun élément de galerie disponible.' : 'No gallery items available.'}
              </p>
            </div>
          ) : (
            activeItems.map((item: GalleryItem) => {
              const isPlaying = playingVideo === item.id;
              const dimensions = getEffectiveDimensions(item);
              
              // Dynamic container sizing based on video aspect ratio
              const getContainerSize = () => {
                if (!dimensions) return { width: 350, height: 250 };
                
                const { aspectRatio } = dimensions;
                const maxWidth = 400;
                const maxHeight = 400;
                
                if (aspectRatio > 1) {
                  // Landscape
                  const width = Math.min(maxWidth, 400);
                  const height = width / aspectRatio;
                  return { width, height };
                } else {
                  // Portrait
                  const height = Math.min(maxHeight, 400);
                  const width = height * aspectRatio;
                  return { width, height };
                }
              };

              const { width: containerWidth, height: containerHeight } = getContainerSize();
              const cardHeight = isPlaying ? containerHeight + 250 : 500;

              return (
                <div
                  key={item.id}
                  data-gallery-card
                  data-card-id={item.id}
                  className={`bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 ${
                    isPlaying ? 'col-span-full max-w-2xl mx-auto' : ''
                  }`}
                  style={{ height: `${cardHeight}px` }}
                >
                  {/* Video/Image Container */}
                  <div 
                    className="relative bg-gray-100 overflow-hidden" 
                    style={{ 
                      height: isPlaying ? `${containerHeight}px` : '250px',
                      width: isPlaying ? `${containerWidth}px` : '100%',
                      margin: isPlaying ? '0 auto' : '0'
                    }}
                  >
                    {isPlaying ? (
                      <video
                        ref={videoRef}
                        src={langCode === 'fr' ? 
                          item.videoUrlFr?.replace('http://supabase.memopyk.org:8001/object/public/', '/api/video-proxy/') :
                          item.videoUrlEn?.replace('http://supabase.memopyk.org:8001/object/public/', '/api/video-proxy/')
                        }
                        className="w-full h-full object-contain bg-black"
                        autoPlay
                        muted={isMuted}
                        controls={false}
                        onLoadedMetadata={(e) => handleVideoLoaded(item.id, e.currentTarget)}
                        onEnded={stopVideo}
                      />
                    ) : (
                      <img
                        src={langCode === 'fr' ? item.imageUrlFr : item.imageUrlEn}
                        alt={langCode === 'fr' ? item.titleFr : item.titleEn}
                        className="w-full h-full object-cover"
                      />
                    )}

                    {/* Play Button */}
                    {!isPlaying && (
                      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                        <button
                          className="play-button bg-[#D67C4A] hover:bg-[#C16A3A] text-white rounded-full w-16 h-16 flex items-center justify-center transform hover:scale-110 transition-all duration-200"
                          onClick={() => handlePlayButtonClick(item.id)}
                        >
                          <Play className="w-6 h-6 ml-1" />
                        </button>
                      </div>
                    )}

                    {/* Close Button */}
                    {isPlaying && (
                      <button
                        onClick={stopVideo}
                        className="absolute top-4 right-4 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200 z-10"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[#011526] mb-3">
                      {langCode === 'fr' ? item.titleFr : item.titleEn}
                    </h3>

                    {/* Features */}
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-sm text-[#8D9FA6]">
                        <FileImage className="w-4 h-4 flex-shrink-0" />
                        <span>{langCode === 'fr' ? item.feature1Fr : item.feature1En}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#8D9FA6]">
                        <Film className="w-4 h-4 flex-shrink-0" />
                        <span>{langCode === 'fr' ? item.feature2Fr : item.feature2En}</span>
                      </div>
                    </div>

                    {/* Stats and Price */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="text-sm text-[#8D9FA6]">
                        {langCode === 'fr' ? item.contentStatsFr : item.contentStatsEn}
                      </div>
                      <div className="text-lg font-bold text-[#D67C4A]">
                        {langCode === 'fr' ? item.priceFr : item.priceEn}
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