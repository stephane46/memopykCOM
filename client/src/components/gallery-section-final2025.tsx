import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";

// Console logging with timestamp for debugging
const logDebug = (message: string) => {
  console.log(`🚀 GALLERY FINAL 2025 VERSION: ${message}`);
};

interface GalleryItem {
  id: string;
  titleEn: string;
  titleFr: string;
  descriptionEn: string;
  descriptionFr: string;
  imageUrlEn?: string;
  imageUrlFr?: string;
  videoUrlEn?: string;
  videoUrlFr?: string;
  feature1En: string;
  feature1Fr: string;
  feature2En: string;
  feature2Fr: string;
  priceEn: string;
  priceFr: string;
  contentStatsEn?: string;
  contentStatsFr?: string;
  durationEn?: string;
  durationFr?: string;
  isActive: boolean;
  orderIndex: number;
  staticImageUrlEn?: string;
  staticImageUrlFr?: string;
  // Video metadata for overlay sizing
  videoWidthEn?: number;
  videoHeightEn?: number;
  videoWidthFr?: number;
  videoHeightFr?: number;
  videoOrientationEn?: string;
  videoOrientationFr?: string;
  videoAspectRatioEn?: number;
  videoAspectRatioFr?: number;
}

const GallerySection: React.FC = () => {
  const { legacyLanguage } = useLanguage();
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Update window dimensions for 2/3 sizing calculations
  const updateWindowDimensions = useCallback(() => {
    setWindowDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    });
  }, []);

  // Debounced resize handler
  const debouncedResize = useCallback(() => {
    clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(updateWindowDimensions, 100);
  }, [updateWindowDimensions]);

  useEffect(() => {
    updateWindowDimensions();
    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [debouncedResize]);

  // Load gallery data from API
  const { data: galleryItems = [], isLoading } = useQuery({
    queryKey: ["/api/gallery-items"],
    staleTime: Infinity,
  });

  // Video control functions
  const hideControlsAfterDelay = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  const handleVideoPlay = (itemId: string) => {
    logDebug(`🎬 OVERLAY: Playing video for item ${itemId}`);
    setPlayingVideoId(itemId);
    setIsPlaying(true);
    setShowControls(true);
    hideControlsAfterDelay();
  };

  const stopAllVideos = () => {
    logDebug(`🎬 OVERLAY: Stopping all videos`);
    setPlayingVideoId(null);
    setIsPlaying(false);
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
        hideControlsAfterDelay();
      }
      setShowControls(true);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const restartVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      if (!isPlaying) {
        videoRef.current.play();
        setIsPlaying(true);
        hideControlsAfterDelay();
      }
    }
  };

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (playingVideoId) {
        if (e.code === 'Space') {
          e.preventDefault();
          togglePlayPause();
        } else if (e.code === 'Escape') {
          stopAllVideos();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playingVideoId, isPlaying]);

  const getVideoUrl = (item: GalleryItem) => {
    const videoUrl = legacyLanguage === 'fr' ? item.videoUrlFr : item.videoUrlEn;
    if (!videoUrl) return null;
    
    // Convert to proxy URL format
    let filename = videoUrl.includes('/object/public/memopyk-gallery/') 
      ? videoUrl.split('/object/public/memopyk-gallery/')[1]
      : videoUrl;
    filename = filename.replace(/^\/+/, '');
    filename = decodeURIComponent(filename);
    
    return `/api/video-proxy/memopyk-gallery/${encodeURIComponent(filename)}`;
  };

  // Calculate video overlay dimensions based on 2/3 viewport rule
  const getVideoOverlayDimensions = (item: GalleryItem) => {
    const videoWidth = legacyLanguage === 'fr' ? item.videoWidthFr : item.videoWidthEn;
    const videoHeight = legacyLanguage === 'fr' ? item.videoHeightFr : item.videoHeightEn;
    const orientation = legacyLanguage === 'fr' ? item.videoOrientationFr : item.videoOrientationEn;
    
    if (!videoWidth || !videoHeight || !windowDimensions.width || !windowDimensions.height) {
      // Fallback dimensions
      return { width: 800, height: 600 };
    }

    const aspectRatio = videoWidth / videoHeight;
    const isPortrait = orientation === 'portrait' || aspectRatio < 1;

    if (isPortrait) {
      // Portrait: height = 66.66% of viewport height, width = auto
      const containerHeight = windowDimensions.height * 0.6667;
      const containerWidth = containerHeight * aspectRatio;
      return { width: containerWidth, height: containerHeight };
    } else {
      // Landscape: width = 66.66% of viewport width, height = auto
      const containerWidth = windowDimensions.width * 0.6667;
      const containerHeight = containerWidth / aspectRatio;
      return { width: containerWidth, height: containerHeight };
    }
  };

  const visibleItems = (galleryItems as GalleryItem[])
    .filter((item: GalleryItem) => item.isActive)
    .sort((a: GalleryItem, b: GalleryItem) => a.orderIndex - b.orderIndex);

  logDebug(`Rendering ${visibleItems.length} gallery items`);

  // Handle global click to stop videos when clicking outside gallery
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Stop videos if clicking outside gallery or on other cards
      if (!target.closest('.gallery-card') || 
          (target.closest('.gallery-card') && !target.closest('video') && !target.closest('.play-button'))) {
        const clickedCard = target.closest('.gallery-card');
        const currentPlayingCard = document.querySelector(`[data-video-id="${playingVideoId}"]`);
        
        // Stop video if clicking different card or outside gallery
        if (!clickedCard || clickedCard !== currentPlayingCard) {
          stopAllVideos();
        }
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [playingVideoId]);

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
            {legacyLanguage === 'fr' ? 'Notre Galerie - FINAL 2025 VERSION ✨' : 'Our Gallery - FINAL 2025 VERSION ✨'}
          </h2>
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
          {legacyLanguage === 'fr' ? 'Notre Galerie - FINAL 2025 VERSION ✨' : 'Our Gallery - FINAL 2025 VERSION ✨'}
        </h2>
        


        {/* Gallery Grid - With blur effect when video playing */}
        <div 
          className={`gallery-container transition-all duration-500 ${playingVideoId ? 'blur-sm' : ''}`}
          style={{
            filter: playingVideoId ? 'blur(8px)' : 'none',
            backdropFilter: playingVideoId ? 'blur(8px)' : 'none',
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {visibleItems.map((item: GalleryItem) => {
              const videoUrl = getVideoUrl(item);
              const imageUrl = legacyLanguage === 'fr' ? (item.staticImageUrlFr || item.imageUrlFr) : (item.staticImageUrlEn || item.imageUrlEn);
              const title = legacyLanguage === 'fr' ? item.titleFr : item.titleEn;
              const description = legacyLanguage === 'fr' ? item.descriptionFr : item.descriptionEn;
              const feature1 = legacyLanguage === 'fr' ? item.feature1Fr : item.feature1En;
              const feature2 = legacyLanguage === 'fr' ? item.feature2Fr : item.feature2En;
              const price = legacyLanguage === 'fr' ? item.priceFr : item.priceEn;
              const contentStats = legacyLanguage === 'fr' ? item.contentStatsFr : item.contentStatsEn;
              const duration = legacyLanguage === 'fr' ? item.durationFr : item.durationEn;

              return (
                <div 
                  key={item.id} 
                  className="gallery-card bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                  data-video-id={item.id}
                >
                  {/* Image/Thumbnail Area */}
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    
                    {/* Content Stats Overlay */}
                    {contentStats && (
                      <div className="absolute top-4 left-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-lg text-sm">
                        {contentStats}
                      </div>
                    )}
                    
                    {/* Duration Overlay */}
                    {duration && (
                      <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-lg text-sm">
                        {duration}
                      </div>
                    )}
                    
                    {/* Play Button - only show if video exists */}
                    {videoUrl && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVideoPlay(item.id);
                          }}
                          className="play-button bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300"
                          style={{
                            animation: 'pulse 8s ease-in-out infinite',
                            opacity: '0.9'
                          }}
                          aria-label={`Play ${title} video`}
                        >
                          <Play size={32} fill="white" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{description}</p>
                    
                    {/* Features */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="w-2 h-2 bg-orange-400 rounded-full mr-2"></span>
                        {feature1 || "Details coming soon..."}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="w-2 h-2 bg-orange-400 rounded-full mr-2"></span>
                        {feature2 || "Details coming soon..."}
                      </div>
                    </div>
                    
                    {/* Price */}
                    <div className="text-right">
                      <span className="text-2xl font-bold text-orange-600">{price}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Video Overlay - Appears when video is playing */}
        {playingVideoId && (() => {
          const playingItem = visibleItems.find(item => item.id === playingVideoId);
          if (!playingItem) return null;

          const videoUrl = getVideoUrl(playingItem);
          if (!videoUrl) return null;

          const dimensions = getVideoOverlayDimensions(playingItem);
          const title = legacyLanguage === 'fr' ? playingItem.titleFr : playingItem.titleEn;

          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-500"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(10px)',
              }}
              onClick={(e) => {
                // Close when clicking outside video container
                if (e.target === e.currentTarget) {
                  stopAllVideos();
                }
              }}
            >
              {/* Video Container */}
              <div
                className="relative bg-black rounded-lg overflow-hidden shadow-2xl"
                style={{
                  width: `${dimensions.width}px`,
                  height: `${dimensions.height}px`,
                  maxWidth: '90vw',
                  maxHeight: '90vh',
                }}
                onClick={(e) => {
                  // Show controls and toggle play/pause when clicking video area
                  if (e.target === videoRef.current) {
                    togglePlayPause();
                  }
                  setShowControls(true);
                }}
              >
                {/* Video Element */}
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full object-contain"
                  autoPlay
                  onPlay={() => {
                    setIsPlaying(true);
                    hideControlsAfterDelay();
                  }}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => stopAllVideos()}
                  onLoadedMetadata={(e) => {
                    const video = e.target as HTMLVideoElement;
                    logDebug(`🎬 OVERLAY: Video loaded - ${video.videoWidth}x${video.videoHeight}`);
                  }}
                />

                {/* Control Bar */}
                <div
                  className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
                    showControls ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center space-x-4">
                      {/* Restart Button */}
                      <button
                        onClick={restartVideo}
                        className="p-2 rounded-full hover:bg-white/20 transition-colors"
                        aria-label="Restart video"
                      >
                        <RotateCcw size={20} />
                      </button>

                      {/* Play/Pause Button */}
                      <button
                        onClick={togglePlayPause}
                        className="p-2 rounded-full hover:bg-white/20 transition-colors"
                        aria-label={isPlaying ? "Pause video" : "Play video"}
                      >
                        {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                      </button>

                      {/* Mute/Unmute Button */}
                      <button
                        onClick={toggleMute}
                        className="p-2 rounded-full hover:bg-white/20 transition-colors"
                        aria-label={isMuted ? "Unmute video" : "Mute video"}
                      >
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                      </button>
                    </div>

                    {/* Video Title */}
                    <div className="text-sm font-medium">{title}</div>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={stopAllVideos}
                  className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-colors"
                  aria-label="Close video"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </section>
  );
};

export default GallerySection;