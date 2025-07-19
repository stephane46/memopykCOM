import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useVideoElementTracking } from '@/hooks/useVideoAnalytics';
import { Play, FileImage, Film, X, Expand, Volume2, VolumeX, RotateCcw } from 'lucide-react';

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
  staticImageUrlEn?: string;
  staticImageUrlFr?: string;
  imagePositionEn?: { x: number; y: number; scale: number };
  imagePositionFr?: { x: number; y: number; scale: number };
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

// Component for single video display
const SingleVideoContainer: React.FC<{
  item: GalleryItem;
  language: string;
  onVideoClick: () => void;
  onVideoLoaded: (itemId: string, video: HTMLVideoElement) => void;
}> = ({ item, language, onVideoClick, onVideoLoaded }) => {
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [dimensions, setDimensions] = useState<{width: number, height: number} | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const videoUrl = language === 'fr' ? item.videoUrlFr : item.videoUrlEn;
  const title = language === 'fr' ? item.titleFr : item.titleEn;
  
  // Extract video filename to use as unique video ID for analytics
  const videoId = videoUrl ? (() => {
    let filename = videoUrl.includes('/object/public/memopyk-gallery/') 
      ? videoUrl.split('/object/public/memopyk-gallery/')[1]
      : videoUrl;
    
    // Clean up extra slashes and decode any existing encoding
    filename = filename.replace(/^\/+/, ''); // Remove leading slashes
    filename = decodeURIComponent(filename); // Decode any existing encoding
    
    return filename; // This is the actual video file name
  })() : `gallery-item-${item.id}`;
  
  // Video analytics tracking - always call this hook regardless of video existence
  const { isTracking, sessionId } = useVideoElementTracking(
    videoRef,
    {
      videoId: videoId, // Use the actual video filename as ID
      videoType: 'gallery',
      videoTitle: title || videoId
    },
    language === 'fr' ? 'fr-FR' : 'en-US'
  );
  
  console.log('🎬 SINGLE VIDEO - Original URL:', videoUrl);
  
  // Extract filename from full Supabase URL and create proxy URL
  const proxyUrl = videoUrl ? (() => {
    let filename = videoUrl.includes('/object/public/memopyk-gallery/') 
      ? videoUrl.split('/object/public/memopyk-gallery/')[1]
      : videoUrl;
    
    // Clean up extra slashes and decode any existing encoding
    filename = filename.replace(/^\/+/, ''); // Remove leading slashes
    filename = decodeURIComponent(filename); // Decode any existing encoding
    
    console.log('🎬 FILENAME EXTRACTED:', filename);
    return `/api/video-proxy/memopyk-gallery/${encodeURIComponent(filename)}`;
  })() : '';
  
  console.log('🎬 SINGLE VIDEO - Proxy URL:', proxyUrl);
  
  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const { videoWidth, videoHeight } = video;
      
      // Calculate container size based on 75% of screen
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const maxWidth = screenWidth * 0.75;
      const maxHeight = screenHeight * 0.75;
      
      const aspectRatio = videoWidth / videoHeight;
      let containerWidth, containerHeight;
      
      if (aspectRatio > 1) {
        // Landscape: use 50% of screen width
        containerWidth = maxWidth;
        containerHeight = containerWidth / aspectRatio;
      } else {
        // Portrait: use 50% of screen height
        containerHeight = maxHeight;
        containerWidth = containerHeight * aspectRatio;
      }
      
      setDimensions({ width: containerWidth, height: containerHeight });
      
      // Direct calculation without complex preloading
      console.log('🎬 METADATA LOADED: Setting dimensions immediately');
    }
  };

  const handleCanPlay = () => {
    if (videoRef.current) {
      setVideoReady(true);
      console.log('🎬 CAN PLAY: Video ready for immediate playback without stalling');
    }
  };

  const handleCanPlayThrough = () => {
    if (videoRef.current) {
      setVideoReady(true);
      console.log('🎬 CAN PLAY THROUGH: Video fully buffered, guaranteed smooth playback');
    }
  };

  // Check if video is in cache and use it for faster loading + auto-start
  useEffect(() => {
    const cacheKey = `${item.id}-${language}`;
    const cachedVideo = videoCache.get(cacheKey);
    
    if (cachedVideo && videoRef.current) {
      console.log('🎬 USING CACHED VIDEO:', item.titleFr || item.titleEn);
      // Copy cached video properties to our video element
      videoRef.current.src = cachedVideo.src;
      videoRef.current.preload = 'auto';
      setVideoReady(true);
      
      // Auto-start video and show controls temporarily with error handling
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch((error) => {
            console.log('🎬 PLAY INTERRUPTED: Video element was removed during playback', error);
            // Silently handle play interruption - this is normal during component updates
          });
          setIsPlaying(true);
          showControlsTemporarily();
        }
      }, 100);
    }
  }, [item.id, language]);

  // Keyboard escape handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onVideoClick(); // Close the video
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onVideoClick]);

  const handleVideoLoadedData = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      setVideoLoaded(true);
      setIsPlaying(true);
      // Show controls briefly when video starts
      showControlsTemporarily();
      onVideoLoaded(item.id, video);
      console.log('🎬 LOADED DATA: Video data loaded');
    }
  };

  if (videoError || !proxyUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-gray-500 mb-4">
          {language === 'fr' ? 'Vidéo indisponible' : 'Video unavailable'}
        </div>
        <button 
          onClick={onVideoClick}
          className="px-6 py-2 bg-[#D67C4A] text-white rounded-lg hover:bg-[#c4703f] transition-colors"
        >
          {language === 'fr' ? 'Retour à la galerie' : 'Back to gallery'}
        </button>
      </div>
    );
  }

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent global click handler
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        setShowControls(true); // Keep controls visible when paused
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      } else {
        videoRef.current.play();
        setIsPlaying(true);
        showControlsTemporarily();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setVideoProgress(progress);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        setShowControls(true); // Keep controls visible when paused
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      } else {
        videoRef.current.play();
        setIsPlaying(true);
        showControlsTemporarily();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleRewind = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div 
        className="relative"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => {
          if (isPlaying) {
            showControlsTemporarily();
          }
        }}
        onMouseMove={() => {
          if (isPlaying) {
            showControlsTemporarily();
          }
        }}
      >
        <video
          ref={videoRef}
          src={proxyUrl}
          controls={false}
          muted={false}
          autoPlay
          preload="auto"
          onLoadedMetadata={handleVideoLoadedMetadata}
          onLoadedData={handleVideoLoadedData}
          onCanPlay={handleCanPlay}
          onCanPlayThrough={handleCanPlayThrough}
          onError={() => setVideoError(true)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onClick={handleVideoClick}
          style={{
            width: dimensions?.width || '50vw',
            height: dimensions?.height || '50vh',
            maxWidth: '80vw',
            maxHeight: '80vh',
            objectFit: 'contain',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
          className="shadow-lg"
        />
        
        {/* Complete video controls with progress bar, play/pause, mute, and rewind */}
        <div className={`absolute bottom-4 left-0 right-0 px-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          {/* Progress bar */}
          <div className="mb-4">
            <div className="w-full bg-gray-700 bg-opacity-50 rounded-full h-1">
              <div 
                className="bg-[#D67C4A] h-1 rounded-full transition-all duration-100" 
                style={{ width: `${videoProgress}%` }}
              ></div>
            </div>
          </div>
          
          {/* Control buttons */}
          <div className="flex items-center justify-center gap-4">
            {/* Rewind 10s */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRewind();
              }}
              data-video-control="true"
              className="text-white hover:text-[#D67C4A] transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414L2.586 8l3.707-3.707a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Play/Pause */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePlayPause();
              }}
              data-video-control="true"
              className="text-white hover:text-[#D67C4A] transition-colors duration-200"
            >
              {isPlaying ? (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* Mute/Unmute */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              data-video-control="true"
              className="text-white hover:text-[#D67C4A] transition-colors duration-200"
            >
              {isMuted ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.936 14H2a1 1 0 01-1-1V7a1 1 0 011-1h2.936l3.447-2.816a1 1 0 011-.108zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.936 14H2a1 1 0 01-1-1V7a1 1 0 011-1h2.936l3.447-2.816a1 1 0 011-.108zM12 5a1 1 0 011 1v8a1 1 0 11-2 0V6a1 1 0 011-1zm3 2a1 1 0 011 1v4a1 1 0 11-2 0V8a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {(videoLoaded && showControls && false) && (
          <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 rounded-lg px-4 py-2 transition-all duration-500 ${
            showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}>
            {/* Progress Bar */}
            <div className="flex items-center space-x-3 mb-2">
              <div className="flex-1 bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-[#D67C4A] h-2 rounded-full transition-all duration-200"
                  style={{ width: `${videoProgress}%` }}
                />
              </div>
            </div>
            
            {/* Control Buttons */}
            <div className="flex items-center space-x-4">
              {/* Rewind 10s */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRewind();
                }}
                data-video-control="true"
                className="text-white hover:text-[#D67C4A] transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 110 14H8a1 1 0 110-2h3a5 5 0 000-10H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Play/Pause */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayPause();
                }}
                data-video-control="true"
                className="text-white hover:text-[#D67C4A] transition-colors duration-200"
              >
                {isPlaying ? (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {/* Mute/Unmute */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                data-video-control="true"
                className="text-white hover:text-[#D67C4A] transition-colors duration-200"
              >
                {isMuted ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.936 14H2a1 1 0 01-1-1V7a1 1 0 011-1h2.936l3.447-2.816a1 1 0 011-.108zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.936 14H2a1 1 0 01-1-1V7a1 1 0 011-1h2.936l3.447-2.816a1 1 0 011-.108zM12 5a1 1 0 011 1v8a1 1 0 11-2 0V6a1 1 0 011-1zm3 2a1 1 0 011 1v4a1 1 0 11-2 0V8a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}
        

      </div>
    </div>
  );
};

// Global video cache to persist across component re-renders
const videoCache = new Map<string, HTMLVideoElement>();

export default function GallerySection() {
  const { legacyLanguage } = useLanguage();
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [flippedItems, setFlippedItems] = useState<Set<string>>(new Set());
  const [videoDimensions, setVideoDimensions] = useState<Record<string, {width: number, height: number, aspectRatio: number}>>({});
  const [preloadedVideos, setPreloadedVideos] = useState<Set<string>>(new Set());
  const sectionRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();



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

  // Intersection observer to preload videos when gallery is visible
  useEffect(() => {
    if (!sectionRef.current || activeItems.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && preloadedVideos.size === 0) {
            console.log('🎬 GALLERY VISIBLE: Starting video preload for all gallery videos');
            
            // Preload all gallery videos immediately when section becomes visible
            activeItems.forEach((item) => {
              const videoUrl = legacyLanguage === 'fr' ? item.videoUrlFr : item.videoUrlEn;
              const cacheKey = `${item.id}-${legacyLanguage}`;
              
              if (videoUrl && !videoCache.has(cacheKey)) {
                // Extract filename from full Supabase URL
                let filename = videoUrl.includes('/object/public/memopyk-gallery/') 
                  ? videoUrl.split('/object/public/memopyk-gallery/')[1]
                  : videoUrl;
                
                // Clean up extra slashes and decode any existing encoding
                filename = filename.replace(/^\/+/, ''); // Remove leading slashes
                filename = decodeURIComponent(filename); // Decode any existing encoding
                  
                const video = document.createElement('video');
                video.preload = 'auto'; // Immediate full preload for instant playback
                video.muted = false; // Start unmuted for better user experience
                video.src = `/api/video-proxy/memopyk-gallery/${encodeURIComponent(filename)}`;
                
                video.addEventListener('canplaythrough', () => {
                  console.log(`🎬 CACHED: ${item.titleFr || item.titleEn} permanently cached for instant replay`);
                  videoCache.set(cacheKey, video);
                  setPreloadedVideos(prev => new Set([...prev, item.id]));
                });

                // Add error handling for video loading
                video.addEventListener('error', (e) => {
                  console.log(`🎬 VIDEO ERROR: Failed to load ${item.titleFr || item.titleEn}`, e);
                });

                video.load();
              } else if (videoCache.has(cacheKey)) {
                // Video already cached
                setPreloadedVideos(prev => new Set([...prev, item.id]));
              }
            });
          }
        });
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, [activeItems, legacyLanguage, preloadedVideos]);

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
    console.log('🎬 PLAY BUTTON CLICKED:', itemId);
    console.log('🎬 Current playingVideo state:', playingVideo);
    console.log('🎬 Setting playing video state to:', itemId);
    
    const cacheKey = `${itemId}-${legacyLanguage}`;
    const cachedVideo = videoCache.get(cacheKey);
    
    if (cachedVideo) {
      console.log('🎬 INSTANT PLAY: Using cached video for immediate playback');
    } else {
      console.log('🎬 LOADING: Video not cached, will stream from server');
    }
    
    // Force the state update and check it immediately
    setPlayingVideo(prev => {
      console.log('🎬 setState callback - prev:', prev, 'new:', itemId);
      return itemId;
    });
    
    // Also force a re-render check
    setTimeout(() => {
      console.log('🎬 After setTimeout - state should be updated');
    }, 100);
  };

  const stopVideo = () => {
    setPlayingVideo(null);
  };

  // Global click handler to stop videos when clicking anywhere except play buttons and videos
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (!playingVideo) return;
      
      const target = e.target as HTMLElement;

      // Ignore clicks ONLY on gallery play buttons, the video element itself, and video controls
      if (target.closest('.play-button') || 
          target.tagName === 'VIDEO' || 
          target.closest('button[data-video-control]')) {
        return;
      }

      // Close video when clicking outside video area
      console.log('🎬 CLICKED OUTSIDE VIDEO AREA - STOPPING VIDEO');
      stopVideo();
    };

    // Only add the listener after a small delay to prevent immediate triggering
    if (playingVideo) {
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleGlobalClick, true);
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('click', handleGlobalClick, true);
      };
    }

    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, [playingVideo]);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (isLoading) {
    return (
      <section className="py-20 bg-[#F2EBDC]">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-[#011526] mb-8">
              {legacyLanguage === 'fr' ? 'Galerie' : 'Gallery'}
            </h2>
            <p className="text-[#8D9FA6]">
              {legacyLanguage === 'fr' ? 'Chargement...' : 'Loading...'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="py-20 bg-[#F2EBDC]">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-[#011526] mb-6">
            {legacyLanguage === 'fr' ? 'Notre Galerie' : 'Our Gallery'}
          </h2>
          <p className="text-xl text-[#2A4759] max-w-3xl mx-auto leading-relaxed">
            {legacyLanguage === 'fr'
              ? 'Découvrez nos créations vidéo exceptionnelles qui transforment vos moments précieux en souvenirs cinématographiques inoubliables.'
              : 'Discover our exceptional video creations that transform your precious moments into unforgettable cinematic memories.'
            }
          </p>
        </div>

        {/* Single Video Display - Replaces Gallery Section */}
        {playingVideo && (() => {
          const playingItem = activeItems.find(item => item.id === playingVideo);
          if (!playingItem) return null;

          return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] bg-[#F2EBDC]">
              <div className="w-full max-w-4xl mx-auto px-4">
                <SingleVideoContainer
                  item={playingItem}
                  language={legacyLanguage}
                  onVideoClick={stopVideo}
                  onVideoLoaded={handleVideoLoaded}
                />
              </div>
            </div>
          );
        })()}

        {/* Gallery Grid */}
        {!playingVideo && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {activeItems.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <p className="text-[#8D9FA6] text-lg">
                  {legacyLanguage === 'fr' ? 'Aucun élément de galerie disponible' : 'No gallery items available'}
                </p>
              </div>
            ) : (
              activeItems.map((item) => {
                // ONLY use static images - no fallbacks
                const staticImageUrl = legacyLanguage === 'fr' ? item.staticImageUrlFr : item.staticImageUrlEn;
                const videoUrl = legacyLanguage === 'fr' ? item.videoUrlFr : item.videoUrlEn;
                const hasVideo = !!videoUrl;

                return (
                  <div
                    key={item.id}
                    data-gallery-card
                    data-card-id={item.id}
                    className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 h-[520px] flex flex-col"
                  >
                    {/* Video/Image Container - Fixed 3:2 aspect ratio for high-quality display */}
                    <div className="relative bg-gray-100 overflow-hidden flex-shrink-0 aspect-[3/2]">
                      {staticImageUrl ? (
                        <div className="w-full h-full overflow-hidden perspective-1000">
                          <div className={`w-full h-full transition-transform duration-700 transform-style-preserve-3d ${flippedItems.has(item.id) ? 'rotate-y-180' : ''}`}>
                            {/* Front side - Static image with overlays */}
                            <div className="absolute inset-0 backface-hidden">
                              <img
                                src={(() => {
                                  // Extract filename from static image URL and create proxy URL
                                  if (staticImageUrl.includes('supabase.memopyk.org:8001/object/public/memopyk-gallery/')) {
                                    const filename = staticImageUrl.split('/object/public/memopyk-gallery/')[1];
                                    return `/api/image-proxy/memopyk-gallery/${filename}`;
                                  }
                                  // Direct URL if no proxy needed
                                  return staticImageUrl;
                                })()}
                                alt={legacyLanguage === 'fr' ? item.titleFr : item.titleEn}
                                className="w-full h-full object-cover"
                              />
                              
                              {/* Content Stats Overlay - Only visible on front side */}
                              <div className="absolute top-3 left-3 bg-gradient-to-r from-[#2A4759] to-[#011526] rounded-lg px-4 py-1.5 text-white shadow-lg z-10 opacity-60">
                                <div className="text-sm font-medium leading-tight">
                                  {legacyLanguage === 'fr' ? item.contentStatsFr : item.contentStatsEn}
                                </div>
                                <div className="text-xs text-gray-300 mt-0.5">
                                  {legacyLanguage === 'fr' ? 'fourni par le Client' : 'provided by Client'}
                                </div>
                              </div>

                              {/* Price Overlay - Only visible on front side */}
                              <div className="absolute bottom-3 right-3 bg-[#D67C4A] rounded-full px-4 py-0.5 text-white font-bold text-sm shadow-lg z-10">
                                {legacyLanguage === 'fr' ? item.priceFr : item.priceEn}
                              </div>

                              {/* Play Button Overlay - Only visible on front side */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (hasVideo) {
                                    // Play video if available
                                    handlePlayButtonClick(item.id);
                                  } else {
                                    // Trigger flip animation for items without video
                                    setFlippedItems(prev => {
                                      const newSet = new Set(prev);
                                      if (newSet.has(item.id)) {
                                        newSet.delete(item.id); // Flip back
                                      } else {
                                        newSet.add(item.id); // Flip to show message
                                      }
                                      return newSet;
                                    });
                                  }
                                }}
                                className="play-button absolute inset-0 flex items-center justify-center hover:bg-black/10 transition-all duration-300 group"
                              >
                                {hasVideo ? (
                                  /* Orange pulsing play button for videos */
                                  <div className="w-14 h-14 bg-gradient-to-br from-[#D67C4A] to-[#B8663D] rounded-full flex items-center justify-center transform group-hover:scale-110 transition-all duration-300 shadow-2xl border-2 border-white/20 animate-elegant-pulse hover:animate-none">
                                    <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                                  </div>
                                ) : (
                                  /* White non-pulsing play button for items without video */
                                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center transform group-hover:scale-110 transition-all duration-300 shadow-2xl border-2 border-gray-300">
                                    <Play className="w-5 h-5 text-gray-600 ml-0.5" fill="currentColor" />
                                  </div>
                                )}
                              </button>
                            </div>
                            
                            {/* Back side - Admin message (only show for items without video) */}
                            {!hasVideo && (
                              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-[#2A4759] to-[#011526] flex items-center justify-center p-6">
                                <div className="text-white text-center">
                                  <div className="text-lg font-medium mb-2">
                                    {legacyLanguage === 'fr' ? item.noVideoMessageFr || 'Vidéo disponible sur demande' : item.noVideoMessageEn || 'Video available on request'}
                                  </div>
                                  <div className="text-sm opacity-75">
                                    {legacyLanguage === 'fr' ? 'Cliquez pour revenir' : 'Click to go back'}
                                  </div>
                                </div>
                                
                                {/* Click anywhere on back side to flip back */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFlippedItems(prev => {
                                      const newSet = new Set(prev);
                                      newSet.delete(item.id);
                                      return newSet;
                                    });
                                  }}
                                  className="absolute inset-0 w-full h-full"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* White placeholder for missing videos with flip animation */
                        <div className="w-full h-full bg-white flex items-center justify-center group cursor-pointer relative perspective-1000"
                             onClick={() => {
                               const message = legacyLanguage === 'fr' ? item.noVideoMessageFr || 'Vidéo disponible sur demande' : item.noVideoMessageEn || 'Video available on request';
                               alert(message);
                             }}>
                          <div className="w-full h-full transition-transform duration-700 transform-style-preserve-3d group-hover:rotate-y-180">
                            {/* Front side - white with placeholder icon */}
                            <div className="absolute inset-0 backface-hidden bg-white flex items-center justify-center">
                              <div className="text-gray-400 text-center">
                                <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M14,6L10.25,11L13.1,14.8L11.5,16C9.81,13.75 7,10 7,10L1,18H23L14,6Z"/>
                                </svg>
                                <div className="text-sm">
                                  {legacyLanguage === 'fr' ? 'Cliquez pour info' : 'Click for info'}
                                </div>
                              </div>
                            </div>
                            {/* Back side - admin message */}
                            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-[#2A4759] to-[#011526] flex items-center justify-center p-4">
                              <div className="text-white text-center">
                                <div className="text-sm font-medium">
                                  {legacyLanguage === 'fr' ? item.noVideoMessageFr || 'Vidéo disponible sur demande' : item.noVideoMessageEn || 'Video available on request'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}


                    </div>

                    {/* Card Content - Move red box content down slightly */}
                    <div className="px-4 pt-2 pb-2 flex flex-col flex-1">
                      {/* Title - No outline, moved up more */}
                      <h3 className="text-lg font-bold text-[#011526] mb-0 overflow-hidden">
                        <span className="overflow-hidden block" 
                              style={{ 
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                lineHeight: '1.2'
                              }}>
                          {legacyLanguage === 'fr' ? item.titleFr : item.titleEn}
                        </span>
                      </h3>

                      {/* Duration - No outline, closer to title, same blue as bullet text */}
                      <div className="text-sm text-[#2A4759] mb-1.5 h-5">
                        {legacyLanguage === 'fr' ? item.durationFr : item.durationEn}
                      </div>

                      {/* Features - No outlines, same position and height, darker blue text, closer spacing */}
                      <div className="space-y-1 mb-4 flex-1">
                        {(legacyLanguage === 'fr' ? item.feature1Fr : item.feature1En) && (
                          <div className="flex items-start gap-2 text-sm text-[#2A4759] p-2" style={{ minHeight: '105px', height: '105px' }}>
                            <FileImage className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span className="overflow-hidden" 
                                  style={{ 
                                    display: '-webkit-box',
                                    WebkitLineClamp: 5,
                                    WebkitBoxOrient: 'vertical',
                                    lineHeight: '1.4'
                                  }}>
                              {legacyLanguage === 'fr' ? item.feature1Fr : item.feature1En}
                            </span>
                          </div>
                        )}
                        {(legacyLanguage === 'fr' ? item.feature2Fr : item.feature2En) && (
                          <div className="flex items-start gap-2 text-sm text-[#2A4759] p-2" style={{ minHeight: '105px', height: '105px' }}>
                            <Film className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span className="overflow-hidden" 
                                  style={{ 
                                    display: '-webkit-box',
                                    WebkitLineClamp: 5,
                                    WebkitBoxOrient: 'vertical',
                                    lineHeight: '1.4'
                                  }}>
                              {legacyLanguage === 'fr' ? item.feature2Fr : item.feature2En}
                            </span>
                          </div>
                        )}
                        {!(legacyLanguage === 'fr' ? item.feature1Fr : item.feature1En) && !(legacyLanguage === 'fr' ? item.feature2Fr : item.feature2En) && (
                          <div className="flex items-center justify-center text-sm text-[#8D9FA6] italic p-4" style={{ minHeight: '105px', height: '105px' }}>
                            {legacyLanguage === 'fr' ? 'Détails à venir...' : 'Details coming soon...'}
                          </div>
                        )}
                      </div>

                      {/* Bottom spacer */}
                      <div className="mt-auto"></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </section>
  );
}