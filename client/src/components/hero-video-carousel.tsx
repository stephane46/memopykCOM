import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HeroVideoData } from "@/lib/types";

export function HeroVideoCarousel() {
  const { language, t } = useLanguage();
  const [currentVideo, setCurrentVideo] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const { data: videos = [] } = useQuery<HeroVideoData[]>({
    queryKey: ['/api/hero-videos'],
  });

  const activeVideos = videos.filter(video => video.isActive);

  // Auto-advance videos every 8 seconds
  useEffect(() => {
    if (activeVideos.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentVideo(prev => (prev + 1) % activeVideos.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [activeVideos.length]);

  // Update video display when currentVideo changes
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentVideo) {
          video.currentTime = 0;
          video.play().catch(() => {}); // Ignore autoplay errors
        } else {
          video.pause();
        }
        video.muted = true; // Always muted
      }
    });
  }, [currentVideo]);

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
            <h1 className="font-playfair text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              {t('hero.title', { 
                fr: 'Transformez vos souvenirs\nen films cinématographiques', 
                en: 'Transform your memories\ninto cinematic films' 
              })}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200 font-light">
              {t('hero.subtitle', { 
                fr: 'Des monteurs professionnels créent votre film mémoire personnalisé en 2-3 semaines', 
                en: 'Professional editors create your personalized memory film in 2-3 weeks' 
              })}
            </p>
            <Button 
              size="lg"
              className="bg-memopyk-highlight hover:bg-orange-600 text-white font-semibold py-4 px-8 rounded-full text-lg transition-all transform hover:scale-105 shadow-lg"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('hero.cta', { fr: 'Commencer mon projet', en: 'Start my project' })}
            </Button>
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
              autoPlay={index === currentVideo}
              muted
              loop
              playsInline
              poster={`https://images.unsplash.com/photo-1511895426328-dc8714191300?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080`}
            >
              <source src={language === 'fr' ? video.urlFr : video.urlEn} type="video/mp4" />
            </video>
          </div>
        ))}
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="text-center text-white max-w-4xl mx-auto px-4">
          <h1 className="font-playfair text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            {activeVideos[currentVideo] && (
              language === 'fr' ? activeVideos[currentVideo].titleFr : activeVideos[currentVideo].titleEn
            )}
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200 font-light">
            {t('hero.subtitle', { 
              fr: 'Des monteurs professionnels créent votre film mémoire personnalisé en 2-3 semaines', 
              en: 'Professional editors create your personalized memory film in 2-3 weeks' 
            })}
          </p>
          <Button 
            size="lg"
            className="bg-memopyk-highlight hover:bg-orange-600 text-white font-semibold py-4 px-8 rounded-full text-lg transition-all transform hover:scale-105 shadow-lg"
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
          >
            {t('hero.cta', { fr: 'Commencer mon projet', en: 'Start my project' })}
          </Button>
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
