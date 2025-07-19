import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { FileUpload } from "@/components/ui/file-upload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/hooks/use-language";
import { 
  Plus, Edit, Trash2, Play, ChevronUp, ChevronDown, 
  Type, Eye, Save, X 
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { HeroVideoData } from "@/lib/types";

interface HeroTextSetting {
  id: string;
  titleFr: string;
  titleEn: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function HeroManagement() {
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Video Management State
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<HeroVideoData | null>(null);
  const [useDifferentVideos, setUseDifferentVideos] = useState(false);
  const [videoFormData, setVideoFormData] = useState({
    titleEn: '',
    titleFr: '',
    urlEn: '',
    urlFr: '',
    orderIndex: 0,
    isActive: true
  });

  // Text Management State
  const [showTextForm, setShowTextForm] = useState(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textFormData, setTextFormData] = useState({
    titleFr: "",
    titleEn: "",
    fontSize: 60, // Default: text-6xl = 60px
    isActive: false
  });

  // Data Queries
  const { data: videos = [], isLoading: videosLoading } = useQuery<HeroVideoData[]>({
    queryKey: ['/api/hero-videos'],
  });

  const { data: heroTextSettings = [], isLoading: textsLoading } = useQuery<HeroTextSetting[]>({
    queryKey: ["/api/hero-text-settings"],
  });

  const { data: activeHeroText } = useQuery<HeroTextSetting>({
    queryKey: ["/api/hero-text-settings/active"],
  });

  // Video Mutations
  const createVideoMutation = useMutation({
    mutationFn: async (data: typeof videoFormData) => {
      const response = await apiRequest('POST', '/api/hero-videos', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: language === 'fr' ? "Succès" : "Success",
        description: language === 'fr' ? "Vidéo ajoutée avec succès" : "Video added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/hero-videos'] });
      window.postMessage({ type: 'HERO_VIDEOS_UPDATED' }, '*');
      resetVideoForm();
    },
    onError: () => {
      toast({
        title: language === 'fr' ? "Erreur" : "Error",
        description: language === 'fr' ? "Impossible d'ajouter la vidéo" : "Failed to add video",
        variant: "destructive",
      });
    }
  });

  const updateVideoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof videoFormData> }) => {
      const response = await apiRequest('PUT', `/api/hero-videos/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: language === 'fr' ? "Succès" : "Success",
        description: language === 'fr' ? "Vidéo mise à jour avec succès" : "Video updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/hero-videos'] });
      window.postMessage({ type: 'HERO_VIDEOS_UPDATED' }, '*');
      resetVideoForm();
    },
    onError: () => {
      toast({
        title: language === 'fr' ? "Erreur" : "Error",
        description: language === 'fr' ? "Impossible de mettre à jour la vidéo" : "Failed to update video",
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
        title: language === 'fr' ? "Succès" : "Success",
        description: language === 'fr' ? "Vidéo supprimée avec succès" : "Video deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/hero-videos'] });
      window.postMessage({ type: 'HERO_VIDEOS_UPDATED' }, '*');
    },
    onError: () => {
      toast({
        title: language === 'fr' ? "Erreur" : "Error",
        description: language === 'fr' ? "Impossible de supprimer la vidéo" : "Failed to delete video",
        variant: "destructive",
      });
    }
  });

  // Text Mutations
  const createTextMutation = useMutation({
    mutationFn: async (data: typeof textFormData) => {
      const response = await apiRequest('POST', '/api/hero-text-settings', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hero-text-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hero-text-settings/active"] });
      setShowTextForm(false);
      setTextFormData({ titleFr: "", titleEn: "", fontSize: 60, isActive: false });
      toast({
        title: language === 'fr' ? "Succès" : "Success",
        description: language === 'fr' ? "Texte héro créé avec succès" : "Hero text created successfully",
      });
    },
    onError: () => {
      toast({
        title: language === 'fr' ? "Erreur" : "Error",
        description: language === 'fr' ? "Échec de création du texte héro" : "Failed to create hero text",
        variant: "destructive",
      });
    },
  });

  const updateTextMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof textFormData> }) => {
      const response = await apiRequest('PUT', `/api/hero-text-settings/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hero-text-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hero-text-settings/active"] });
      setEditingTextId(null);
      setShowTextForm(false);
      setTextFormData({ titleFr: "", titleEn: "", fontSize: 60, isActive: false });
      toast({
        title: language === 'fr' ? "Succès" : "Success",
        description: language === 'fr' ? "Texte héro mis à jour avec succès" : "Hero text updated successfully",
      });
    },
    onError: () => {
      toast({
        title: language === 'fr' ? "Erreur" : "Error",
        description: language === 'fr' ? "Échec de mise à jour du texte héro" : "Failed to update hero text",
        variant: "destructive",
      });
    },
  });

  const deleteTextMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/hero-text-settings/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hero-text-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hero-text-settings/active"] });
      toast({
        title: language === 'fr' ? "Succès" : "Success",
        description: language === 'fr' ? "Texte héro supprimé avec succès" : "Hero text deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: language === 'fr' ? "Erreur" : "Error",
        description: language === 'fr' ? "Échec de suppression du texte héro" : "Failed to delete hero text",
        variant: "destructive",
      });
    },
  });

  // Helper Functions
  const resetVideoForm = () => {
    setShowVideoForm(false);
    setEditingVideo(null);
    setVideoFormData({
      titleEn: '',
      titleFr: '',
      urlEn: '',
      urlFr: '',
      orderIndex: 0,
      isActive: true
    });
    setUseDifferentVideos(false);
  };

  const handleVideoEdit = (video: HeroVideoData) => {
    setEditingVideo(video);
    setVideoFormData({
      titleEn: video.titleEn,
      titleFr: video.titleFr,
      urlEn: video.urlEn,
      urlFr: video.urlFr,
      orderIndex: video.orderIndex,
      isActive: video.isActive
    });
    setUseDifferentVideos(video.urlEn !== video.urlFr);
    setShowVideoForm(true);
  };

  const handleVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVideo) {
      updateVideoMutation.mutate({ id: editingVideo.id, data: videoFormData });
    } else {
      createVideoMutation.mutate(videoFormData);
    }
  };

  const moveVideo = (index: number, direction: 'up' | 'down') => {
    const sortedVideos = [...videos].sort((a, b) => a.orderIndex - b.orderIndex);
    const video = sortedVideos[index];
    
    if (!video) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sortedVideos.length) return;
    
    const targetVideo = sortedVideos[newIndex];
    
    // Swap order indices
    updateVideoMutation.mutate({ 
      id: video.id, 
      data: { orderIndex: targetVideo.orderIndex } 
    });
    updateVideoMutation.mutate({ 
      id: targetVideo.id, 
      data: { orderIndex: video.orderIndex } 
    });
  };

  const handleTextEdit = (setting: HeroTextSetting) => {
    setEditingTextId(setting.id);
    setTextFormData({
      titleFr: setting.titleFr,
      titleEn: setting.titleEn,
      fontSize: setting.fontSize || 60, // Default to 60px if not set
      isActive: setting.isActive
    });
    setShowTextForm(true);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTextId) {
      updateTextMutation.mutate({ id: editingTextId, data: textFormData });
    } else {
      createTextMutation.mutate(textFormData);
    }
  };

  const toggleTextActive = async (setting: HeroTextSetting) => {
    // First, deactivate all other settings if this one is being activated
    if (!setting.isActive) {
      for (const otherSetting of heroTextSettings) {
        if (otherSetting.isActive && otherSetting.id !== setting.id) {
          await updateTextMutation.mutateAsync({ 
            id: otherSetting.id, 
            data: { isActive: false } 
          });
        }
      }
    }
    
    // Then toggle the current setting
    updateTextMutation.mutate({ 
      id: setting.id, 
      data: { isActive: !setting.isActive } 
    });
  };

  const handleTextCancel = () => {
    setShowTextForm(false);
    setEditingTextId(null);
    setTextFormData({ titleFr: "", titleEn: "", fontSize: 60, isActive: false });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-memopyk-dark dark:text-white">
          {language === 'fr' ? "Gestion Hero" : "Hero Management"}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {language === 'fr' 
            ? "Gérez les vidéos et textes du carrousel hero" 
            : "Manage hero carousel videos and text"
          }
        </p>
      </div>

      <Tabs defaultValue="videos" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="videos" className="flex items-center space-x-2">
            <Play className="h-4 w-4" />
            <span>{language === 'fr' ? "Vidéos" : "Videos"}</span>
          </TabsTrigger>
          <TabsTrigger value="text" className="flex items-center space-x-2">
            <Type className="h-4 w-4" />
            <span>{language === 'fr' ? "Texte" : "Text"}</span>
          </TabsTrigger>
        </TabsList>

        {/* Videos Tab */}
        <TabsContent value="videos" className="space-y-6">
          {/* Add Video Button */}
          <div className="flex justify-end">
            <Button
              onClick={() => setShowVideoForm(true)}
              className="bg-memopyk-highlight hover:bg-orange-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              {language === 'fr' ? "Nouvelle Vidéo" : "New Video"}
            </Button>
          </div>

          {/* Video Form */}
          {showVideoForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-memopyk-dark dark:text-white">
                  {editingVideo 
                    ? (language === 'fr' ? "Modifier la Vidéo" : "Edit Video")
                    : (language === 'fr' ? "Nouvelle Vidéo Hero" : "New Hero Video")
                  }
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVideoSubmit} className="space-y-3">
                  {/* Compact title inputs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="titleFr" className="text-sm">{language === 'fr' ? "Titre FR" : "Title FR"}</Label>
                      <Input
                        id="titleFr"
                        value={videoFormData.titleFr}
                        onChange={(e) => setVideoFormData(prev => ({ ...prev, titleFr: e.target.value }))}
                        className="h-8"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="titleEn" className="text-sm">{language === 'fr' ? "Titre EN" : "Title EN"}</Label>
                      <Input
                        id="titleEn"
                        value={videoFormData.titleEn}
                        onChange={(e) => setVideoFormData(prev => ({ ...prev, titleEn: e.target.value }))}
                        className="h-8"
                        required
                      />
                    </div>
                  </div>

                  {/* Compact switch */}
                  <div className="flex items-center space-x-2 py-2">
                    <Switch
                      id="useDifferentVideos"
                      checked={useDifferentVideos}
                      onCheckedChange={setUseDifferentVideos}
                    />
                    <Label htmlFor="useDifferentVideos" className="text-sm">
                      {language === 'fr' ? "Vidéos différentes par langue" : "Different videos per language"}
                    </Label>
                  </div>

                  {useDifferentVideos ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>{language === 'fr' ? "Vidéo Française" : "French Video"}</Label>
                        {editingVideo && videoFormData.urlFr && (
                          <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                              {language === 'fr' ? "URL actuelle:" : "Current URL:"}
                            </p>
                            <p className="text-sm font-mono text-memopyk-navy dark:text-memopyk-highlight break-all">
                              {videoFormData.urlFr}
                            </p>
                          </div>
                        )}
                        <FileUpload
                          bucket="memopyk-hero"
                          accept="video/*"
                          onUpload={(url) => setVideoFormData(prev => ({ ...prev, urlFr: url }))}
                        />
                        {videoFormData.urlFr && !editingVideo && (
                          <p className="text-sm text-green-600 mt-1">
                            {language === 'fr' ? "Vidéo française téléchargée" : "French video uploaded"}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label>{language === 'fr' ? "Vidéo Anglaise" : "English Video"}</Label>
                        {editingVideo && videoFormData.urlEn && (
                          <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                              {language === 'fr' ? "URL actuelle:" : "Current URL:"}
                            </p>
                            <p className="text-sm font-mono text-memopyk-navy dark:text-memopyk-highlight break-all">
                              {videoFormData.urlEn}
                            </p>
                          </div>
                        )}
                        <FileUpload
                          bucket="memopyk-hero"
                          accept="video/*"
                          onUpload={(url) => setVideoFormData(prev => ({ ...prev, urlEn: url }))}
                        />
                        {videoFormData.urlEn && !editingVideo && (
                          <p className="text-sm text-green-600 mt-1">
                            {language === 'fr' ? "Vidéo anglaise téléchargée" : "English video uploaded"}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Label>{language === 'fr' ? "Vidéo (Les deux langues)" : "Video (Both Languages)"}</Label>
                      {editingVideo && videoFormData.urlFr && (
                        <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            {language === 'fr' ? "URL actuelle:" : "Current URL:"}
                          </p>
                          <p className="text-sm font-mono text-memopyk-navy dark:text-memopyk-highlight break-all">
                            {videoFormData.urlFr}
                          </p>
                        </div>
                      )}
                      <FileUpload
                        bucket="memopyk-hero"
                        accept="video/*"
                        onUpload={(url) => {
                          setVideoFormData(prev => ({ 
                            ...prev, 
                            urlFr: url, 
                            urlEn: url 
                          }));
                        }}
                      />
                      {videoFormData.urlFr && !editingVideo && (
                        <p className="text-sm text-green-600 mt-1">
                          {language === 'fr' ? "Vidéo téléchargée" : "Video uploaded"}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={videoFormData.isActive}
                      onCheckedChange={(checked) => setVideoFormData(prev => ({ ...prev, isActive: checked }))}
                    />
                    <Label htmlFor="isActive">
                      {language === 'fr' ? "Vidéo active" : "Active video"}
                    </Label>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button
                      type="submit"
                      disabled={createVideoMutation.isPending || updateVideoMutation.isPending}
                      className="bg-memopyk-highlight hover:bg-orange-600 text-white h-8 px-3 text-sm"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      {editingVideo 
                        ? (language === 'fr' ? "Mettre à jour" : "Update")
                        : (language === 'fr' ? "Créer" : "Create")
                      }
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={resetVideoForm}
                      className="h-8 px-3 text-sm"
                    >
                      <X className="h-3 w-3 mr-1" />
                      {language === 'fr' ? "Annuler" : "Cancel"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Videos List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-memopyk-dark dark:text-white">
                {language === 'fr' ? "Vidéos Hero" : "Hero Videos"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {videosLoading ? (
                <p className="text-gray-600 dark:text-gray-400">
                  {language === 'fr' ? "Chargement..." : "Loading..."}
                </p>
              ) : videos.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">
                  {language === 'fr' ? "Aucune vidéo trouvée" : "No videos found"}
                </p>
              ) : (
                <div className="space-y-4">
                  {[...videos].sort((a, b) => a.orderIndex - b.orderIndex).map((video, index) => (
                    <div
                      key={video.id}
                      className={`p-4 border rounded-lg ${
                        video.isActive 
                          ? 'border-memopyk-highlight bg-memopyk-highlight/5' 
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="px-2 py-1 text-xs bg-memopyk-navy text-white rounded-full">
                              #{video.orderIndex + 1}
                            </span>
                            {video.isActive && (
                              <span className="px-2 py-1 text-xs bg-memopyk-highlight text-white rounded-full">
                                {language === 'fr' ? "Actif" : "Active"}
                              </span>
                            )}
                          </div>
                          <h4 className="font-medium text-memopyk-dark dark:text-white">
                            FR: {video.titleFr}
                          </h4>
                          <h4 className="font-medium text-memopyk-dark dark:text-white">
                            EN: {video.titleEn}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono break-all">
                            {video.urlEn}
                          </p>
                        </div>
                        
                        {/* Video Preview Player */}
                        <div className="flex-shrink-0">
                          <div className="w-48 h-28 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden border">
                            <video
                              src={`${window.location.origin}${video.urlEn}`}
                              className="w-full h-full object-cover"
                              controls
                              muted
                              preload="metadata"
                              style={{ maxHeight: '112px' }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                            {language === 'fr' ? "Aperçu - Cliquez pour voir" : "Preview - Click to play"}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          {/* Order Controls */}
                          <div className="flex flex-col space-y-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => moveVideo(index, 'up')}
                              disabled={index === 0 || updateVideoMutation.isPending}
                              className="h-6 w-8 p-0"
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => moveVideo(index, 'down')}
                              disabled={index === videos.length - 1 || updateVideoMutation.isPending}
                              className="h-6 w-8 p-0"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVideoEdit(video)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteVideoMutation.mutate(video.id)}
                            disabled={deleteVideoMutation.isPending}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Text Tab */}
        <TabsContent value="text" className="space-y-6">
          {/* Current Active Text */}
          {activeHeroText && (
            <Card className="border-memopyk-highlight/20 bg-gradient-to-r from-memopyk-navy/5 to-memopyk-highlight/5">
              <CardHeader>
                <CardTitle className="flex items-center text-memopyk-dark dark:text-white">
                  <Eye className="h-5 w-5 mr-2 text-memopyk-highlight" />
                  {language === 'fr' ? "Texte Actuel" : "Current Text"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {language === 'fr' ? "Français:" : "French:"}
                    </p>
                    <p className="text-lg font-playfair text-memopyk-dark dark:text-white">
                      {activeHeroText.titleFr}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {language === 'fr' ? "Anglais:" : "English:"}
                    </p>
                    <p className="text-lg font-playfair text-memopyk-dark dark:text-white">
                      {activeHeroText.titleEn}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add Text Button */}
          <div className="flex justify-end">
            <Button
              onClick={() => setShowTextForm(true)}
              className="bg-memopyk-highlight hover:bg-orange-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              {language === 'fr' ? "Nouveau Texte" : "New Text"}
            </Button>
          </div>

          {/* Text Form */}
          {showTextForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-memopyk-dark dark:text-white">
                  {editingTextId 
                    ? (language === 'fr' ? "Modifier le Texte Hero" : "Edit Hero Text")
                    : (language === 'fr' ? "Nouveau Texte Hero" : "New Hero Text")
                  }
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTextSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="titleFr" className="text-memopyk-dark dark:text-white">
                        {language === 'fr' ? "Titre (Français)" : "Title (French)"}
                      </Label>
                      <Textarea
                        id="titleFr"
                        value={textFormData.titleFr}
                        onChange={(e) => setTextFormData(prev => ({ ...prev, titleFr: e.target.value }))}
                        placeholder={language === 'fr' ? "Entrez le titre en français..." : "Enter French title..."}
                        required
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="titleEn" className="text-memopyk-dark dark:text-white">
                        {language === 'fr' ? "Titre (Anglais)" : "Title (English)"}
                      </Label>
                      <Textarea
                        id="titleEn"
                        value={textFormData.titleEn}
                        onChange={(e) => setTextFormData(prev => ({ ...prev, titleEn: e.target.value }))}
                        placeholder={language === 'fr' ? "Entrez le titre en anglais..." : "Enter English title..."}
                        required
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Font Size Controls */}
                  <div>
                    <Label className="text-memopyk-dark dark:text-white mb-2 block">
                      {language === 'fr' ? "Taille de police" : "Font Size"} ({textFormData.fontSize}px)
                    </Label>
                    <div className="flex items-center space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setTextFormData(prev => ({ 
                          ...prev, 
                          fontSize: Math.max(20, prev.fontSize - 4) 
                        }))}
                        className="w-10 h-10 rounded-full"
                      >
                        -
                      </Button>
                      <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-center">
                        {textFormData.fontSize}px
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setTextFormData(prev => ({ 
                          ...prev, 
                          fontSize: Math.min(120, prev.fontSize + 4) 
                        }))}
                        className="w-10 h-10 rounded-full"
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={textFormData.isActive}
                      onCheckedChange={(checked) => setTextFormData(prev => ({ ...prev, isActive: checked }))}
                    />
                    <Label htmlFor="isActive" className="text-memopyk-dark dark:text-white">
                      {language === 'fr' ? "Activer ce texte" : "Activate this text"}
                    </Label>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      type="submit"
                      disabled={createTextMutation.isPending || updateTextMutation.isPending}
                      className="bg-memopyk-highlight hover:bg-orange-600 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {editingTextId 
                        ? (language === 'fr' ? "Mettre à jour" : "Update")
                        : (language === 'fr' ? "Créer" : "Create")
                      }
                    </Button>
                    <Button type="button" variant="outline" onClick={handleTextCancel}>
                      <X className="h-4 w-4 mr-2" />
                      {language === 'fr' ? "Annuler" : "Cancel"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Text Library */}
          <Card>
            <CardHeader>
              <CardTitle className="text-memopyk-dark dark:text-white">
                {language === 'fr' ? "Bibliothèque" : "Library"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {textsLoading ? (
                <p className="text-gray-600 dark:text-gray-400">
                  {language === 'fr' ? "Chargement..." : "Loading..."}
                </p>
              ) : heroTextSettings.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">
                  {language === 'fr' ? "Aucun texte trouvé" : "No texts found"}
                </p>
              ) : (
                <div className="space-y-4">
                  {heroTextSettings.map((setting) => (
                    <div
                      key={setting.id}
                      className={`p-4 border rounded-lg ${
                        setting.isActive 
                          ? 'border-memopyk-highlight bg-memopyk-highlight/5' 
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            {setting.isActive && (
                              <span className="px-2 py-1 text-xs bg-memopyk-highlight text-white rounded-full">
                                {language === 'fr' ? "Actif" : "Active"}
                              </span>
                            )}
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(setting.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium text-memopyk-dark dark:text-white">
                              <span className="text-sm text-gray-600 dark:text-gray-400">FR:</span> {setting.titleFr}
                            </p>
                            <p className="font-medium text-memopyk-dark dark:text-white">
                              <span className="text-sm text-gray-600 dark:text-gray-400">EN:</span> {setting.titleEn}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleTextActive(setting)}
                            disabled={updateTextMutation.isPending}
                          >
                            {setting.isActive 
                              ? (language === 'fr' ? "Désactiver" : "Deactivate")
                              : (language === 'fr' ? "Activer" : "Activate")
                            }
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTextEdit(setting)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteTextMutation.mutate(setting.id)}
                            disabled={deleteTextMutation.isPending}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}