import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/language-provider";

export interface GalleryItem {
  id: string;
  titleFr: string;
  titleEn: string;
  descriptionFr: string;
  descriptionEn: string;
  thumbnailUrl: string;
  videoUrlFr?: string;
  videoUrlEn?: string;
  price: string;
  duration: string;
  orderIndex: number;
  isActive: boolean;
}

const GallerySection = () => {
  const { language } = useLanguage();
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { data: galleryItems = [], isLoading } = useQuery({
    queryKey: ["/api/gallery-items"],
  });

  const handlePlayVideo = (itemId: string) => {
    setPlayingVideo(itemId);
  };

  const activeItems = galleryItems.filter((item: GalleryItem) => item.isActive);

  if (isLoading) {
    return (
      <section className="py-16 bg-[#F2EBDC]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#011526] mb-4">
              {language === 'fr' ? 'Nos Créations' : 'Our Creations'}
            </h2>
          </div>
          <div className="text-center">Loading gallery...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-[#F2EBDC]">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-[#011526] mb-4">
            {language === 'fr' ? 'Nos Créations' : 'Our Creations'}
          </h2>
          <p className="text-xl text-[#2A4759] max-w-3xl mx-auto">
            {language === 'fr' 
              ? 'Découvrez quelques-unes de nos réalisations et laissez-vous inspirer par la magie de MEMOPYK.' 
              : 'Discover some of our creations and let yourself be inspired by the magic of MEMOPYK.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activeItems.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-[#2A4759]">
                {language === 'fr' ? 'Aucun élément de galerie disponible' : 'No gallery items available'}
              </p>
            </div>
          ) : (
            activeItems.map((item: GalleryItem) => (
              <div 
                key={item.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                style={{ height: '550px' }}
              >
                {/* Video/Thumbnail Area */}
                <div className="relative h-64 overflow-hidden">
                  {playingVideo === item.id ? (
                    <video
                      ref={videoRef}
                      src={(language === 'fr' ? item.videoUrlFr : item.videoUrlEn)?.replace('http://supabase.memopyk.org:8001/object/public/', '/api/video-proxy/')}
                      className="w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                      onEnded={() => setPlayingVideo(null)}
                    />
                  ) : (
                    <>
                      <img
                        src={item.thumbnailUrl}
                        alt={language === 'fr' ? item.titleFr : item.titleEn}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                        <button
                          onClick={() => handlePlayVideo(item.id)}
                          className="bg-[#D67C4A] hover:bg-[#B86A3D] text-white p-4 rounded-full transition-all duration-300 transform hover:scale-110"
                        >
                          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-semibold text-[#011526] mb-2">
                    {language === 'fr' ? item.titleFr : item.titleEn}
                  </h3>
                  
                  <p className="text-[#8D9FA6] mb-4 flex-1">
                    {language === 'fr' ? item.descriptionFr : item.descriptionEn}
                  </p>
                  
                  <div className="flex justify-between items-center mt-auto">
                    <span className="text-sm text-[#2A4759]">{item.duration}</span>
                    <span className="text-xl font-bold text-[#D67C4A]">{item.price}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default GallerySection;