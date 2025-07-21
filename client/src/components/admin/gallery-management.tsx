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
import { ImagePositionSelector } from "@/components/ui/image-position-selector";
import { Plus, Edit, Trash2, GripVertical, Image, ChevronUp, ChevronDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { GalleryItemData } from "@/lib/types";

export function GalleryManagement() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItemData | null>(null);
  const [formData, setFormData] = useState({
    titleEn: '',
    titleFr: '',

    videoUrlEn: '',
    videoUrlFr: '',
    videoWidthEn: '',
    videoHeightEn: '',
    videoOrientationEn: 'landscape', // 'landscape', 'portrait', 'square'
    videoWidthFr: '',
    videoHeightFr: '',
    videoOrientationFr: 'landscape',
    imageUrlEn: '',
    imageUrlFr: '',
    imagePositionEn: { x: 0, y: 0, scale: 1 },
    imagePositionFr: { x: 0, y: 0, scale: 1 },
    priceEn: '',
    priceFr: '',
    contentStatsEn: '',
    contentStatsFr: '',
    durationEn: '',
    durationFr: '',
    feature1En: '',
    feature1Fr: '',
    feature2En: '',
    feature2Fr: '',
    noVideoMessageEn: '',
    noVideoMessageFr: '',
    orderIndex: 0,
    isActive: true
  });

  const [useSameImage, setUseSameImage] = useState(true);
  const [useSameVideo, setUseSameVideo] = useState(true);

  const { toast } = useToast();
  const queryClient = useQueryClient();



  const { data: items = [], isLoading } = useQuery<GalleryItemData[]>({
    queryKey: ['/api/gallery-items'],
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('POST', '/api/gallery-items', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Élément ajouté",
        description: "L'élément de galerie a été ajouté avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/gallery-items'] });
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'élément",
        variant: "destructive",
      });
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const response = await apiRequest('PUT', `/api/gallery-items/${id}`, data);
      const result = await response.json();
      
      // Static image generation is now OPTIONAL - only triggered by the dedicated "Generate Static Image" button
      // This saves time and resources when making simple text/price updates
      
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Élément mis à jour",
        description: "L'élément de galerie a été mis à jour avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/gallery-items'] });
      // Also send message to homepage to refresh gallery
      window.postMessage({ type: 'GALLERY_UPDATED' }, '*');
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'élément",
        variant: "destructive",
      });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/gallery-items/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Élément supprimé",
        description: "L'élément de galerie a été supprimé avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/gallery-items'] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'élément",
        variant: "destructive",
      });
    }
  });

  const reorderItemMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: 'up' | 'down' }) => {
      const response = await apiRequest('PUT', `/api/gallery-items/${id}/reorder`, { direction });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gallery-items'] });
      // Notify homepage gallery of the update
      window.postMessage({ type: 'GALLERY_UPDATED' }, '*');
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de réorganiser l'élément",
        variant: "destructive",
      });
    }
  });

  const generateStaticImageMutation = useMutation({
    mutationFn: async ({ id, language, position, force }: { id: string; language: 'en' | 'fr'; position: { x: number; y: number; scale: number }; force?: boolean }) => {
      const response = await apiRequest('POST', `/api/gallery-items/${id}/generate-static-image`, { language, position, force });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Image statique générée",
        description: "L'image statique 600x400 a été générée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/gallery-items'] });
      window.postMessage({ type: 'GALLERY_UPDATED' }, '*');
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de générer l'image statique",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      titleEn: '',
      titleFr: '',
      videoUrlEn: '',
      videoUrlFr: '',
      videoWidthEn: '',
      videoHeightEn: '',
      videoOrientationEn: 'landscape',
      videoWidthFr: '',
      videoHeightFr: '',
      videoOrientationFr: 'landscape',
      imageUrlEn: '',
      imageUrlFr: '',
      imagePositionEn: { x: 0, y: 0, scale: 1 },
      imagePositionFr: { x: 0, y: 0, scale: 1 },
      priceEn: '',
      priceFr: '',
      contentStatsEn: '',
      contentStatsFr: '',
      durationEn: '',
      durationFr: '',
      feature1En: '',
      feature1Fr: '',
      feature2En: '',
      feature2Fr: '',
      noVideoMessageEn: '',
      noVideoMessageFr: '',
      orderIndex: 0,
      isActive: true
    });
    setUseSameImage(true);
    setUseSameVideo(true);
    setEditingItem(null);
    setShowForm(false);
  };

  const handleEdit = (item: GalleryItemData) => {
    setFormData({
      titleEn: item.titleEn,
      titleFr: item.titleFr,
      videoUrlEn: item.videoUrlEn || '',
      videoUrlFr: item.videoUrlFr || '',
      videoWidthEn: (item as any).videoWidthEn?.toString() || '',
      videoHeightEn: (item as any).videoHeightEn?.toString() || '',
      videoOrientationEn: (item as any).videoOrientationEn || 'landscape',
      videoWidthFr: (item as any).videoWidthFr?.toString() || '',
      videoHeightFr: (item as any).videoHeightFr?.toString() || '',
      videoOrientationFr: (item as any).videoOrientationFr || 'landscape',
      imageUrlEn: item.imageUrlEn || '',
      imageUrlFr: item.imageUrlFr || '',
      imagePositionEn: (item as any).imagePositionEn || { x: 0, y: 0, scale: 1 },
      imagePositionFr: (item as any).imagePositionFr || { x: 0, y: 0, scale: 1 },
      priceEn: item.priceEn || '',
      priceFr: item.priceFr || '',
      contentStatsEn: (item as any).contentStatsEn || '',
      contentStatsFr: (item as any).contentStatsFr || '',
      durationEn: (item as any).durationEn || '',
      durationFr: (item as any).durationFr || '',
      feature1En: (item as any).feature1En || '',
      feature1Fr: (item as any).feature1Fr || '',
      feature2En: (item as any).feature2En || '',
      feature2Fr: (item as any).feature2Fr || '',
      noVideoMessageEn: (item as any).noVideoMessageEn || '',
      noVideoMessageFr: (item as any).noVideoMessageFr || '',
      orderIndex: item.orderIndex,
      isActive: item.isActive
    });
    
    // Detect if same content is being used for both languages
    setUseSameImage((item.imageUrlEn || '') === (item.imageUrlFr || ''));
    setUseSameVideo((item.videoUrlEn || '') === (item.videoUrlFr || ''));
    
    setEditingItem(item);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert string values to proper types for the server
    const processedData = {
      ...formData,
      // Convert video dimensions from strings to numbers
      videoWidthEn: formData.videoWidthEn ? parseInt(formData.videoWidthEn) : null,
      videoHeightEn: formData.videoHeightEn ? parseInt(formData.videoHeightEn) : null,
      videoWidthFr: formData.videoWidthFr ? parseInt(formData.videoWidthFr) : null,
      videoHeightFr: formData.videoHeightFr ? parseInt(formData.videoHeightFr) : null,
      // Calculate aspect ratios
      videoAspectRatioEn: formData.videoWidthEn && formData.videoHeightEn ? 
        parseInt(formData.videoWidthEn) / parseInt(formData.videoHeightEn) : null,
      videoAspectRatioFr: formData.videoWidthFr && formData.videoHeightFr ? 
        parseInt(formData.videoWidthFr) / parseInt(formData.videoHeightFr) : null,
    };
    
    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data: processedData });
    } else {
      createItemMutation.mutate(processedData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
      deleteItemMutation.mutate(id);
    }
  };

  const toggleItemStatus = (item: GalleryItemData) => {
    updateItemMutation.mutate({
      id: item.id,
      data: { isActive: !item.isActive }
    });
  };

  const handleGenerateStaticImage = (language: 'en' | 'fr') => {
    if (!editingItem) {
      toast({
        title: "Erreur",
        description: "Aucun élément sélectionné pour générer l'image statique",
        variant: "destructive",
      });
      return;
    }
    
    const position = language === 'en' ? formData.imagePositionEn : formData.imagePositionFr;
    generateStaticImageMutation.mutate({
      id: editingItem.id,
      language,
      position,
      force: true  // Always force regeneration when button is clicked
    });
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-memopyk-navy">Gestion de la Galerie</h2>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-memopyk-highlight hover:bg-orange-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un élément
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingItem ? 'Modifier l\'élément' : 'Ajouter un nouvel élément'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Switches at the top in 2 rows */}
              <div className="bg-gradient-to-r from-memopyk-cream to-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="text-center mb-3">
                  <h3 className="text-lg font-semibold text-memopyk-navy">Options de partage</h3>
                  <p className="text-sm text-memopyk-blue">Utilisez le même contenu pour les deux langues</p>
                </div>
                
                {/* Row 1: Same Image Switch */}
                <div className="bg-white rounded-lg p-3 shadow-sm mb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="useSameImage" className="font-medium text-memopyk-navy">Même image</Label>
                      <p className="text-xs text-gray-500 mt-1">FR et EN identiques</p>
                    </div>
                    <Switch
                      id="useSameImage"
                      checked={useSameImage}
                      onCheckedChange={(checked) => {
                        setUseSameImage(checked);
                        if (checked && formData.imageUrlEn) {
                          setFormData(prev => ({ ...prev, imageUrlFr: prev.imageUrlEn }));
                        }
                      }}
                    />
                  </div>
                </div>
                
                {/* Row 2: Same Video Switch */}
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="useSameVideo" className="font-medium text-memopyk-navy">Même vidéo</Label>
                      <p className="text-xs text-gray-500 mt-1">FR et EN identiques</p>
                    </div>
                    <Switch
                      id="useSameVideo"
                      checked={useSameVideo}
                      onCheckedChange={(checked) => {
                        setUseSameVideo(checked);
                        if (checked && formData.videoUrlEn) {
                          setFormData(prev => ({ 
                            ...prev, 
                            videoUrlFr: prev.videoUrlEn,
                            // Also copy video dimensions when using same video
                            videoWidthFr: prev.videoWidthEn,
                            videoHeightFr: prev.videoHeightEn,
                            videoOrientationFr: prev.videoOrientationEn
                          }));
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Single column layout with collapsible sections */}
              <div className="space-y-6">
                
                {/* Basic Information Row */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold text-memopyk-navy">Informations de base</h3>
                  <div className="grid md:grid-cols-2 gap-4">
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
                      <Label htmlFor="titleFr">Titre (Français)</Label>
                      <Input
                        id="titleFr"
                        value={formData.titleFr}
                        onChange={(e) => setFormData(prev => ({ ...prev, titleFr: e.target.value }))}
                        placeholder="Titre en français"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="priceEn">Prix (Anglais)</Label>
                      <Input
                        id="priceEn"
                        value={formData.priceEn}
                        onChange={(e) => setFormData(prev => ({ ...prev, priceEn: e.target.value }))}
                        placeholder="$299"
                      />
                    </div>
                    <div>
                      <Label htmlFor="priceFr">Prix (Français)</Label>
                      <Input
                        id="priceFr"
                        value={formData.priceFr}
                        onChange={(e) => setFormData(prev => ({ ...prev, priceFr: e.target.value }))}
                        placeholder="€299"
                      />
                    </div>
                  </div>
                </div>

                {/* Content Stats Section - Red Boxes from User Image */}
                <div className="bg-orange-50 rounded-lg p-4 space-y-4 border border-orange-200">
                  <h3 className="font-semibold text-memopyk-navy">Statistiques de contenu</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contentStatsEn">Stats contenu (Anglais)</Label>
                      <Input
                        id="contentStatsEn"
                        value={formData.contentStatsEn}
                        onChange={(e) => setFormData(prev => ({ ...prev, contentStatsEn: e.target.value }))}
                        placeholder="80 videos & 10 photos provided by Client"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contentStatsFr">Stats contenu (Français)</Label>
                      <Input
                        id="contentStatsFr"
                        value={formData.contentStatsFr}
                        onChange={(e) => setFormData(prev => ({ ...prev, contentStatsFr: e.target.value }))}
                        placeholder="80 vidéos et 10 photos fournies par le Client"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="durationEn">Durée (Anglais)</Label>
                      <Input
                        id="durationEn"
                        value={formData.durationEn}
                        onChange={(e) => setFormData(prev => ({ ...prev, durationEn: e.target.value }))}
                        placeholder="2 minutes"
                      />
                    </div>
                    <div>
                      <Label htmlFor="durationFr">Durée (Français)</Label>
                      <Input
                        id="durationFr"
                        value={formData.durationFr}
                        onChange={(e) => setFormData(prev => ({ ...prev, durationFr: e.target.value }))}
                        placeholder="2 minutes"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="feature1En">Client wanted (Anglais)</Label>
                      <Input
                        id="feature1En"
                        value={formData.feature1En}
                        onChange={(e) => setFormData(prev => ({ ...prev, feature1En: e.target.value }))}
                        placeholder="Professional cinematography"
                      />
                    </div>
                    <div>
                      <Label htmlFor="feature1Fr">Client wanted (Français)</Label>
                      <Input
                        id="feature1Fr"
                        value={formData.feature1Fr}
                        onChange={(e) => setFormData(prev => ({ ...prev, feature1Fr: e.target.value }))}
                        placeholder="Cinématographie professionnelle"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="feature2En">Video Story (Anglais)</Label>
                      <Input
                        id="feature2En"
                        value={formData.feature2En}
                        onChange={(e) => setFormData(prev => ({ ...prev, feature2En: e.target.value }))}
                        placeholder="Personalized editing"
                      />
                    </div>
                    <div>
                      <Label htmlFor="feature2Fr">Video Story (Français)</Label>
                      <Input
                        id="feature2Fr"
                        value={formData.feature2Fr}
                        onChange={(e) => setFormData(prev => ({ ...prev, feature2Fr: e.target.value }))}
                        placeholder="Montage personnalisé"
                      />
                    </div>
                  </div>
                </div>

                {/* Images Row */}
                <div className="bg-blue-50 rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold text-memopyk-navy">Images</h3>
                  {useSameImage ? (
                    <div>
                      <Label htmlFor="imageUrlEn">URL Image (partagée)</Label>
                      <Input
                        id="imageUrlEn"
                        type="url"
                        value={formData.imageUrlEn}
                        onChange={(e) => setFormData(prev => ({ ...prev, imageUrlEn: e.target.value, imageUrlFr: e.target.value }))}
                        placeholder="https://... ou utilisez l'upload ci-dessous"
                      />
                      <div className="mt-3">
                        <FileUpload
                          label="Ou uploader une image (partagée pour les deux langues)"
                          accept="image/*"
                          maxSize={10000}
                          bucket="memopyk-gallery"
                          currentUrl={formData.imageUrlEn}
                          onUploadComplete={(url) => {
                            setFormData(prev => ({ ...prev, imageUrlEn: url, imageUrlFr: url }));
                          }}
                          disabled={createItemMutation.isPending || updateItemMutation.isPending}
                        />
                      </div>
                      
                      {/* Image Position Selector for shared image */}
                      {formData.imageUrlEn && (
                        <div className="mt-4 p-4 border border-[#D67C4A] rounded-lg bg-orange-50">
                          <ImagePositionSelector
                            imageUrl={formData.imageUrlEn.includes('supabase.memopyk.org:8001') 
                              ? `/api/image-proxy/memopyk-gallery/${formData.imageUrlEn.split('/').pop()}`
                              : formData.imageUrlEn}
                            initialPosition={formData.imagePositionEn}
                            onPositionChange={(position) => {
                              setFormData(prev => ({ 
                                ...prev, 
                                imagePositionEn: position,
                                imagePositionFr: position // Copy to French when using same image
                              }));
                            }}
                            onGenerateStatic={editingItem ? () => handleGenerateStaticImage('en') : undefined}
                            label="Position de l'image de couverture"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="imageUrlEn">URL Image (Anglais)</Label>
                        <Input
                          id="imageUrlEn"
                          type="url"
                          value={formData.imageUrlEn}
                          onChange={(e) => setFormData(prev => ({ ...prev, imageUrlEn: e.target.value }))}
                          placeholder="https://... ou utilisez l'upload ci-dessous"
                        />
                        <div className="mt-3">
                          <FileUpload
                            label="Ou uploader une image (Anglais)"
                            accept="image/*"
                            maxSize={10000}
                            bucket="memopyk-gallery"
                            currentUrl={formData.imageUrlEn}
                            onUploadComplete={(url) => {
                              setFormData(prev => ({ ...prev, imageUrlEn: url }));
                            }}
                            disabled={createItemMutation.isPending || updateItemMutation.isPending}
                          />
                        </div>
                        
                        {/* Image Position Selector for English */}
                        {formData.imageUrlEn && (
                          <div className="mt-4 p-4 border border-[#D67C4A] rounded-lg bg-orange-50">
                            <ImagePositionSelector
                              imageUrl={formData.imageUrlEn.includes('supabase.memopyk.org:8001') 
                                ? `/api/image-proxy/memopyk-gallery/${formData.imageUrlEn.split('/').pop()}`
                                : formData.imageUrlEn}
                              initialPosition={formData.imagePositionEn}
                              onPositionChange={(position) => {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  imagePositionEn: position
                                }));
                              }}
                              onGenerateStatic={editingItem ? () => handleGenerateStaticImage('en') : undefined}
                              label="Position de l'image (Anglais)"
                            />
                          </div>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="imageUrlFr">URL Image (Français)</Label>
                        <Input
                          id="imageUrlFr"
                          type="url"
                          value={formData.imageUrlFr}
                          onChange={(e) => setFormData(prev => ({ ...prev, imageUrlFr: e.target.value }))}
                          placeholder="https://... ou utilisez l'upload ci-dessous"
                        />
                        <div className="mt-3">
                          <FileUpload
                            label="Ou uploader une image (Français)"
                            accept="image/*"
                            maxSize={10000}
                            bucket="memopyk-gallery"
                            currentUrl={formData.imageUrlFr}
                            onUploadComplete={(url) => {
                              setFormData(prev => ({ ...prev, imageUrlFr: url }));
                            }}
                            disabled={createItemMutation.isPending || updateItemMutation.isPending}
                          />
                        </div>
                        
                        {/* Image Position Selector for French */}
                        {formData.imageUrlFr && (
                          <div className="mt-4 p-4 border border-[#D67C4A] rounded-lg bg-orange-50">
                            <ImagePositionSelector
                              imageUrl={formData.imageUrlFr.includes('supabase.memopyk.org:8001') 
                                ? `/api/image-proxy/memopyk-gallery/${formData.imageUrlFr.split('/').pop()}`
                                : formData.imageUrlFr}
                              initialPosition={formData.imagePositionFr}
                              onPositionChange={(position) => {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  imagePositionFr: position
                                }));
                              }}
                              onGenerateStatic={editingItem ? () => handleGenerateStaticImage('fr') : undefined}
                              label="Position de l'image (Français)"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Videos Row */}
                <div className="bg-green-50 rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold text-memopyk-navy">Vidéos</h3>
                  {useSameVideo ? (
                    <div>
                      <Label htmlFor="videoUrlEn">URL Vidéo (partagée)</Label>
                      <Input
                        id="videoUrlEn"
                        type="url"
                        value={formData.videoUrlEn}
                        onChange={(e) => setFormData(prev => ({ ...prev, videoUrlEn: e.target.value, videoUrlFr: e.target.value }))}
                        placeholder="https://... ou utilisez l'upload ci-dessous"
                      />
                      <div className="mt-3">
                        <FileUpload
                          label="Ou uploader une vidéo (partagée pour les deux langues)"
                          accept="video/*"
                          maxSize={10000}
                          bucket="memopyk-gallery"
                          currentUrl={formData.videoUrlEn}
                          onUploadComplete={(url) => {
                            setFormData(prev => ({ ...prev, videoUrlEn: url, videoUrlFr: url }));
                          }}
                          disabled={createItemMutation.isPending || updateItemMutation.isPending}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="videoUrlEn">URL Vidéo (Anglais)</Label>
                        <Input
                          id="videoUrlEn"
                          type="url"
                          value={formData.videoUrlEn}
                          onChange={(e) => setFormData(prev => ({ ...prev, videoUrlEn: e.target.value }))}
                          placeholder="https://... ou utilisez l'upload ci-dessous"
                        />
                        <div className="mt-3">
                          <FileUpload
                            label="Ou uploader une vidéo (Anglais)"
                            accept="video/*"
                            maxSize={10000}
                            bucket="memopyk-gallery"
                            currentUrl={formData.videoUrlEn}
                            onUploadComplete={(url) => {
                              setFormData(prev => ({ ...prev, videoUrlEn: url }));
                            }}
                            disabled={createItemMutation.isPending || updateItemMutation.isPending}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="videoUrlFr">URL Vidéo (Français)</Label>
                        <Input
                          id="videoUrlFr"
                          type="url"
                          value={formData.videoUrlFr}
                          onChange={(e) => setFormData(prev => ({ ...prev, videoUrlFr: e.target.value }))}
                          placeholder="https://... ou utilisez l'upload ci-dessous"
                        />
                        <div className="mt-3">
                          <FileUpload
                            label="Ou uploader une vidéo (Français)"
                            accept="video/*"
                            maxSize={10000}
                            bucket="memopyk-gallery"
                            currentUrl={formData.videoUrlFr}
                            onUploadComplete={(url) => {
                              setFormData(prev => ({ ...prev, videoUrlFr: url }));
                            }}
                            disabled={createItemMutation.isPending || updateItemMutation.isPending}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Video Dimensions Manual Input */}
                  {(formData.videoUrlEn || formData.videoUrlFr) && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-medium text-memopyk-navy mb-3">Dimensions vidéo</h4>
                      <p className="text-xs text-gray-600 mb-4">
                        Entrez les dimensions exactes pour optimiser l'affichage (ex: 1920x1080 pour landscape, 1080x1920 pour portrait)
                      </p>
                      
                      {formData.videoUrlEn && (
                        <div className="bg-gray-50 p-3 rounded mb-4">
                          {useSameVideo ? (
                            // Single dimension section when using same video
                            <div>
                              <h5 className="font-medium text-sm text-memopyk-navy mb-2">Dimensions vidéo</h5>
                              <p className="text-xs text-gray-600 mb-3">Entrez les dimensions exactes pour optimiser l'affichage (ex: 1920x1080 pour landscape, 1080x1920 pour portrait)</p>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <Label htmlFor="videoWidth" className="text-xs">Largeur (px)</Label>
                                  <Input
                                    id="videoWidth"
                                    type="number"
                                    placeholder="1920"
                                    value={formData.videoWidthEn}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setFormData(prev => ({ 
                                        ...prev, 
                                        videoWidthEn: value,
                                        videoWidthFr: value  // Copy to FR
                                      }));
                                    }}
                                    className="mt-1 text-xs"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="videoHeight" className="text-xs">Hauteur (px)</Label>
                                  <Input
                                    id="videoHeight"
                                    type="number"
                                    placeholder="1080"
                                    value={formData.videoHeightEn}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setFormData(prev => ({ 
                                        ...prev, 
                                        videoHeightEn: value,
                                        videoHeightFr: value  // Copy to FR
                                      }));
                                    }}
                                    className="mt-1 text-xs"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="videoOrientation" className="text-xs">Orientation</Label>
                                  <select
                                    id="videoOrientation"
                                    value={formData.videoOrientationEn}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setFormData(prev => ({ 
                                        ...prev, 
                                        videoOrientationEn: value,
                                        videoOrientationFr: value  // Copy to FR
                                      }));
                                    }}
                                    className="mt-1 text-xs w-full px-2 py-1 border border-gray-300 rounded"
                                  >
                                    <option value="landscape">Paysage (16:9)</option>
                                    <option value="portrait">Portrait (9:16)</option>
                                    <option value="square">Carré (1:1)</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          ) : (
                            // Separate EN dimension section when using different videos
                            <div>
                              <h5 className="font-medium text-sm text-memopyk-navy mb-2">Vidéo Anglais</h5>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <Label htmlFor="videoWidthEn" className="text-xs">Largeur (px)</Label>
                                  <Input
                                    id="videoWidthEn"
                                    type="number"
                                    placeholder="1920"
                                    value={formData.videoWidthEn}
                                    onChange={(e) => setFormData(prev => ({ ...prev, videoWidthEn: e.target.value }))}
                                    className="mt-1 text-xs"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="videoHeightEn" className="text-xs">Hauteur (px)</Label>
                                  <Input
                                    id="videoHeightEn"
                                    type="number"
                                    placeholder="1080"
                                    value={formData.videoHeightEn}
                                    onChange={(e) => setFormData(prev => ({ ...prev, videoHeightEn: e.target.value }))}
                                    className="mt-1 text-xs"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="videoOrientationEn" className="text-xs">Orientation</Label>
                                  <select
                                    id="videoOrientationEn"
                                    value={formData.videoOrientationEn}
                                    onChange={(e) => setFormData(prev => ({ ...prev, videoOrientationEn: e.target.value }))}
                                    className="mt-1 text-xs w-full px-2 py-1 border border-gray-300 rounded"
                                  >
                                    <option value="landscape">Paysage (16:9)</option>
                                    <option value="portrait">Portrait (9:16)</option>
                                    <option value="square">Carré (1:1)</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {formData.videoUrlFr && !useSameVideo && (
                        <div className="bg-gray-50 p-3 rounded">
                          <h5 className="font-medium text-sm text-memopyk-navy mb-2">Vidéo Français</h5>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label htmlFor="videoWidthFr" className="text-xs">Largeur (px)</Label>
                              <Input
                                id="videoWidthFr"
                                type="number"
                                placeholder="1920"
                                value={formData.videoWidthFr}
                                onChange={(e) => setFormData(prev => ({ ...prev, videoWidthFr: e.target.value }))}
                                className="mt-1 text-xs"
                              />
                            </div>
                            <div>
                              <Label htmlFor="videoHeightFr" className="text-xs">Hauteur (px)</Label>
                              <Input
                                id="videoHeightFr"
                                type="number"
                                placeholder="1080"
                                value={formData.videoHeightFr}
                                onChange={(e) => setFormData(prev => ({ ...prev, videoHeightFr: e.target.value }))}
                                className="mt-1 text-xs"
                              />
                            </div>
                            <div>
                              <Label htmlFor="videoOrientationFr" className="text-xs">Orientation</Label>
                              <select
                                id="videoOrientationFr"
                                value={formData.videoOrientationFr}
                                onChange={(e) => setFormData(prev => ({ ...prev, videoOrientationFr: e.target.value }))}
                                className="mt-1 text-xs w-full px-2 py-1 border border-gray-300 rounded"
                              >
                                <option value="landscape">Paysage (16:9)</option>
                                <option value="portrait">Portrait (9:16)</option>
                                <option value="square">Carré (1:1)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Fallback Messages Section */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">!</span>
                  </div>
                  <h3 className="font-semibold text-memopyk-navy">Messages de Fallback</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="noVideoMessageEn" className="text-sm font-medium text-memopyk-navy">
                      Message en anglais (quand vidéo non disponible)
                    </Label>
                    <Input
                      id="noVideoMessageEn"
                      type="text"
                      placeholder="Sorry, this video is available on request only"
                      value={formData.noVideoMessageEn || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, noVideoMessageEn: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="noVideoMessageFr" className="text-sm font-medium text-memopyk-navy">
                      Message en français (quand vidéo non disponible)
                    </Label>
                    <Input
                      id="noVideoMessageFr"
                      type="text"
                      placeholder="Désolé, cette vidéo est disponible sur demande uniquement"
                      value={formData.noVideoMessageFr || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, noVideoMessageFr: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label>Élément actif</Label>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  type="submit"
                  disabled={createItemMutation.isPending || updateItemMutation.isPending}
                >
                  {editingItem ? 'Mettre à jour' : 'Ajouter'}
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
        <h3 className="font-semibold text-memopyk-navy">Éléments existants</h3>
        
        {items.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-memopyk-blue">Aucun élément de galerie configuré</p>
            </CardContent>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.id} className={`${!item.isActive ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                    <div className="w-20 h-12 bg-gray-200 rounded flex items-center justify-center">
                      <Image className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-memopyk-navy">
                        {item.titleFr} / {item.titleEn}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {item.isActive ? 'Active' : 'Inactive'}
                        {item.priceEn && ` • ${item.priceEn}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex flex-col space-y-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => reorderItemMutation.mutate({ id: item.id, direction: 'up' })}
                        disabled={items.indexOf(item) === 0 || reorderItemMutation.isPending}
                        className="h-6 w-6 p-0"
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => reorderItemMutation.mutate({ id: item.id, direction: 'down' })}
                        disabled={items.indexOf(item) === items.length - 1 || reorderItemMutation.isPending}
                        className="h-6 w-6 p-0"
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={item.isActive}
                        onCheckedChange={() => toggleItemStatus(item)}
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
