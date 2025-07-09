import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { FileUpload } from "@/components/ui/file-upload";
import { Plus, Edit, Trash2, GripVertical, Play } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { HeroVideoData } from "@/lib/types";

export function HeroVideoManagement() {
  const [showForm, setShowForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<HeroVideoData | null>(null);
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
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la vidéo",
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
    setEditingVideo(video);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVideo) {
      updateVideoMutation.mutate({ id: editingVideo.id, data: formData });
    } else {
      createVideoMutation.mutate(formData);
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
                      maxSize={50}
                      currentUrl={formData.urlFr}
                      onUploadComplete={(url) => setFormData(prev => ({ ...prev, urlFr: url }))}
                      disabled={createVideoMutation.isPending || updateVideoMutation.isPending}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-memopyk-navy">Version anglaise</h3>
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
                      maxSize={50}
                      currentUrl={formData.urlEn}
                      onUploadComplete={(url) => setFormData(prev => ({ ...prev, urlEn: url }))}
                      disabled={createVideoMutation.isPending || updateVideoMutation.isPending}
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="orderIndex">Ordre d'affichage</Label>
                  <Input
                    id="orderIndex"
                    type="number"
                    value={formData.orderIndex}
                    onChange={(e) => setFormData(prev => ({ ...prev, orderIndex: parseInt(e.target.value) || 0 }))}
                    min="0"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label>Vidéo active</Label>
                </div>
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
