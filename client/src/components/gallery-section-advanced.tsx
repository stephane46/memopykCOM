import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, VolumeX, Volume2 } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
// import { useVideoElementTracking } from '@/hooks/useVideoAnalytics';
import { useQuery } from '@tanstack/react-query';

interface GalleryItem {
  id: string;
  titleFr: string;
  titleEn: string;
  descriptionFr: string;
  descriptionEn: string;
  imageUrlFr: string;
  imageUrlEn: string;
  staticImageUrlFr?: string;
  staticImageUrlEn?: string;
  videoUrlFr: string;
  videoUrlEn: string;
  feature1Fr: string;
  feature1En: string;
  feature2Fr: string;
  feature2En: string;
  priceFr: string;
  priceEn: string;
  isActive: boolean;
  orderIndex: number;
}

const GallerySection: React.FC = () => {
  const { legacyLanguage } = useLanguage();
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [videoDimensions, setVideoDimensions] = useState<{[key: string]: {width: number, height: number, aspectRatio: number}}>({});
  const [showControls, setShowControls] = useState<{[key: string]: boolean}>({});
  const [isPaused, setIsPaused] = useState<{[key: string]: boolean}>({});
  const [isMuted, setIsMuted] = useState<{[key: string]: boolean}>({});
  const videoRefs = useRef<{[key: string]: HTMLVideoElement | null}>({});
  const controlsTimeoutRef = useRef<{[key: string]: NodeJS.Timeout}>({});

  // Video analytics tracking
  // useVideoElementTracking();

  // Fetch gallery items
  const { data: galleryItems = [], isLoading } = useQuery<GalleryItem[]>({
    queryKey: ['/api/gallery-items'],
  });

  const logDebug = (message: string) => {
    console.log(`🎬 GALLERY ADVANCED: ${message}`);
  };

  const handleVideoPlay = (videoUrl: string) => {
    logDebug(`🎬 Starting video playback: ${videoUrl}`);
    setPlayingVideo(videoUrl);
    setShowControls(prev => ({ ...prev, [videoUrl]: false })); // START WITH HIDDEN CONTROLS
    setIsPaused(prev => ({ ...prev, [videoUrl]: false }));
    setIsMuted(prev => ({ ...prev, [videoUrl]: false })); // Sound-on by default
    
    // Clear any existing timeout
    if (controlsTimeoutRef.current[videoUrl]) {
      clearTimeout(controlsTimeoutRef.current[videoUrl]);
    }

    // Force immediate video play using preloaded version if available
    setTimeout(() => {
      const video = videoRefs.current[videoUrl];
      const preloadedVideo = videoRefs.current[videoUrl + '_preload'];
      
      // Try to use preloaded video first
      if (preloadedVideo && preloadedVideo.readyState >= 3) {
        logDebug(`🎬 PRELOAD READY: Using cached version for instant play`);
        // The main video will sync with preloaded one in the ref callback
      } else if (video && video.readyState >= 3) {
        video.play().catch(() => {
          logDebug(`❌ Force play failed for ${videoUrl}`);
        });
        logDebug(`🎬 INSTANT PLAY: Forced playback for ${videoUrl}`);
      } else {
        logDebug(`⏳ Video not ready yet: ${videoUrl} (main: ${video?.readyState || 'none'}, preload: ${preloadedVideo?.readyState || 'none'})`);
      }
    }, 50);
  };

  const handleVideoLoadedMetadata = (videoUrl: string, video: HTMLVideoElement) => {
    const { videoWidth, videoHeight } = video;
    const aspectRatio = videoWidth / videoHeight;
    
    setVideoDimensions(prev => ({
      ...prev,
      [videoUrl]: {
        width: videoWidth,
        height: videoHeight,
        aspectRatio
      }
    }));
    
    logDebug(`🎬 Video loaded - ${videoWidth}x${videoHeight} (${aspectRatio.toFixed(2)})`);
  };

  const handleVideoClick = (videoUrl: string) => {
    const video = videoRefs.current[videoUrl];
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPaused(prev => ({ ...prev, [videoUrl]: false }));
    } else {
      video.pause();
      setIsPaused(prev => ({ ...prev, [videoUrl]: true }));
    }
    
    // Show controls when clicking video
    setShowControls(prev => ({ ...prev, [videoUrl]: true }));
    
    // Reset auto-hide timer
    if (controlsTimeoutRef.current[videoUrl]) {
      clearTimeout(controlsTimeoutRef.current[videoUrl]);
    }
    controlsTimeoutRef.current[videoUrl] = setTimeout(() => {
      setShowControls(prev => ({ ...prev, [videoUrl]: false }));
    }, 3000);
  };

  const handlePlayPause = (videoUrl: string) => {
    const video = videoRefs.current[videoUrl];
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPaused(prev => ({ ...prev, [videoUrl]: false }));
    } else {
      video.pause();
      setIsPaused(prev => ({ ...prev, [videoUrl]: true }));
    }
  };

  const handleRestart = (videoUrl: string) => {
    const video = videoRefs.current[videoUrl];
    if (!video) return;
    
    video.currentTime = 0;
    video.play();
    setIsPaused(prev => ({ ...prev, [videoUrl]: false }));
  };

  const handleMuteToggle = (videoUrl: string) => {
    const video = videoRefs.current[videoUrl];
    if (!video) return;
    
    video.muted = !video.muted;
    setIsMuted(prev => ({ ...prev, [videoUrl]: video.muted }));
  };

  const stopVideo = () => {
    if (!playingVideo) return;
    
    const video = videoRefs.current[playingVideo];
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    
    setPlayingVideo(null);
    setShowControls({});
    setIsPaused({});
    
    // Clear all timeouts
    Object.values(controlsTimeoutRef.current).forEach(timeout => {
      if (timeout) clearTimeout(timeout);
    });
    controlsTimeoutRef.current = {};
  };

  const getVideoUrl = (item: GalleryItem) => {
    const baseUrl = legacyLanguage === 'fr' ? item.videoUrlFr : item.videoUrlEn;
    if (!baseUrl) return null;
    
    // Convert to proxy format if needed
    if (baseUrl.includes('supabase.memopyk.org')) {
      const filename = baseUrl.split('/').pop();
      return `/api/video-proxy/memopyk-gallery/${filename}`;
    }
    
    return baseUrl.startsWith('/api/video-proxy/') ? baseUrl : `/api/video-proxy/memopyk-gallery/${baseUrl}`;
  };

  const getContainerSize = (videoUrl: string) => {
    const dims = videoDimensions[videoUrl];
    if (!dims) return { maxWidth: '800px', maxHeight: '600px' };

    const isPortrait = dims.aspectRatio < 1;
    
    if (isPortrait) {
      return { maxWidth: '400px', maxHeight: '600px' };
    } else {
      return { maxWidth: '800px', maxHeight: '450px' };
    }
  };

  // Global click handler and ESC key to stop video
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Don't close if clicking on video, controls, or play buttons
      if (target.closest('[data-video-player]') || 
          target.closest('[data-video-controls]') || 
          target.closest('button')) {
        return;
      }
      
      // Stop video if clicking outside
      if (playingVideo) {
        stopVideo();
      }
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && playingVideo) {
        logDebug(`🛑 ESC key pressed - stopping ${playingVideo}`);
        stopVideo();
      }
    };

    if (playingVideo) {
      // Add delay to prevent immediate closure
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleGlobalClick);
      }, 100);
      
      // Add keydown listener immediately (no delay needed)
      document.addEventListener('keydown', handleKeyPress);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('click', handleGlobalClick);
        document.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [playingVideo]);

  const visibleItems = galleryItems
    .filter((item: GalleryItem) => item.isActive)
    .sort((a: GalleryItem, b: GalleryItem) => a.orderIndex - b.orderIndex);

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
            {legacyLanguage === 'fr' ? 'Notre Galerie' : 'Our Gallery'}
          </h2>
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="gallery-section" className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
          {legacyLanguage === 'fr' ? 'Notre Galerie' : 'Our Gallery'}
        </h2>
        
        {/* Playing Video Overlay (replaces grid when active) */}
        {playingVideo && (
          <div className="relative mb-16">
            {/* Blurred Background Grid */}
            <div className="absolute inset-0 filter blur-sm opacity-30 z-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {visibleItems.map((item: GalleryItem) => {
                  const imageUrl = legacyLanguage === 'fr' ? (item.staticImageUrlFr || item.imageUrlFr) : (item.staticImageUrlEn || item.imageUrlEn);
                  const title = legacyLanguage === 'fr' ? item.titleFr : item.titleEn;
                  
                  return (
                    <div key={item.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                      <div className="relative h-64">
                        <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Active Video Player */}
            <div className="relative z-10 flex justify-center items-center min-h-[400px]">
              <div 
                data-video-player
                className="relative rounded-xl overflow-hidden shadow-2xl"
                style={{
                  ...getContainerSize(playingVideo),
                  backgroundColor: 'transparent'
                }}
              >
                <video
                  ref={(el) => { 
                    if (el) {
                      videoRefs.current[playingVideo] = el;
                      // If there's a preloaded version, sync it
                      const preloadedVideo = videoRefs.current[playingVideo + '_preload'];
                      if (preloadedVideo && preloadedVideo.readyState >= 3) {
                        el.currentTime = preloadedVideo.currentTime || 0;
                        logDebug(`🎬 SYNC: Transferred preloaded state to playing video`);
                      }
                    }
                  }}
                  src={playingVideo}
                  preload="auto"
                  autoPlay
                  className="w-full h-full object-contain"
                  onLoadedMetadata={(e) => {
                    handleVideoLoadedMetadata(playingVideo, e.currentTarget);
                    // Smart preloading: upgrade to full preload after metadata loads
                    e.currentTarget.preload = "auto";
                  }}
                  onCanPlay={(e) => {
                    // Start playing immediately when video can play
                    const video = e.currentTarget;
                    if (video.paused) {
                      video.play().catch(() => {
                        logDebug(`❌ Autoplay failed for ${playingVideo}`);
                      });
                    }
                    // Hide controls immediately when video is ready to play
                    setShowControls(prev => ({ ...prev, [playingVideo]: false }));
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVideoClick(playingVideo);
                  }}
                />
                
                {/* Custom Video Controls */}
                {showControls[playingVideo] && (
                  <div 
                    data-video-controls
                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-black bg-opacity-75 rounded-full px-6 py-3 transition-opacity duration-300"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestart(playingVideo);
                      }}
                      className="text-white hover:text-orange-400 transition-colors"
                    >
                      <RotateCcw size={24} />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayPause(playingVideo);
                      }}
                      className="text-white hover:text-orange-400 transition-colors"
                    >
                      {isPaused[playingVideo] ? <Play size={24} /> : <Pause size={24} />}
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMuteToggle(playingVideo);
                      }}
                      className="text-white hover:text-orange-400 transition-colors"
                    >
                      {isMuted[playingVideo] ? <VolumeX size={24} /> : <Volume2 size={24} />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Gallery Grid (hidden when video is playing) */}
        {!playingVideo && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {visibleItems.map((item: GalleryItem) => {
              const videoUrl = getVideoUrl(item);
              // Fix double proxy paths in static image URLs
              let imageUrl = legacyLanguage === 'fr' ? (item.staticImageUrlFr || item.imageUrlFr) : (item.staticImageUrlEn || item.imageUrlEn);
              if (imageUrl && imageUrl.includes('/api/image-proxy/memopyk-gallery/api/image-proxy/')) {
                imageUrl = imageUrl.replace('/api/image-proxy/memopyk-gallery/api/image-proxy/', '/api/image-proxy/');
              }
              const title = legacyLanguage === 'fr' ? item.titleFr : item.titleEn;
              const description = legacyLanguage === 'fr' ? item.descriptionFr : item.descriptionEn;
              const feature1 = legacyLanguage === 'fr' ? item.feature1Fr : item.feature1En;
              const feature2 = legacyLanguage === 'fr' ? item.feature2Fr : item.feature2En;
              const price = legacyLanguage === 'fr' ? item.priceFr : item.priceEn;

              return (
                <div key={item.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  {/* Image/Thumbnail */}
                  <div className="relative h-64 overflow-hidden group">
                    <img
                      src={imageUrl}
                      alt={title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-transparent group-hover:from-black/20 group-hover:to-black/30 transition-all duration-300" />
                    
                    {/* Play Button with Elegant Pulse */}
                    {videoUrl && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVideoPlay(videoUrl);
                          }}
                          className="bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300"
                          style={{
                            animation: 'pulse-elegant 8s ease-in-out infinite'
                          }}
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
                    <div className="space-y-2 mb-4 h-20 flex flex-col justify-center">
                      <div className="flex items-center text-sm text-[#2A4759]">
                        <span className="w-2 h-2 bg-orange-400 rounded-full mr-2 flex-shrink-0"></span>
                        <span>{feature1 || "Details coming soon..."}</span>
                      </div>
                      <div className="flex items-center text-sm text-[#2A4759]">
                        <span className="w-2 h-2 bg-orange-400 rounded-full mr-2 flex-shrink-0"></span>
                        <span>{feature2 || "Details coming soon..."}</span>
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
        )}

        {/* Hidden Video Elements for Smart Preloading */}
        <div className="hidden">
          {visibleItems.map((item: GalleryItem) => {
            const videoUrl = getVideoUrl(item);
            if (!videoUrl || playingVideo === videoUrl) return null; // Don't duplicate the playing video
            
            return (
              <video
                key={`preload-${item.id}`}
                ref={(el) => { 
                  if (el) {
                    videoRefs.current[videoUrl + '_preload'] = el; // Use preload suffix
                  }
                }}
                src={videoUrl}
                preload="auto"
                muted
                onLoadedMetadata={(e) => {
                  handleVideoLoadedMetadata(videoUrl, e.currentTarget);
                  logDebug(`🎬 AGGRESSIVE CACHE: ${item.titleEn || item.titleFr} metadata loaded`);
                }}
                onCanPlayThrough={() => {
                  logDebug(`🎬 CACHED: ${item.titleEn || item.titleFr} permanently cached for instant replay`);
                }}
                onLoadedData={() => {
                  logDebug(`🎬 READY: ${item.titleEn || item.titleFr} fully loaded and ready for instant play`);
                  
                  // Track cache completion across all 6 videos
                  setTimeout(() => {
                    const allVideos = Object.keys(videoRefs.current).filter(key => key.includes('_preload'));
                    const readyVideos = allVideos.filter(key => {
                      const video = videoRefs.current[key];
                      return video && video.readyState >= 3;
                    });
                    
                    if (readyVideos.length === allVideos.length && allVideos.length > 0) {
                      logDebug(`🎉 CACHE COMPLETE: All ${allVideos.length}/6 videos cached for instant playback!`);
                    } else {
                      logDebug(`📊 CACHE PROGRESS: ${readyVideos.length}/${allVideos.length} videos ready`);
                    }
                  }, 100);
                }}
              />
            );
          })}
        </div>
      </div>
      
      <style>{`
        @keyframes pulse-elegant {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 1; }
        }
      `}</style>
    </section>
  );
};

export default GallerySection;