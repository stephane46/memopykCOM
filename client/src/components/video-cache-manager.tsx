import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Download, HardDrive, Play, Trash2, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface CacheStatus {
  totalFiles: number;
  totalSizeMB: number;
  files: string[];
  cacheDirectory: string;
  status: string;
}

interface CacheResult {
  success: boolean;
  message: string;
  localPath?: string;
  existingFile?: boolean;
  error?: string;
}

interface BulkCacheResult {
  success: boolean;
  message: string;
  results: {
    heroVideos: { en: any[]; fr: any[] };
    galleryVideos: { en: any[]; fr: any[] };
    errors: string[];
  };
  cacheInfo: CacheStatus;
}

export function VideoCacheManager() {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const queryClient = useQueryClient();

  // Get cache status
  const { data: cacheStatus, isLoading: isLoadingStatus } = useQuery<CacheStatus>({
    queryKey: ["/api/cache/status"],
    refetchInterval: 5000 // Update every 5 seconds
  });

  // Get hero videos
  const { data: heroVideos = [] } = useQuery({
    queryKey: ["/api/hero-videos"]
  });

  // Get gallery items
  const { data: galleryItems = [] } = useQuery({
    queryKey: ["/api/gallery-items"]
  });

  // Cache individual video mutation
  const cacheVideoMutation = useMutation({
    mutationFn: async ({ type, id, language }: { type: 'hero' | 'gallery', id: string, language: string }) => {
      const endpoint = type === 'hero' ? '/api/cache/hero-video' : '/api/cache/gallery-video';
      return await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ id, language })
      }) as CacheResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cache/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hero-videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gallery-items"] });
    }
  });

  // Bulk cache all videos mutation
  const bulkCacheMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/cache/all-videos', {
        method: 'POST'
      }) as BulkCacheResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cache/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hero-videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gallery-items"] });
    }
  });

  const handleCacheVideo = (type: 'hero' | 'gallery', id: string, language: string) => {
    cacheVideoMutation.mutate({ type, id, language });
    setSelectedVideo(`${type}-${id}-${language}`);
  };

  const handleBulkCache = () => {
    bulkCacheMutation.mutate();
  };

  const getCacheStatusForVideo = (type: 'hero' | 'gallery', id: string, language: string): { cached: boolean; filename?: string } => {
    if (type === 'hero') {
      const video = heroVideos.find((v: any) => v.id === id);
      if (!video) return { cached: false };
      
      const cached = language === 'en' ? video.hasLocalCopyEn : video.hasLocalCopyFr;
      const filename = language === 'en' ? video.localFileEn : video.localFileFr;
      
      return { cached: !!cached, filename };
    } else {
      const item = galleryItems.find((v: any) => v.id === id);
      if (!item) return { cached: false };
      
      const cached = language === 'en' ? item.hasLocalVideoCopyEn : item.hasLocalVideoCopyFr;
      const filename = language === 'en' ? item.localVideoFileEn : item.localVideoFileFr;
      
      return { cached: !!cached, filename };
    }
  };

  const totalVideos = heroVideos.length * 2 + galleryItems.length * 2; // English + French for each
  const cachedVideos = [
    ...heroVideos.flatMap((v: any) => [
      v.hasLocalCopyEn ? 1 : 0,
      v.hasLocalCopyFr ? 1 : 0
    ]),
    ...galleryItems.flatMap((v: any) => [
      v.hasLocalVideoCopyEn ? 1 : 0,
      v.hasLocalVideoCopyFr ? 1 : 0
    ])
  ].reduce((sum, cached) => sum + cached, 0);

  const cachePercentage = totalVideos > 0 ? (cachedVideos / totalVideos) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Cache Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Video Cache Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingStatus ? (
            <div>Loading cache status...</div>
          ) : cacheStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{cacheStatus.totalFiles}</div>
                <div className="text-sm text-muted-foreground">Cached Files</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{cacheStatus.totalSizeMB}MB</div>
                <div className="text-sm text-muted-foreground">Cache Size</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{cachedVideos}/{totalVideos}</div>
                <div className="text-sm text-muted-foreground">Videos Cached</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{Math.round(cachePercentage)}%</div>
                <div className="text-sm text-muted-foreground">Cache Coverage</div>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Failed to load cache status</AlertDescription>
            </Alert>
          )}
          
          <Progress value={cachePercentage} className="w-full" />
          
          <div className="flex gap-2">
            <Button
              onClick={handleBulkCache}
              disabled={bulkCacheMutation.isPending}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {bulkCacheMutation.isPending ? "Caching All Videos..." : "Cache All Videos"}
            </Button>
            
            {cachePercentage === 100 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Deployment Ready
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Cache Results */}
      {bulkCacheMutation.data && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Cache Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>✅ Hero Videos EN: {bulkCacheMutation.data.results.heroVideos.en.length}</div>
              <div>✅ Hero Videos FR: {bulkCacheMutation.data.results.heroVideos.fr.length}</div>
              <div>✅ Gallery Videos EN: {bulkCacheMutation.data.results.galleryVideos.en.length}</div>
              <div>✅ Gallery Videos FR: {bulkCacheMutation.data.results.galleryVideos.fr.length}</div>
              {bulkCacheMutation.data.results.errors.length > 0 && (
                <div className="text-red-600">
                  ❌ Errors: {bulkCacheMutation.data.results.errors.length}
                  <details className="mt-2">
                    <summary>Show errors</summary>
                    <ul className="list-disc list-inside mt-1">
                      {bulkCacheMutation.data.results.errors.map((error, index) => (
                        <li key={index} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </details>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Video Caching */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hero Videos */}
        <Card>
          <CardHeader>
            <CardTitle>Hero Videos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {heroVideos.map((video: any) => (
              <div key={video.id} className="space-y-2">
                <div className="font-medium">{video.titleEn} / {video.titleFr}</div>
                <div className="grid grid-cols-2 gap-2">
                  {['en', 'fr'].map(lang => {
                    const cacheStatus = getCacheStatusForVideo('hero', video.id, lang);
                    const isLoading = cacheVideoMutation.isPending && selectedVideo === `hero-${video.id}-${lang}`;
                    
                    return (
                      <div key={lang} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{lang.toUpperCase()}</span>
                          {cacheStatus.cached ? (
                            <Badge variant="secondary">
                              <HardDrive className="h-3 w-3 mr-1" />
                              Cached
                            </Badge>
                          ) : (
                            <Badge variant="outline">Not Cached</Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant={cacheStatus.cached ? "outline" : "default"}
                          onClick={() => handleCacheVideo('hero', video.id, lang)}
                          disabled={isLoading}
                        >
                          {isLoading ? "Caching..." : cacheStatus.cached ? "Re-cache" : "Cache"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Gallery Videos */}
        <Card>
          <CardHeader>
            <CardTitle>Gallery Videos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {galleryItems.map((item: any) => (
              <div key={item.id} className="space-y-2">
                <div className="font-medium">{item.titleEn} / {item.titleFr}</div>
                <div className="grid grid-cols-2 gap-2">
                  {['en', 'fr'].map(lang => {
                    const cacheStatus = getCacheStatusForVideo('gallery', item.id, lang);
                    const isLoading = cacheVideoMutation.isPending && selectedVideo === `gallery-${item.id}-${lang}`;
                    
                    return (
                      <div key={lang} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{lang.toUpperCase()}</span>
                          {cacheStatus.cached ? (
                            <Badge variant="secondary">
                              <HardDrive className="h-3 w-3 mr-1" />
                              Cached
                            </Badge>
                          ) : (
                            <Badge variant="outline">Not Cached</Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant={cacheStatus.cached ? "outline" : "default"}
                          onClick={() => handleCacheVideo('gallery', item.id, lang)}
                          disabled={isLoading}
                        >
                          {isLoading ? "Caching..." : cacheStatus.cached ? "Re-cache" : "Cache"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Mutation Results */}
      {cacheVideoMutation.data && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {cacheVideoMutation.data.success 
              ? `✅ ${cacheVideoMutation.data.message}` 
              : `❌ ${cacheVideoMutation.data.error}`
            }
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}