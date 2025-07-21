import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { useVideoElementTracking } from "@/hooks/useVideoAnalytics";
import type { HeroVideoData } from "@/lib/types";

export default function HeroVideoCarousel() {
  const { language } = useLanguage();
  const [currentVideo, setCurrentVideo] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { data: videos = [] } = useQuery<HeroVideoData[]>({
    queryKey: ['/api/hero-videos'],
    staleTime: 0,
  });

  const { data: heroText } = useQuery({
    queryKey: ['/api/hero-text-settings/active'],
    staleTime: 30000,
  });

  // Filter active videos based on language
  const activeVideos = videos.filter(video => video.isActive);
  const currentVideoData = activeVideos[currentVideo] || null;
  const currentUrl = currentVideoData && language === 'fr-FR' ? currentVideoData.urlFr : currentVideoData?.urlEn;

  // Extract video filename for analytics
  const heroVideoId = currentUrl ? (() => {
    let filename = currentUrl.includes('/object/public/memopyk-hero/') 
      ? currentUrl.split('/object/public/memopyk-hero/')[1]
      : currentUrl;
    filename = filename.replace(/^\/+/, '');
    filename = decodeURIComponent(filename);
    return filename;
  })() : `hero-video-${currentVideo}`;

  // Hero video analytics tracking
  const { isTracking } = useVideoElementTracking(
    videoRef,
    {
      videoId: heroVideoId,
      videoType: 'hero',
      videoTitle: `Hero Video ${currentVideo + 1}`
    },
    language === 'fr-FR' ? 'fr-FR' : 'en-US'
  );


  // Auto-advance carousel
  useEffect(() => {
    if (activeVideos.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentVideo((prev) => (prev + 1) % activeVideos.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [activeVideos.length]);

  if (activeVideos.length === 0) {
    return (
      <section className="relative min-h-[80vh] bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-4xl font-bold mb-4">MEMOPYK</h1>
          <p className="text-xl">Memory Film Service</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-[80vh] bg-gray-900 overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          key={currentUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="w-full h-full object-cover"
        >
          <source src={`/api/video-proxy/memopyk-hero/${currentUrl?.split('/').pop()}`} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-40 z-10"></div>
      </div>

      {/* Content Overlay */}
      <div className="relative z-20 flex flex-col items-center justify-center min-h-[80vh] text-white px-4">
        <div className="text-center max-w-4xl">
          <h1 
            className="font-playfair font-bold mb-6 tracking-wide"
            style={{ fontSize: `${heroText?.fontSize || 60}px` }}
          >
            {language === 'fr-FR' ? heroText?.titleFr : heroText?.titleEn}
          </h1>
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex space-x-3">
          {activeVideos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentVideo(index)}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                index === currentVideo 
                  ? 'bg-orange-500 scale-110' 
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75 hover:scale-105'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}