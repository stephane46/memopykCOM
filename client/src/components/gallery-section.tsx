import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { Play, Pause, Volume2, VolumeX, Maximize, FileImage, Film } from 'lucide-react';

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

export default function GallerySection() {
  const { language } = useLanguage();
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [fullHeightVideoId, setFullHeightVideoId] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState<{ [key: string]: number }>({});
  const videoRef = useRef<HTMLVideoElement>(null);
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

  // Force immediate cache clear and refetch
  useEffect(() => {
    queryClient.clear(); // Clear ALL cache
    queryClient.removeQueries({ queryKey: ['/api/gallery-items'] });
    queryClient.invalidateQueries({ queryKey: ['/api/gallery-items'] });
  }, [queryClient]);

  const { data: items = [], isLoading } = useQuery<GalleryItem[]>({
    queryKey: ['/api/gallery-items'],
    staleTime: 0, // Force fresh data
    cacheTime: 0, // Don't cache results
    refetchOnMount: true, // Always refetch on mount
    refetchOnWindowFocus: true, // Refetch on window focus
  });

  // Debug: Log the received data
  useEffect(() => {
    if (items.length > 0) {
      console.log('📊 Gallery items received:', items);
      const pomItem = items.find(item => item.id === '1752256273545');
      if (pomItem) {
        console.log('🐕 Pom item data:', {
          id: pomItem.id,
          titleFr: pomItem.titleFr,
          staticImageUrlFr: pomItem.staticImageUrlFr,
          staticImageUrlEn: pomItem.staticImageUrlEn,
          imageUrlFr: pomItem.imageUrlFr,
          imageUrlEn: pomItem.imageUrlEn
        });
        
        // Force static image if available
        if (pomItem.staticImageUrlFr) {
          console.log('🟢 STATIC IMAGE DETECTED - Should use:', pomItem.staticImageUrlFr);
        } else {
          console.log('🔴 NO STATIC IMAGE - Missing staticImageUrlFr field');
        }
      }
    }
  }, [items]);

  const activeItems = items.filter(item => item.isActive).slice(0, 6);

  // Reset video state when changing videos
  const resetVideoState = () => {
    setIsPaused(false);
    setIsMuted(true);
    setShowControls(false);
    setFullHeightVideoId(null);
    setVideoProgress({});
  };

  const handlePlayButtonClick = (itemId: string) => {
    if (playingVideo !== itemId) {
      resetVideoState();
      setPlayingVideo(itemId);
      setFullHeightVideoId(itemId); // Enable full height mode when playing
    }
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.play();
        setIsPaused(false);
      } else {
        videoRef.current.pause();
        setIsPaused(true);
      }
      setShowControls(true);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.requestFullscreen();
    }
  };

  const stopVideo = () => {
    setPlayingVideo(null);
    resetVideoState();
  };

  // Handle video progress tracking
  const handleVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>, itemId: string) => {
    const video = e.currentTarget;
    const progress = (video.currentTime / video.duration) * 100;
    setVideoProgress(prev => ({ ...prev, [itemId]: progress }));
  };

  // Handle video end
  const handleVideoEnd = (itemId: string) => {
    setPlayingVideo(null);
    setFullHeightVideoId(null);
    setVideoProgress(prev => ({ ...prev, [itemId]: 0 }));
    setIsPaused(false);
    setShowControls(false);
  };

  // Global click listener to stop video when clicking anywhere except video controls
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (playingVideo) {
        const target = e.target as Element;
        const clickedOnVideo = target.closest('video');
        const clickedOnControls = target.closest('[data-video-controls]');
        const clickedOnPlayButton = target.closest('.play-button');
        
        // Stop video unless clicking on video controls, play button, or the video itself
        if (!clickedOnVideo && !clickedOnControls && !clickedOnPlayButton) {
          console.log('🛑 Stopping video due to click outside video elements');
          stopVideo();
        }
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
              {language === 'fr' ? 'Galerie' : 'Gallery'}
            </h2>
            <p className="text-[#8D9FA6]">
              {language === 'fr' ? 'Chargement...' : 'Loading...'}
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
            {language === 'fr' ? 'Notre Galerie' : 'Our Gallery'}
          </h2>
          <p className="text-xl text-[#2A4759] max-w-3xl mx-auto leading-relaxed">
            {language === 'fr' 
              ? 'Découvrez nos créations vidéo exceptionnelles qui transforment vos moments précieux en souvenirs cinématographiques inoubliables.'
              : 'Discover our exceptional video creations that transform your precious moments into unforgettable cinematic memories.'
            }
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {activeItems.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-[#2A4759]">
                {language === 'fr' ? 'Aucun élément de galerie disponible' : 'No gallery items available'}
              </p>
            </div>
          ) : (
            activeItems.map((item) => (
              <div 
                key={item.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                style={{ height: '550px' }}
              >
                {/* Thumbnail/Video Area */}
                <div className="relative bg-gray-100" style={{ height: '250px' }}>
                  {playingVideo === item.id && (language === 'fr' ? item.videoUrlFr : item.videoUrlEn) ? (
                    <div className="relative w-full h-full">
                      <video 
                        ref={videoRef}
                        src={(() => {
                          const originalUrl = language === 'fr' ? item.videoUrlFr : item.videoUrlEn;
                          return originalUrl?.replace('http://supabase.memopyk.org:8001/object/public/', '/api/video-proxy/');
                        })()}
                        autoPlay
                        muted={isMuted}
                        playsInline
                        loop
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={handleVideoClick}
                        onEnded={() => setPlayingVideo(null)}
                      />
                      
                      {/* Video Controls */}
                      {showControls && (
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-black/60 p-3 flex items-center justify-between"
                          data-video-controls
                        >
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVideoClick(e);
                              }}
                              className="text-white hover:text-[#D67C4A] transition-colors"
                            >
                              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                            </button>
                            
                            <button
                              onClick={toggleMute}
                              className="text-white hover:text-[#D67C4A] transition-colors"
                            >
                              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                            </button>
                          </div>
                          
                          <button
                            onClick={handleExpand}
                            className="text-white hover:text-[#D67C4A] transition-colors"
                          >
                            <Maximize className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Display static image (preferred) or regular image or gradient background */}
                      {(() => {
                        // Enhanced debug logging
                        console.log(`🔍 Processing item ${item.id} (${item.titleFr})`);
                        console.log(`   Language: ${language}`);
                        console.log(`   staticImageUrlFr: ${item.staticImageUrlFr}`);
                        console.log(`   staticImageUrlEn: ${item.staticImageUrlEn}`);
                        console.log(`   imageUrlFr: ${item.imageUrlFr}`);
                        console.log(`   imageUrlEn: ${item.imageUrlEn}`);
                        
                        // Simple static image logic
                        const staticImageUrl = language === 'fr' ? item.staticImageUrlFr : item.staticImageUrlEn;
                        const regularImageUrl = language === 'fr' ? item.imageUrlFr : item.imageUrlEn;
                        
                        console.log(`   Selected static URL: ${staticImageUrl}`);
                        console.log(`   Selected regular URL: ${regularImageUrl}`);
                        
                        // Use static image if available, otherwise use regular image
                        const imageUrl = staticImageUrl || regularImageUrl;
                        
                        console.log(`   Final image URL: ${imageUrl}`);
                        console.log(`   Is static image? ${imageUrl?.includes('static_image_')}`);
                        
                        if (imageUrl) {
                          const proxiedImageUrl = imageUrl.replace('http://supabase.memopyk.org:8001/object/public/', '/api/image-proxy/');
                          const isStaticImage = imageUrl.includes('static_image_');
                          
                          console.log(`   Proxied URL: ${proxiedImageUrl}`);
                          console.log(`   Will show STATIC badge: ${isStaticImage}`);
                          
                          return (
                            <div className="relative w-full h-full">
                              <img 
                                src={proxiedImageUrl}
                                alt={language === 'fr' ? item.titleFr : item.titleEn}
                                className="w-full h-full object-cover"
                              />
                              {isStaticImage && (
                                <div className="absolute top-1 right-1 bg-green-500 text-white px-2 py-1 text-xs rounded">
                                  STATIC
                                </div>
                              )}
                            </div>
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
                          <div 
                            className="play-button w-16 h-16 bg-[#D67C4A]/90 rounded-full flex items-center justify-center shadow-lg hover:bg-[#D67C4A] transition-all duration-300 cursor-pointer animate-pulse-elegant"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayButtonClick(item.id);
                            }}
                          >
                            <Play className="w-8 h-8 ml-1 text-white" fill="currentColor" />
                          </div>
                        </div>
                      )}
                    </>
                  )}

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
            ))
          )}
        </div>
      </div>
    </section>
  );
}