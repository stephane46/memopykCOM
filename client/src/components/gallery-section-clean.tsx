import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useVideoElementTracking } from '@/hooks/useVideoAnalytics';
import { Play, FileImage, Film } from 'lucide-react';

interface GalleryItem {
  id: string;
  titleFr: string;
  titleEn: string;
  videoUrlEn?: string;
  videoUrlFr?: string;
  imageUrlEn?: string;
  imageUrlFr?: string;
  staticImageUrlEn?: string;
  staticImageUrlFr?: string;
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

const GalleryCard: React.FC<{
  item: GalleryItem;
  language: string;
  isPlaying: boolean;
  onPlayClick: () => void;
  onStopVideo: () => void;
}> = ({ item, language, isPlaying, onPlayClick, onStopVideo }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState<{width: number, height: number} | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get current language from legacy hook
  const legacyLanguage = language === 'fr-FR' ? 'fr' : 'en';

  const videoUrl = legacyLanguage === 'fr' ? item.videoUrlFr : item.videoUrlEn;
  const title = legacyLanguage === 'fr' ? item.titleFr : item.titleEn;
  const duration = legacyLanguage === 'fr' ? item.durationFr : item.durationEn;
  const price = legacyLanguage === 'fr' ? item.priceFr : item.priceEn;
  const contentStats = legacyLanguage === 'fr' ? item.contentStatsFr : item.contentStatsEn;
  const feature1 = legacyLanguage === 'fr' ? item.feature1Fr : item.feature1En;
  const feature2 = legacyLanguage === 'fr' ? item.feature2Fr : item.feature2En;
  const staticImageUrl = legacyLanguage === 'fr' ? item.staticImageUrlFr : item.staticImageUrlEn;

  // Extract video filename for analytics
  const videoId = videoUrl ? (() => {
    let filename = videoUrl.includes('/object/public/memopyk-gallery/') 
      ? videoUrl.split('/object/public/memopyk-gallery/')[1]
      : videoUrl;
    filename = filename.replace(/^\/+/, '');
    filename = decodeURIComponent(filename);
    return filename;
  })() : `gallery-item-${item.id}`;

  // Video analytics tracking
  const { isTracking } = useVideoElementTracking(
    videoRef,
    {
      videoId: videoId,
      videoType: 'gallery',
      videoTitle: title || videoId
    },
    language === 'fr' ? 'fr-FR' : 'en-US'
  );

  // Create proxy URL for video
  const proxyUrl = videoUrl ? (() => {
    let filename = videoUrl.includes('/object/public/memopyk-gallery/') 
      ? videoUrl.split('/object/public/memopyk-gallery/')[1]
      : videoUrl;
    filename = filename.replace(/^\/+/, '');
    filename = decodeURIComponent(filename);
    return `/api/video-proxy/memopyk-gallery/${encodeURIComponent(filename)}`;
  })() : '';

  const imageProxyUrl = staticImageUrl ? (() => {
    let filename = staticImageUrl.includes('/object/public/memopyk-gallery/') 
      ? staticImageUrl.split('/object/public/memopyk-gallery/')[1]
      : staticImageUrl;
    filename = filename.replace(/^\/+/, '');
    filename = decodeURIComponent(filename);
    return `/api/image-proxy/memopyk-gallery/${encodeURIComponent(filename)}`;
  })() : '';

  // Auto-play when video becomes playing
  useEffect(() => {
    if (isPlaying && videoRef.current && videoLoaded) {
      videoRef.current.play().catch(console.error);
    } else if (!isPlaying && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isPlaying, videoLoaded]);

  const handlePlayButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlayClick();
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      onStopVideo();
    }
  };

