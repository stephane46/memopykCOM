import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/hooks/use-language";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Save, Plus, Eye, Edit2, Trash2 } from "lucide-react";

interface HeroTextSetting {
  id: string;
  titleFr: string;
  titleEn: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function HeroTextManagement() {
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    titleFr: "",
    titleEn: "",
    isActive: false
  });

  const { data: heroTextSettings = [], isLoading } = useQuery<HeroTextSetting[]>({
    queryKey: ["/api/hero-text-settings"],
  });

  const { data: activeHeroText } = useQuery<HeroTextSetting>({
    queryKey: ["/api/hero-text-settings/active"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await apiRequest("/api/hero-text-settings", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hero-text-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hero-text-settings/active"] });
      setShowForm(false);
      setFormData({ titleFr: "", titleEn: "", isActive: false });
      toast({
        title: language === 'fr' ? "Succès" : "Success",
        description: language === 'fr' ? "Texte héro créé avec succès" : "Hero text created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: language === 'fr' ? "Erreur" : "Error",
        description: language === 'fr' ? "Échec de création du texte héro" : "Failed to create hero text",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      await apiRequest(`/api/hero-text-settings/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hero-text-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hero-text-settings/active"] });
      setEditingId(null);
      setShowForm(false);
      setFormData({ titleFr: "", titleEn: "", isActive: false });
      toast({
        title: language === 'fr' ? "Succès" : "Success",
        description: language === 'fr' ? "Texte héro mis à jour avec succès" : "Hero text updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: language === 'fr' ? "Erreur" : "Error",
        description: language === 'fr' ? "Échec de mise à jour du texte héro" : "Failed to update hero text",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/hero-text-settings/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hero-text-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hero-text-settings/active"] });
      toast({
        title: language === 'fr' ? "Succès" : "Success",
        description: language === 'fr' ? "Texte héro supprimé avec succès" : "Hero text deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: language === 'fr' ? "Erreur" : "Error",
        description: language === 'fr' ? "Échec de suppression du texte héro" : "Failed to delete hero text",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (setting: HeroTextSetting) => {
    setEditingId(setting.id);
    setFormData({
      titleFr: setting.titleFr,
      titleEn: setting.titleEn,
      isActive: setting.isActive
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ titleFr: "", titleEn: "", isActive: false });
  };

  const toggleActive = async (setting: HeroTextSetting) => {
    // First, deactivate all other settings if this one is being activated
    if (!setting.isActive) {
      for (const otherSetting of heroTextSettings) {
        if (otherSetting.isActive && otherSetting.id !== setting.id) {
          await updateMutation.mutateAsync({ 
            id: otherSetting.id, 
            data: { isActive: false } 
          });
        }
      }
    }
    
    // Then toggle the current setting
    updateMutation.mutate({ 
      id: setting.id, 
      data: { isActive: !setting.isActive } 
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-memopyk-dark dark:text-white">
            {language === 'fr' ? "Gestion du Texte Héro" : "Hero Text Management"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {language === 'fr' 
              ? "Gérez le texte principal affiché sur le carrousel vidéo héro" 
              : "Manage the main text displayed on the hero video carousel"
            }
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-memopyk-highlight hover:bg-orange-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          {language === 'fr' ? "Nouveau Texte" : "New Text"}
        </Button>
      </div>

      {/* Active Text Preview */}
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

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-memopyk-dark dark:text-white">
              {editingId 
                ? (language === 'fr' ? "Modifier le Texte Héro" : "Edit Hero Text")
                : (language === 'fr' ? "Nouveau Texte Héro" : "New Hero Text")
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="titleFr" className="text-memopyk-dark dark:text-white">
                    {language === 'fr' ? "Titre (Français)" : "Title (French)"}
                  </Label>
                  <Textarea
                    id="titleFr"
                    value={formData.titleFr}
                    onChange={(e) => setFormData(prev => ({ ...prev, titleFr: e.target.value }))}
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
                    value={formData.titleEn}
                    onChange={(e) => setFormData(prev => ({ ...prev, titleEn: e.target.value }))}
                    placeholder={language === 'fr' ? "Entrez le titre en anglais..." : "Enter English title..."}
                    required
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isActive" className="text-memopyk-dark dark:text-white">
                  {language === 'fr' ? "Activer ce texte" : "Activate this text"}
                </Label>
              </div>

              <div className="flex space-x-2">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-memopyk-highlight hover:bg-orange-600 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingId 
                    ? (language === 'fr' ? "Mettre à jour" : "Update")
                    : (language === 'fr' ? "Créer" : "Create")
                  }
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  {language === 'fr' ? "Annuler" : "Cancel"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Hero Text List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-memopyk-dark dark:text-white">
            {language === 'fr' ? "Textes Héro Existants" : "Existing Hero Texts"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-gray-600 dark:text-gray-400">
              {language === 'fr' ? "Chargement..." : "Loading..."}
            </p>
          ) : heroTextSettings.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">
              {language === 'fr' ? "Aucun texte héro trouvé" : "No hero texts found"}
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
                        onClick={() => toggleActive(setting)}
                        disabled={updateMutation.isPending}
                      >
                        {setting.isActive 
                          ? (language === 'fr' ? "Désactiver" : "Deactivate")
                          : (language === 'fr' ? "Activer" : "Activate")
                        }
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(setting)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(setting.id)}
                        disabled={deleteMutation.isPending}
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
    </div>
  );
}