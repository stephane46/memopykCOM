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
import { Plus, Edit, Trash2, GripVertical, Image } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { GalleryItemData } from "@/lib/types";

export function GalleryManagement() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItemData | null>(null);
  const [formData, setFormData] = useState({
    titleEn: '',
    titleFr: '',
    descriptionEn: '',
    descriptionFr: '',
    videoUrl: '',
    imageUrlEn: '',
    imageUrlFr: '',
    priceEn: '',
    priceFr: '',
    orderIndex: 0,
    isActive: true
  });

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
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Élément mis à jour",
        description: "L'élément de galerie a été mis à jour avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/gallery-items'] });
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

  const resetForm = () => {
    setFormData({
      titleEn: '',
      titleFr: '',
      descriptionEn: '',
      descriptionFr: '',
      videoUrl: '',
      imageUrlEn: '',
      imageUrlFr: '',
      priceEn: '',
      priceFr: '',
      orderIndex: 0,
      isActive: true
    });
    setEditingItem(null);
    setShowForm(false);
  };

  const handleEdit = (item: GalleryItemData) => {
    setFormData({
      titleEn: item.titleEn,
      titleFr: item.titleFr,
      descriptionEn: item.descriptionEn || '',
      descriptionFr: item.descriptionFr || '',
      videoUrl: item.videoUrl || '',
      imageUrlEn: item.imageUrlEn || '',
      imageUrlFr: item.imageUrlFr || '',
      priceEn: item.priceEn || '',
      priceFr: item.priceFr || '',
      orderIndex: 0,
      isActive: item.isActive
    });
    setEditingItem(item);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createItemMutation.mutate(formData);
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
                    <Label htmlFor="descriptionFr">Description (Français)</Label>
                    <Textarea
                      id="descriptionFr"
                      value={formData.descriptionFr}
                      onChange={(e) => setFormData(prev => ({ ...prev, descriptionFr: e.target.value }))}
                      placeholder="Description en français"
                      rows={3}
                    />
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
                  </div>
                  <div>
                    <FileUpload
                      label="Ou uploader une image (Français)"
                      accept="image/*"
                      maxSize={10}
                      currentUrl={formData.imageUrlFr}
                      onUploadComplete={(url) => setFormData(prev => ({ ...prev, imageUrlFr: url }))}
                      disabled={createItemMutation.isPending || updateItemMutation.isPending}
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
                    <Label htmlFor="descriptionEn">Description (Anglais)</Label>
                    <Textarea
                      id="descriptionEn"
                      value={formData.descriptionEn}
                      onChange={(e) => setFormData(prev => ({ ...prev, descriptionEn: e.target.value }))}
                      placeholder="Description in English"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="imageUrlEn">URL Image (Anglais)</Label>
                    <Input
                      id="imageUrlEn"
                      type="url"
                      value={formData.imageUrlEn}
                      onChange={(e) => setFormData(prev => ({ ...prev, imageUrlEn: e.target.value }))}
                      placeholder="https://... ou utilisez l'upload ci-dessous"
                    />
                  </div>
                  <div>
                    <FileUpload
                      label="Ou uploader une image (Anglais)"
                      accept="image/*"
                      maxSize={10}
                      currentUrl={formData.imageUrlEn}
                      onUploadComplete={(url) => setFormData(prev => ({ ...prev, imageUrlEn: url }))}
                      disabled={createItemMutation.isPending || updateItemMutation.isPending}
                    />
                  </div>
                  <div>
                    <Label htmlFor="priceEn">Prix (Anglais)</Label>
                    <Input
                      id="priceEn"
                      value={formData.priceEn}
                      onChange={(e) => setFormData(prev => ({ ...prev, priceEn: e.target.value }))}
                      placeholder="€299"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="videoUrl">URL Vidéo (optionnel)</Label>
                  <Input
                    id="videoUrl"
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                    placeholder="https://... ou utilisez l'upload ci-dessous"
                  />
                </div>
                <div>
                  <FileUpload
                    label="Ou uploader un fichier vidéo"
                    accept="video/*"
                    maxSize={50}
                    currentUrl={formData.videoUrl}
                    onUploadComplete={(url) => setFormData(prev => ({ ...prev, videoUrl: url }))}
                    disabled={createItemMutation.isPending || updateItemMutation.isPending}
                  />
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