  return (
    <div 
      className="relative bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer"
      style={{ height: isPlaying ? '700px' : '500px' }}
      onClick={handleCardClick}
    >
      {isPlaying && videoUrl ? (
        // Video playing mode with custom controls
        <div className="relative w-full h-full bg-black">
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            src={proxyUrl}
            preload="metadata"
            onLoadedMetadata={(e) => {
              setVideoLoaded(true);
              const video = e.target as HTMLVideoElement;
              setVideoDimensions({ width: video.videoWidth, height: video.videoHeight });
              setShowControls(true);
              setTimeout(() => setShowControls(false), 3000); // 3-second auto-hide
            }}
            onEnded={onStopVideo}
            onClick={() => {
              if (isPaused) {
                videoRef.current?.play();
                setIsPaused(false);
              } else {
                videoRef.current?.pause();
                setIsPaused(true);
              }
              setShowControls(true);
              setTimeout(() => setShowControls(false), 3000);
            }}
            muted={isMuted}
          />
          
          {/* Custom Controls Overlay */}
          {showControls && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none">
              {/* Control buttons */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 pointer-events-auto">
                {/* Restart button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (videoRef.current) {
                      videoRef.current.currentTime = 0;
                      videoRef.current.play();
                      setIsPaused(false);
                    }
                  }}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                  </svg>
                </button>
                
                {/* Play/Pause button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isPaused) {
                      videoRef.current?.play();
                      setIsPaused(false);
                    } else {
                      videoRef.current?.pause();
                      setIsPaused(true);
                    }
                  }}
                  className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
                >
                  {isPaused ? (
                    <Play className="w-6 h-6 text-white ml-1" fill="currentColor" />
                  ) : (
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                  )}
                </button>
                
                {/* Mute button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                    if (videoRef.current) {
                      videoRef.current.muted = !isMuted;
                    }
                  }}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
                >
                  {isMuted ? (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                  )}
                </button>
                
                {/* Close button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStopVideo();
                  }}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Thumbnail mode
        <>
          <div className="relative w-full h-[250px] overflow-hidden">
            {imageProxyUrl ? (
              <img
                src={imageProxyUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <div className="text-gray-500">
                  {language === 'fr' ? 'Image non disponible' : 'Image unavailable'}
                </div>
              </div>
            )}
            
            {/* Content stats overlay */}
            <div 
              className="absolute top-3 left-3 bg-black/60 text-white px-3 py-1 rounded-lg text-sm"
            >
              {contentStats || (language === 'fr' ? 'Détails à venir...' : 'Details coming soon...')}
            </div>

            {/* Duration */}
            {duration && (
              <div className="absolute top-3 right-3 bg-black/60 text-white px-2 py-1 rounded text-sm">
                {duration}
              </div>
            )}

            {/* Play button */}
            {videoUrl && (
              <button
                onClick={handlePlayButtonClick}
                className="absolute inset-0 flex items-center justify-center group"
              >
                <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <Play className="w-6 h-6 text-[#D67C4A] ml-1" fill="currentColor" />
                </div>
              </button>
            )}
          </div>

          {/* Card content */}
          <div className="p-4">
            <h3 className="text-xl font-semibold text-[#011526] mb-2 min-h-[48px] flex items-center">
              {title}
            </h3>

            {/* Features */}
            <div className="space-y-1 mb-4" style={{ height: '100px' }}>
              <div className="flex items-center text-[#2A4759]">
                <FileImage className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-sm">
                  {feature1 || (language === 'fr' ? 'Détails à venir...' : 'Details coming soon...')}
                </span>
              </div>
              <div className="flex items-center text-[#2A4759]">
                <Film className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-sm">
                  {feature2 || (language === 'fr' ? 'Détails à venir...' : 'Details coming soon...')}
                </span>
              </div>
            </div>

            {/* Price */}
            {price && (
              <div className="mt-auto">
                <div className="inline-block bg-[#D67C4A] text-white px-3 py-0.5 rounded-full text-sm font-medium">
                  {price}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default function GallerySection() {
  // CACHE BUSTER: Jan 20 2025 8:43PM - Modal video system
  const { language } = useLanguage();
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  const { data: galleryItems = [] } = useQuery<GalleryItem[]>({
    queryKey: ['/api/gallery-items'],
    staleTime: Infinity,
  });

  // Filter active items and sort by order
  const activeItems = galleryItems
    .filter(item => item.isActive)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const handlePlayVideo = (itemId: string) => {
    console.log('🎬 GALLERY DEBUG: handlePlayVideo called with itemId:', itemId);
    setPlayingVideoId(itemId);
  };

  const handleStopVideo = () => {
    console.log('🎬 GALLERY DEBUG: handleStopVideo called');
    setPlayingVideoId(null);
  };

  // Global click handler to stop videos when clicking outside
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as Element;
      const gallerySection = document.querySelector('[data-gallery-section]');
      
      if (gallerySection && !gallerySection.contains(target)) {
        setPlayingVideoId(null);
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  useEffect(() => {
    console.log('🚀 GALLERY LATEST VERSION 2025: Starting video preload for all gallery videos');
    const legacyLang = language === 'fr-FR' ? 'fr' : 'en';

    activeItems.forEach(item => {
      const videoUrl = legacyLang === 'fr' ? item.videoUrlFr : item.videoUrlEn;
      if (videoUrl) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        let filename = videoUrl.includes('/object/public/memopyk-gallery/') 
          ? videoUrl.split('/object/public/memopyk-gallery/')[1]
          : videoUrl;
        filename = filename.replace(/^\/+/, '');
        filename = decodeURIComponent(filename);
        const proxyUrl = `/api/video-proxy/memopyk-gallery/${encodeURIComponent(filename)}`;
        
        video.src = proxyUrl;
        video.load();
        
        video.addEventListener('canplaythrough', () => {
          console.log(`🚀 CACHED MODAL VERSION: ${item.titleFr || item.titleEn} permanently cached for instant replay`);
        });
      }
    });
  }, [activeItems, language]);

  if (activeItems.length === 0) {
    return (
      <section className="py-16 bg-gradient-to-br from-[#F2EBDC] to-white">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-[#011526] mb-4">
              {language === 'fr-FR' ? 'Galerie' : 'Gallery'}
            </h2>
            <p className="text-[#2A4759]">
              {language === 'fr-FR' ? 'Aucun contenu disponible' : 'No content available'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-[#F2EBDC] to-white" data-gallery-section>
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-[#011526] mb-4">
            {language === 'fr-FR' ? 'Notre Galerie - MODAL VERSION ✨' : 'Our Gallery - MODAL VERSION ✨'}
          </h2>
          <p className="text-lg text-[#2A4759] max-w-2xl mx-auto">
            {language === 'fr-FR'
              ? 'Découvrez nos créations visuelles qui transforment vos souvenirs en films émouvants'
              : 'Discover our visual creations that transform your memories into moving films'
            }
          </p>
        </div>

        {playingVideoId ? (
          // Single video display
          <div className="max-w-4xl mx-auto">
            {activeItems
              .filter(item => item.id === playingVideoId)
              .map(item => (
                <GalleryCard
                  key={item.id}
                  item={item}
                  language={language}
                  isPlaying={true}
                  onPlayClick={() => {}}
                  onStopVideo={handleStopVideo}
                />
              ))
            }
          </div>
        ) : (
          // Grid display
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeItems.map(item => (
              <GalleryCard
                key={item.id}
                item={item}
                language={language}
                isPlaying={false}
                onPlayClick={() => handlePlayVideo(item.id)}
                onStopVideo={handleStopVideo}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}