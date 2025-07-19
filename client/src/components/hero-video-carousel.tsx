import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HeroVideoData } from "@/lib/types";

export default function HeroVideoCarousel() {
  const { language, t } = useLanguage();
  const [currentVideo, setCurrentVideo] = useState(0);

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const queryClient = useQueryClient();

  const { data: videos = [] } = useQuery<HeroVideoData[]>({
    queryKey: ['/api/hero-videos'],
    staleTime: 0,
  });

  const { data: heroText } = useQuery({
    queryKey: ['/api/hero-text-settings/active'],
    staleTime: 30000, // Cache for 30 seconds since text changes less frequently
  });

  // Listen for admin panel updates via window messages
  useEffect(() => {
    const handleStorageChange = () => {
      // Invalidate cache when localStorage changes (admin updates)
      queryClient.invalidateQueries({ queryKey: ['/api/hero-videos'] });
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'HERO_VIDEOS_UPDATED') {
        // Invalidate cache when admin panel sends update message
        queryClient.invalidateQueries({ queryKey: ['/api/hero-videos'] });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('message', handleMessage);
    };
  }, [queryClient]);

  const activeVideos = videos.filter(video => video.isActive);

  // Use real video URLs from database
  const isPreviewMode = false;

  // Debug logging
  useEffect(() => {
    console.log('🔍 Video data loaded:', videos);
    console.log('🎯 Active videos:', activeVideos);
    console.log('🌐 Current language:', language);
  }, [videos, activeVideos, language]);

  // Auto-advance videos every 8 seconds
  useEffect(() => {
    if (activeVideos.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentVideo(prev => (prev + 1) % activeVideos.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [activeVideos.length]);

  // Preload all videos for instant playback
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video && activeVideos[index]) {
        // Start buffering all videos immediately
        video.load();
        video.currentTime = 0;
        video.muted = true;
        console.log(`🎬 Preloading hero video ${index}:`, video.src);
      }
    });
  }, [activeVideos]);

  // Update video display when currentVideo changes
  useEffect(() => {
    console.log(`🎬 Video carousel: switching to video ${currentVideo} of ${activeVideos.length}`);
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentVideo) {
          console.log(`▶️ Playing video ${index}:`, video.src);
          video.currentTime = 0;
          video.muted = true; // Ensure muted before play
          
          // Wait for video to be ready before attempting to play
          const attemptPlay = async () => {
            try {
              console.log(`🎬 Attempting to play video ${index}, readyState: ${video.readyState}`);
              
              if (video.readyState >= 2) { // HAVE_CURRENT_DATA
                const playPromise = video.play();
                await playPromise;
                console.log(`✅ Video ${index} playing successfully`);
              } else {
                console.log(`⏳ Video ${index} not ready, waiting for loadeddata...`);
                // Wait for loadeddata event
                video.addEventListener('loadeddata', async () => {
                  try {
                    console.log(`📡 Video ${index} data loaded, attempting play...`);
                    const playPromise = video.play();
                    await playPromise;
                    console.log(`✅ Video ${index} playing after loadeddata`);
                  } catch (playError) {
                    console.error(`❌ Video play error for ${index} after loadeddata:`, playError);
                  }
                }, { once: true });
                
                // Also try after a short delay
                setTimeout(async () => {
                  try {
                    if (video.paused && index === currentVideo) {
                      console.log(`⏰ Retry play for video ${index} after timeout`);
                      const playPromise = video.play();
                      await playPromise;
                      console.log(`✅ Video ${index} playing after timeout`);
                    }
                  } catch (timeoutError) {
                    console.error(`❌ Video timeout play error for ${index}:`, timeoutError);
                  }
                }, 1000);
              }
            } catch (error) {
              console.error(`❌ Video play error for ${index}:`, error);
            }
          };
          
          attemptPlay();
        } else {
          video.pause();
        }
      }
    });
  }, [currentVideo, activeVideos]);

  const handleVideoClick = (index: number) => {
    setCurrentVideo(index);
  };

  const goToPrevious = () => {
    setCurrentVideo(prev => prev === 0 ? activeVideos.length - 1 : prev - 1);
  };

  const goToNext = () => {
    setCurrentVideo(prev => (prev + 1) % activeVideos.length);
  };

  if (activeVideos.length === 0) {
    return (
      <section id="accueil" className="relative h-screen overflow-hidden bg-memopyk-navy">
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center text-white max-w-4xl mx-auto px-4">
            <h1 className="font-playfair text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
              {heroText ? (language === 'fr' ? heroText.titleFr : heroText.titleEn) : 
                t('hero.title', { 
                  fr: 'Transformez vos souvenirs en films cinématographiques', 
                  en: 'Transform your memories into cinematic films' 
                })
              }
            </h1>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="accueil" className="relative h-screen overflow-hidden">
      {/* Video Container */}
      <div className="absolute inset-0">
        {activeVideos.map((video, index) => (
          <div 
            key={video.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentVideo ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <video 
              ref={el => videoRefs.current[index] = el}
              className="w-full h-full object-cover" 
              src={isPreviewMode ? demoVideos[index % demoVideos.length] : (language === 'fr' ? video.urlFr : video.urlEn)}
              autoPlay={index === currentVideo}
              muted
              loop
              playsInline
              preload="metadata"
              poster={video.fallbackImageUrl || `https://images.unsplash.com/photo-1511895426328-dc8714191300?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080`}
              onError={(e) => {
                const videoUrl = isPreviewMode ? demoVideos[index % demoVideos.length] : (language === 'fr' ? video.urlFr : video.urlEn);
                console.error('❌ Video load error for:', videoUrl, e);
              }}
              onLoadStart={() => {
                const videoUrl = isPreviewMode ? demoVideos[index % demoVideos.length] : (language === 'fr' ? video.urlFr : video.urlEn);
                console.log('📺 Video loading started:', videoUrl);
              }}
              onCanPlay={() => {
                const videoUrl = isPreviewMode ? demoVideos[index % demoVideos.length] : (language === 'fr' ? video.urlFr : video.urlEn);
                console.log('✅ Video can play:', videoUrl);
              }}
              onLoadedData={() => {
                const videoUrl = isPreviewMode ? demoVideos[index % demoVideos.length] : (language === 'fr' ? video.urlFr : video.urlEn);
                console.log('📹 Video data loaded:', videoUrl);
              }}
              onLoadedMetadata={() => {
                const videoUrl = isPreviewMode ? demoVideos[index % demoVideos.length] : (language === 'fr' ? video.urlFr : video.urlEn);
                console.log('📋 Hero metadata loaded:', videoUrl);
              }}
              onCanPlayThrough={() => {
                const videoUrl = isPreviewMode ? demoVideos[index % demoVideos.length] : (language === 'fr' ? video.urlFr : video.urlEn);
                console.log('🎬 Video ready to play through:', videoUrl);
                console.log('🚀 Hero video ready for instant playback:', videoUrl);
              }}
              onProgress={() => {
                const video = videoRefs.current[index];
                if (video && video.buffered.length > 0) {
                  const bufferedEnd = video.buffered.end(video.buffered.length - 1);
                  const duration = video.duration;
                  if (duration && bufferedEnd / duration > 0.1) { // 10% buffered
                    console.log('✅ Hero video buffered:', isPreviewMode ? demoVideos[index % demoVideos.length] : (language === 'fr' ? video.urlFr : video.urlEn));
                  }
                }
              }}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        ))}
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="text-center text-white max-w-4xl mx-auto px-4">
          <h1 className="font-playfair text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
            {heroText ? (language === 'fr' ? heroText.titleFr : heroText.titleEn) : 
              t('hero.title', { 
                fr: 'Transformez vos souvenirs en films cinématographiques', 
                en: 'Transform your memories into cinematic films' 
              })
            }
          </h1>
        </div>
      </div>
      
      {/* Navigation Arrows */}
      {activeVideos.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="lg"
            onClick={goToPrevious}
            className="absolute left-8 top-1/2 transform -translate-y-1/2 z-20 text-memopyk-highlight bg-black bg-opacity-30 hover:bg-opacity-50 hover:text-orange-400 rounded-full p-4 transition-all hover:scale-125 border-2 border-memopyk-highlight border-opacity-60"
          >
            <ChevronLeft className="h-16 w-16" />
          </Button>
          
          <Button
            variant="ghost"
            size="lg"
            onClick={goToNext}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 z-20 text-memopyk-highlight bg-black bg-opacity-30 hover:bg-opacity-50 hover:text-orange-400 rounded-full p-4 transition-all hover:scale-125 border-2 border-memopyk-highlight border-opacity-60"
          >
            <ChevronRight className="h-16 w-16" />
          </Button>
        </>
      )}

      {/* Navigation Dots - Centered */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex space-x-3">
          {activeVideos.map((_, index) => (
            <button
              key={index}
              onClick={() => handleVideoClick(index)}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                index === currentVideo 
                  ? 'bg-memopyk-highlight scale-110' 
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75 hover:scale-105'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
