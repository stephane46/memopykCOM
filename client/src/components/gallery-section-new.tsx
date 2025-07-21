import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { Play, Clock, FileImage, Film, RotateCcw, Volume2, VolumeX, X } from 'lucide-react';

interface GalleryItem {
  id: string;
  titleFr: string;
  titleEn: string;
  descriptionFr: string;
  descriptionEn: string;
  durationFr: string;
  durationEn: string;
  feature1Fr: string;
  feature1En: string;
  feature2Fr: string;
  feature2En: string;
  contentStatsFr: string;
  contentStatsEn: string;
  imageUrlFr: string;
  imageUrlEn: string;
  videoUrlFr: string;
  videoUrlEn: string;
  priceFr: string;
  priceEn: string;
  staticImageUrlFr?: string;
  staticImageUrlEn?: string;
  isActive: boolean;
  orderIndex: number;
  noVideoMessageFr?: string;
  noVideoMessageEn?: string;
}

export default function GalleryWorking() {
  const { legacyLanguage: language } = useLanguage();
  const [playingVideoId, setPlayingVideoId] = React.useState<string | null>(null);
  const [showControls, setShowControls] = React.useState<boolean>(false);
  const [isPaused, setIsPaused] = React.useState<boolean>(false);
  const [isMuted, setIsMuted] = React.useState<boolean>(false);
  const [videoDimensions, setVideoDimensions] = React.useState<{width: number, height: number} | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const { data: galleryItems = [], isLoading } = useQuery({
    queryKey: ['/api/gallery-items'],
  });

  const activeItems = (galleryItems as GalleryItem[])
    .filter((item: GalleryItem) => item.isActive)
    .sort((a: GalleryItem, b: GalleryItem) => a.orderIndex - b.orderIndex);

  const playingItem = activeItems.find(item => item.id === playingVideoId);
  
  // Debug logging
  React.useEffect(() => {
    console.log('🎬 GALLERY DEBUG: playingVideoId changed to:', playingVideoId);
    console.log('🎬 GALLERY DEBUG: playingItem found:', playingItem ? 'YES' : 'NO');
    console.log('🎬 GALLERY DEBUG: Modal condition (playingVideoId && playingItem):', !!(playingVideoId && playingItem));
  }, [playingVideoId, playingItem]);

  // Start auto-hide controls timer
  const startControlsTimer = () => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  // Stop controls timer
  const stopControlsTimer = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = null;
    }
  };

  const handlePlayVideo = (itemId: string) => {
    console.log('🎬 GALLERY DEBUG: handlePlayVideo called with itemId:', itemId);
    console.log('🎬 GALLERY DEBUG: Before state update - playingVideoId:', playingVideoId);
    setPlayingVideoId(itemId);
    setShowControls(true);
    setIsPaused(false);
    setIsMuted(false);
    startControlsTimer();
    console.log('🎬 GALLERY DEBUG: State updates called - should trigger modal');
  };

  const handleVideoEnd = () => {
    setPlayingVideoId(null);
    setShowControls(false);
    setIsPaused(false);
    setVideoDimensions(null);
    stopControlsTimer();
  };

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.play();
        setIsPaused(false);
      } else {
        videoRef.current.pause();
        setIsPaused(true);
      }
      setShowControls(true);
      startControlsTimer();
    }
  };

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPaused(false);
      setShowControls(true);
      startControlsTimer();
    }
  };

  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      const { videoWidth, videoHeight } = videoRef.current;
      setVideoDimensions({ width: videoWidth, height: videoHeight });
    }
  };

  const handleCloseVideo = () => {
    setPlayingVideoId(null);
    setShowControls(false);
    setIsPaused(false);
    setVideoDimensions(null);
    stopControlsTimer();
  };

  // Global click handler to close video when clicking outside
  React.useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      if (playingVideoId) {
        const target = event.target as HTMLElement;
        const isVideoControl = target.closest('[data-video-controls]') || target.hasAttribute('data-video-controls');
        const isPlayButton = target.closest('[data-play-button]') || target.hasAttribute('data-play-button');
        const isVideo = target.tagName === 'VIDEO';
        
        if (!isVideoControl && !isPlayButton && !isVideo) {
          handleCloseVideo();
        }
      }
    };

    if (playingVideoId) {
      document.addEventListener('click', handleGlobalClick);
      return () => document.removeEventListener('click', handleGlobalClick);
    }
  }, [playingVideoId]);

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => stopControlsTimer();
  }, []);

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

        {playingVideoId && playingItem ? (
          // Single Video Display - replaces entire grid
          <div className="flex justify-center">
            <div 
              className="relative bg-black rounded-lg overflow-hidden shadow-2xl" 
              data-video-container
            >
              <video
                ref={videoRef}
                src={`/api/video-proxy/memopyk-gallery/${encodeURIComponent(language === 'fr' ? playingItem.videoUrlFr : playingItem.videoUrlEn)}`}
                className={`
                  ${videoDimensions 
                    ? videoDimensions.height > videoDimensions.width 
                      ? 'max-w-[400px]' // Portrait: 400px max width
                      : 'max-w-[800px]' // Landscape: 800px max width
                    : 'max-w-[800px]' // Default fallback
                  } 
                  max-h-[80vh] w-auto h-auto
                `}
                autoPlay
                onEnded={handleVideoEnd}
                onLoadedMetadata={handleVideoLoadedMetadata}
                onClick={handleVideoClick}
                style={{ cursor: 'pointer' }}
                data-video-controls
              />
              
              {/* Custom Controls Overlay */}
              {showControls && (
                <div 
                  className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center transition-opacity duration-300"
                  data-video-controls
                >
                  <div className="flex gap-4 bg-black bg-opacity-70 px-6 py-3 rounded-lg">
                    {/* Restart Button */}
                    <button
                      onClick={handleRestart}
                      className="text-white hover:text-[#D67C4A] transition-colors duration-200"
                      title="Restart video"
                      data-video-controls
                    >
                      <RotateCcw className="w-6 h-6" />
                    </button>
                    
                    {/* Play/Pause Button */}
                    <button
                      onClick={handleVideoClick}
                      className="text-white hover:text-[#D67C4A] transition-colors duration-200"
                      title={isPaused ? "Play" : "Pause"}
                      data-video-controls
                    >
                      {isPaused ? (
                        <Play className="w-6 h-6" />
                      ) : (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                        </svg>
                      )}
                    </button>
                    
                    {/* Mute/Unmute Button */}
                    <button
                      onClick={handleMute}
                      className="text-white hover:text-[#D67C4A] transition-colors duration-200"
                      title={isMuted ? "Unmute" : "Mute"}
                      data-video-controls
                    >
                      {isMuted ? (
                        <VolumeX className="w-6 h-6" />
                      ) : (
                        <Volume2 className="w-6 h-6" />
                      )}
                    </button>
                    
                    {/* Close Button */}
                    <button
                      onClick={handleCloseVideo}
                      className="text-white hover:text-red-400 transition-colors duration-200 ml-2"
                      title="Close"
                      data-video-controls
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Grid Layout - show all gallery cards
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {activeItems.map((item: GalleryItem) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                {/* Image Container with Play Button */}
                <div className="relative h-64 bg-gray-100">
                  <img
                    src={`/api/image-proxy/memopyk-gallery/${encodeURIComponent(language === 'fr' ? item.staticImageUrlFr || item.imageUrlFr : item.staticImageUrlEn || item.imageUrlEn)}`}
                    alt={language === 'fr' ? item.titleFr : item.titleEn}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent hover:from-black/20 to-transparent hover:to-black/30 transition-all duration-300 flex items-center justify-center">
                    <button
                      onClick={() => handlePlayVideo(item.id)}
                      className="bg-gradient-to-r from-[#E8A56D] to-[#D67C4A] hover:from-[#D67C4A] hover:to-[#B8663D] text-white rounded-full w-14 h-14 flex items-center justify-center transition-all duration-200 opacity-90 hover:opacity-100"
                      data-play-button
                      style={{
                        animation: 'pulse-elegant 8s ease-in-out infinite'
                      }}
                    >
                      <Play className="w-5 h-5 ml-0.5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[#011526] mb-3">
                    {language === 'fr' ? item.titleFr : item.titleEn}
                  </h3>
                  
                  <p className="text-[#8D9FA6] mb-4 text-sm line-clamp-2">
                    {language === 'fr' ? item.descriptionFr : item.descriptionEn}
                  </p>

                  {/* Content Stats and Duration */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1 text-[#8D9FA6] text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{language === 'fr' ? item.durationFr : item.durationEn}</span>
                    </div>
                    
                    <div className="text-[#8D9FA6] text-xs">
                      {language === 'fr' ? item.contentStatsFr : item.contentStatsEn}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2 text-xs text-[#2A4759]">
                      <FileImage className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">
                        {language === 'fr' ? (item.feature1Fr || 'Cinématographie professionnelle') : (item.feature1En || 'Professional cinematography')}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-[#2A4759]">
                      <Film className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">
                        {language === 'fr' ? (item.feature2Fr || 'Montage créatif') : (item.feature2En || 'Creative editing')}
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <div className="inline-block bg-[#D67C4A] text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {language === 'fr' ? item.priceFr : item.priceEn}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

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