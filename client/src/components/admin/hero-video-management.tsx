import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { FileUpload } from "@/components/ui/file-upload";
import { Plus, Edit, Trash2, GripVertical, Play, ChevronUp, ChevronDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { HeroVideoData } from "@/lib/types";

export function HeroVideoManagement() {
  const [showForm, setShowForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<HeroVideoData | null>(null);
  const [useDifferentVideos, setUseDifferentVideos] = useState(false);
  const [analyzingVideo, setAnalyzingVideo] = useState(false);
  const [formData, setFormData] = useState({
    titleEn: '',
    titleFr: '',
    urlEn: '',
    urlFr: '',
    orderIndex: 0,
    isActive: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Function to analyze video dimensions
  const analyzeVideoDimensions = async (videoUrl: string, language: 'en' | 'fr') => {
    if (!videoUrl) return;

    setAnalyzingVideo(true);
    try {
      // Create a temporary video element to get dimensions
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';
      
      const dimensionPromise = new Promise<{ width: number; height: number; aspectRatio: number }>((resolve, reject) => {
        video.onloadedmetadata = () => {
          const width = video.videoWidth;
          const height = video.videoHeight;
          const aspectRatio = width / height;
          resolve({ width, height, aspectRatio });
        };
        
        video.onerror = () => {
          reject(new Error('Failed to load video metadata'));
        };
        
        // Timeout after 10 seconds
        setTimeout(() => {
          reject(new Error('Video analysis timeout'));
        }, 10000);
      });

      video.src = videoUrl;
      const dimensions = await dimensionPromise;

      // Cache the dimensions on the server
      await apiRequest('/api/video-dimensions', 'POST', {
        videoUrl,
        width: dimensions.width,
        height: dimensions.height,
        aspectRatio: dimensions.aspectRatio
      });

      toast({
        title: "Analyse réussie",
        description: `Vidéo ${language.toUpperCase()}: ${dimensions.width}x${dimensions.height} (ratio: ${dimensions.aspectRatio.toFixed(2)})`,
      });

      console.log(`📐 Analyzed hero video ${language}:`, dimensions);
    } catch (error) {
      console.error('Hero video analysis failed:', error);
      toast({
        title: "Erreur d'analyse",
        description: "Impossible d'analyser les dimensions de la vidéo. Vérifiez que l'URL est valide.",
        variant: "destructive",
      });
    } finally {
      setAnalyzingVideo(false);
    }
  };

  const { data: videos = [], isLoading } = useQuery<HeroVideoData[]>({
    queryKey: ['/api/hero-videos'],
  });

  const createVideoMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('POST', '/api/hero-videos', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Vidéo ajoutée",
        description: "La vidéo hero a été ajoutée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/hero-videos'] });
      // Notify other components (like homepage carousel) of the update
      window.postMessage({ type: 'HERO_VIDEOS_UPDATED' }, '*');
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la vidéo",
        variant: "destructive",
      });
    }
  });

  const updateVideoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const response = await apiRequest('PUT', `/api/hero-videos/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Vidéo mise à jour",
        description: "La vidéo hero a été mise à jour avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/hero-videos'] });
      // Notify other components (like homepage carousel) of the update
      window.postMessage({ type: 'HERO_VIDEOS_UPDATED' }, '*');
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la vidéo",
        variant: "destructive",
      });
    }
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/hero-videos/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Vidéo supprimée",
        description: "La vidéo hero a été supprimée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/hero-videos'] });
      // Notify other components (like homepage carousel) of the update
      window.postMessage({ type: 'HERO_VIDEOS_UPDATED' }, '*');
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la vidéo",
        variant: "destructive",
      });
    }
  });

  const reorderVideoMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: 'up' | 'down' }) => {
      const response = await apiRequest('PUT', `/api/hero-videos/${id}/reorder`, { direction });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hero-videos'] });
      // Notify other components (like homepage carousel) of the update
      window.postMessage({ type: 'HERO_VIDEOS_UPDATED' }, '*');
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de réorganiser la vidéo",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      titleEn: '',
      titleFr: '',
      urlEn: '',
      urlFr: '',
      orderIndex: 0,
      isActive: true
    });
    setUseDifferentVideos(false);
    setEditingVideo(null);
    setShowForm(false);
  };

  const handleEdit = (video: HeroVideoData) => {
    setFormData({
      titleEn: video.titleEn,
      titleFr: video.titleFr,
      urlEn: video.urlEn,
      urlFr: video.urlFr,
      orderIndex: video.orderIndex,
      isActive: video.isActive
    });
    setUseDifferentVideos(video.urlEn !== video.urlFr);
    setEditingVideo(video);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If not using different videos, use the French URL for both languages
    const finalData = {
      ...formData,
      urlEn: useDifferentVideos ? formData.urlEn : formData.urlFr
    };
    
    if (editingVideo) {
      updateVideoMutation.mutate({ id: editingVideo.id, data: finalData });
    } else {
      createVideoMutation.mutate(finalData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette vidéo ?')) {
      deleteVideoMutation.mutate(id);
    }
  };

  const toggleVideoStatus = (video: HeroVideoData) => {
    updateVideoMutation.mutate({
      id: video.id,
      data: { isActive: !video.isActive }
    });
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-memopyk-navy">Gestion des Vidéos Hero</h2>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-memopyk-highlight hover:bg-orange-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une vidéo
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingVideo ? 'Modifier la vidéo' : 'Ajouter une nouvelle vidéo'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-memopyk-navy">Version française</h3>
                  <div>
                    <Label htmlFor="titleFr">Titre (Français)</Label>
                    <Input
                      id="titleFr"
                      value={formData.titleFr}
                      onChange={(e) => setFormData(prev => ({ ...prev, titleFr: e.target.value }))}
                      placeholder="Titre en français"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="urlFr">URL Vidéo (Français)</Label>
                    <Input
                      id="urlFr"
                      type="url"
                      value={formData.urlFr}
                      onChange={(e) => setFormData(prev => ({ ...prev, urlFr: e.target.value }))}
                      placeholder="https://... ou utilisez l'upload ci-dessous"
                    />
                  </div>
                  <div>
                    <FileUpload
                      label="Ou uploader un fichier vidéo (Français)"
                      accept="video/*"
                      maxSize={10000}
                      currentUrl={formData.urlFr}
                      onUploadComplete={(url) => {
                        setFormData(prev => ({ 
                          ...prev, 
                          urlFr: url,
                          // Auto-sync to English if not using different videos
                          urlEn: useDifferentVideos ? prev.urlEn : url
                        }));
                      }}
                      disabled={createVideoMutation.isPending || updateVideoMutation.isPending}
                    />
                  </div>
                </div>
                
                {/* Checkbox for different videos */}
                <div className="col-span-full border-t pt-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="different-videos"
                      checked={useDifferentVideos}
                      onCheckedChange={(checked) => {
                        setUseDifferentVideos(checked);
                        // If unchecking, sync English to French
                        if (!checked) {
                          setFormData(prev => ({ ...prev, urlEn: prev.urlFr }));
                        }
                      }}
                    />
                    <Label htmlFor="different-videos" className="text-sm">
                      Utiliser des vidéos différentes pour chaque langue
                    </Label>
                  </div>
                </div>
                
                {useDifferentVideos && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-memopyk-navy">Version anglaise (séparée)</h3>
                    <div>
                      <Label htmlFor="titleEn">Titre (Anglais)</Label>
                      <Input
                        id="titleEn"
                        value={formData.titleEn}
                        onChange={(e) => setFormData(prev => ({ ...prev, titleEn: e.target.value }))}
                        placeholder="Title in English"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="urlEn">URL Vidéo (Anglais)</Label>
                      <Input
                        id="urlEn"
                        type="url"
                        value={formData.urlEn}
                        onChange={(e) => setFormData(prev => ({ ...prev, urlEn: e.target.value }))}
                        placeholder="https://... ou utilisez l'upload ci-dessous"
                      />
                    </div>
                    <div>
                      <FileUpload
                        label="Ou uploader un fichier vidéo (Anglais)"
                        accept="video/*"
                        maxSize={10000}
                        currentUrl={formData.urlEn}
                        onUploadComplete={(url) => setFormData(prev => ({ ...prev, urlEn: url }))}
                        disabled={createVideoMutation.isPending || updateVideoMutation.isPending}
                      />
                    </div>
                  </div>
                )}
                
                {!useDifferentVideos && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="titleEn">Titre (Anglais)</Label>
                      <Input
                        id="titleEn"
                        value={formData.titleEn}
                        onChange={(e) => setFormData(prev => ({ ...prev, titleEn: e.target.value }))}
                        placeholder="Title in English"
                        required
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      La même vidéo sera utilisée pour les deux langues
                    </p>
                  </div>
                )}
              </div>
              
              {/* Video Dimension Analysis */}
              {(formData.urlEn || formData.urlFr) && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-memopyk-navy mb-3">Analyse des dimensions vidéo</h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.urlFr && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => analyzeVideoDimensions(formData.urlFr, 'fr')}
                        disabled={analyzingVideo}
                        className="text-xs"
                      >
                        {analyzingVideo ? 'Analyse...' : 'Analyser vidéo FR'}
                      </Button>
                    )}
                    {formData.urlEn && formData.urlEn !== formData.urlFr && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => analyzeVideoDimensions(formData.urlEn, 'en')}
                        disabled={analyzingVideo}
                        className="text-xs"
                      >
                        {analyzingVideo ? 'Analyse...' : 'Analyser vidéo EN'}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Cliquez pour analyser et cacher les dimensions vidéo pour optimiser les performances d'affichage.
                  </p>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label>Vidéo active</Label>
                <p className="text-xs text-gray-500 ml-4">
                  Position sera gérée par glisser-déposer
                </p>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  type="submit"
                  disabled={createVideoMutation.isPending || updateVideoMutation.isPending}
                >
                  {editingVideo ? 'Mettre à jour' : 'Ajouter'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h3 className="font-semibold text-memopyk-navy">Vidéos existantes</h3>
        
        {videos.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-memopyk-blue">Aucune vidéo hero configurée</p>
            </CardContent>
          </Card>
        ) : (
          videos
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((video) => (
              <Card key={video.id} className={`${!video.isActive ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                      <div className="w-20 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <Play className="h-4 w-4 text-gray-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-memopyk-navy">
                          {video.titleFr} / {video.titleEn}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {video.isActive ? 'Active' : 'Inactive'} • Position {video.orderIndex}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* Reorder buttons */}
                      <div className="flex flex-col space-y-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => reorderVideoMutation.mutate({ id: video.id, direction: 'up' })}
                          disabled={video.orderIndex === 0 || reorderVideoMutation.isPending}
                          className="h-6 w-6 p-0"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => reorderVideoMutation.mutate({ id: video.id, direction: 'down' })}
                          disabled={video.orderIndex === videos.length - 1 || reorderVideoMutation.isPending}
                          className="h-6 w-6 p-0"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(video)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(video.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={video.isActive}
                          onCheckedChange={() => toggleVideoStatus(video)}
                        />
                        <span className="text-sm">Active</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </div>
  );
}
