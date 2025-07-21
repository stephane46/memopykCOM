import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, FolderOpen, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { RichTextEditor, RichTextDisplay } from "@/components/ui/rich-text-editor";
import type { Faq, FaqSection } from "@shared/schema";

export function FaqManagement() {
  const [activeTab, setActiveTab] = useState("sections");
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showFaqForm, setShowFaqForm] = useState(false);
  const [editingSection, setEditingSection] = useState<FaqSection | null>(null);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  const [sectionFormData, setSectionFormData] = useState({
    key: '',
    nameEn: '',
    nameFr: '',
    orderIndex: 0,
    isActive: true
  });

  const [faqFormData, setFaqFormData] = useState({
    sectionId: '',
    questionEn: '',
    questionFr: '',
    answerEn: '',
    answerFr: '',
    orderIndex: 0,
    isActive: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  const { data: sections = [], isLoading: sectionsLoading } = useQuery<FaqSection[]>({
    queryKey: ['/api/faq-sections'],
  });

  const { data: faqs = [], isLoading: faqsLoading } = useQuery<Faq[]>({
    queryKey: ['/api/faqs'],
  });

  // Section mutations
  const createSectionMutation = useMutation({
    mutationFn: async (data: typeof sectionFormData) => {
      const response = await apiRequest('POST', '/api/faq-sections', data);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Section créée",
        description: "La section FAQ a été créée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/faq-sections'] });
      resetSectionForm();
    },
    onError: (error) => {
      console.error('Create section error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la section",
        variant: "destructive",
      });
    }
  });

  const updateSectionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof sectionFormData> }) => {
      const response = await apiRequest('PUT', `/api/faq-sections/${id}`, data);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Section mise à jour",
        description: "La section FAQ a été mise à jour avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/faq-sections'] });
      resetSectionForm();
    },
    onError: (error) => {
      console.error('Update section error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la section",
        variant: "destructive",
      });
    }
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/faq-sections/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Section supprimée",
        description: "La section FAQ a été supprimée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/faq-sections'] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la section",
        variant: "destructive",
      });
    }
  });

  const reorderSectionMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: 'up' | 'down' }) => {
      const response = await apiRequest('PATCH', `/api/faq-sections/${id}/reorder`, { direction });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/faq-sections'] });
      queryClient.invalidateQueries({ queryKey: ['/api/faqs'] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de réorganiser la section",
        variant: "destructive",
      });
    }
  });

  // FAQ mutations
  const createFaqMutation = useMutation({
    mutationFn: async (data: typeof faqFormData) => {
      const response = await apiRequest('POST', '/api/faqs', data);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "FAQ créée",
        description: "La question fréquente a été créée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/faqs'] });
      resetFaqForm();
    },
    onError: (error) => {
      console.error('Create FAQ error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la FAQ",
        variant: "destructive",
      });
    }
  });

  const updateFaqMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof faqFormData> }) => {
      const response = await apiRequest('PUT', `/api/faqs/${id}`, data);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "FAQ mise à jour",
        description: "La question fréquente a été mise à jour avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/faqs'] });
      resetFaqForm();
    },
    onError: (error) => {
      console.error('Update FAQ error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la FAQ",
        variant: "destructive",
      });
    }
  });

  const deleteFaqMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/faqs/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "FAQ supprimée",
        description: "La question fréquente a été supprimée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/faqs'] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la FAQ",
        variant: "destructive",
      });
    }
  });

  const reorderFaqMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: 'up' | 'down' }) => {
      const response = await apiRequest('PATCH', `/api/faqs/${id}/reorder`, { direction });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/faqs'] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de réorganiser la FAQ",
        variant: "destructive",
      });
    }
  });

  // Form handlers
  const resetSectionForm = () => {
    setSectionFormData({
      key: '',
      nameEn: '',
      nameFr: '',
      orderIndex: 0,
      isActive: true
    });
    setEditingSection(null);
    setShowSectionForm(false);
  };

  const resetFaqForm = () => {
    setFaqFormData({
      sectionId: '',
      questionEn: '',
      questionFr: '',
      answerEn: '',
      answerFr: '',
      orderIndex: 0, // Still needed for API, but will be auto-calculated
      isActive: true
    });
    setEditingFaq(null);
    setShowFaqForm(false);
  };

  const handleEditSection = (section: FaqSection) => {
    setSectionFormData({
      key: section.key,
      nameEn: section.nameEn,
      nameFr: section.nameFr,
      orderIndex: section.orderIndex,
      isActive: section.isActive
    });
    setEditingSection(section);
    setShowSectionForm(true);
  };

  const handleEditFaq = (faq: Faq) => {
    setFaqFormData({
      sectionId: faq.sectionId || '',
      questionEn: faq.questionEn,
      questionFr: faq.questionFr,
      answerEn: faq.answerEn,
      answerFr: faq.answerFr,
      orderIndex: faq.orderIndex,
      isActive: faq.isActive
    });
    setEditingFaq(faq);
    setShowFaqForm(true);
  };

  const handleDeleteSection = (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette section ?")) {
      deleteSectionMutation.mutate(id);
    }
  };

  const handleDeleteFaq = (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette FAQ ?")) {
      deleteFaqMutation.mutate(id);
    }
  };

  const handleSectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSection) {
      updateSectionMutation.mutate({ id: editingSection.id, data: sectionFormData });
    } else {
      createSectionMutation.mutate(sectionFormData);
    }
  };

  const handleFaqSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFaq) {
      updateFaqMutation.mutate({ id: editingFaq.id, data: faqFormData });
    } else {
      createFaqMutation.mutate(faqFormData);
    }
  };

  const toggleSectionExpansion = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Group FAQs by section and sort by orderIndex
  const faqsBySection = faqs.reduce((acc, faq) => {
    const sectionId = faq.sectionId || 'uncategorized';
    if (!acc[sectionId]) {
      acc[sectionId] = [];
    }
    acc[sectionId].push(faq);
    return acc;
  }, {} as Record<string, Faq[]>);

  // Sort FAQs within each section by orderIndex
  Object.keys(faqsBySection).forEach(sectionId => {
    faqsBySection[sectionId].sort((a, b) => a.orderIndex - b.orderIndex);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestion FAQ</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sections" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Sections
          </TabsTrigger>
          <TabsTrigger value="faqs" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Questions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sections" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Sections FAQ</h3>
            <Button 
              onClick={() => setShowSectionForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nouvelle Section
            </Button>
          </div>

          {showSectionForm && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingSection ? 'Modifier la Section' : 'Nouvelle Section'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSectionSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="section-key">Clé de la section</Label>
                    <Input
                      id="section-key"
                      value={sectionFormData.key}
                      onChange={(e) => setSectionFormData(prev => ({ ...prev, key: e.target.value }))}
                      placeholder="ex: general, pricing"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="section-name-fr">Nom (Français)</Label>
                      <Input
                        id="section-name-fr"
                        value={sectionFormData.nameFr}
                        onChange={(e) => setSectionFormData(prev => ({ ...prev, nameFr: e.target.value }))}
                        placeholder="ex: Questions Générales"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="section-name-en">Nom (Anglais)</Label>
                      <Input
                        id="section-name-en"
                        value={sectionFormData.nameEn}
                        onChange={(e) => setSectionFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                        placeholder="ex: General Questions"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="section-active"
                      checked={sectionFormData.isActive}
                      onCheckedChange={(checked) => setSectionFormData(prev => ({ ...prev, isActive: checked }))}
                    />
                    <Label htmlFor="section-active">Section active</Label>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={createSectionMutation.isPending || updateSectionMutation.isPending}>
                      {editingSection ? 'Mettre à jour' : 'Créer'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetSectionForm}>
                      Annuler
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {sectionsLoading ? (
              <div>Chargement des sections...</div>
            ) : (
              sections.map((section) => (
                <Card key={section.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FolderOpen className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="font-medium">
                            {language === 'fr' ? section.nameFr : section.nameEn}
                          </div>
                          <div className="text-sm text-gray-500">
                            Clé: {section.key} • Ordre: {section.orderIndex}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={section.isActive}
                          onCheckedChange={(checked) => 
                            updateSectionMutation.mutate({
                              id: section.id,
                              data: { isActive: checked }
                            })
                          }
                        />
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => reorderSectionMutation.mutate({ id: section.id, direction: 'up' })}
                            disabled={reorderSectionMutation.isPending}
                            className="h-6 w-6 p-0"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => reorderSectionMutation.mutate({ id: section.id, direction: 'down' })}
                            disabled={reorderSectionMutation.isPending}
                            className="h-6 w-6 p-0"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditSection(section)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteSection(section.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="faqs" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Questions Fréquentes</h3>
            <Button 
              onClick={() => setShowFaqForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nouvelle FAQ
            </Button>
          </div>

          {showFaqForm && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingFaq ? 'Modifier la FAQ' : 'Nouvelle FAQ'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFaqSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="faq-section">Section</Label>
                    <Select
                      value={faqFormData.sectionId}
                      onValueChange={(value) => setFaqFormData(prev => ({ ...prev, sectionId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une section" />
                      </SelectTrigger>
                      <SelectContent>
                        {sections.map((section) => (
                          <SelectItem key={section.id} value={section.id}>
                            {language === 'fr' ? section.nameFr : section.nameEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="question-fr">Question (Français)</Label>
                      <Textarea
                        id="question-fr"
                        value={faqFormData.questionFr}
                        onChange={(e) => setFaqFormData(prev => ({ ...prev, questionFr: e.target.value }))}
                        rows={2}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="question-en">Question (Anglais)</Label>
                      <Textarea
                        id="question-en"
                        value={faqFormData.questionEn}
                        onChange={(e) => setFaqFormData(prev => ({ ...prev, questionEn: e.target.value }))}
                        rows={2}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="answer-fr">Réponse (Français)</Label>
                      <RichTextEditor
                        value={faqFormData.answerFr}
                        onChange={(value) => setFaqFormData(prev => ({ ...prev, answerFr: value }))}
                        placeholder="Rédigez votre réponse en français..."
                        height="250px"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="answer-en">Réponse (Anglais)</Label>
                      <RichTextEditor
                        value={faqFormData.answerEn}
                        onChange={(value) => setFaqFormData(prev => ({ ...prev, answerEn: value }))}
                        placeholder="Write your answer in English..."
                        height="250px"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="faq-active"
                      checked={faqFormData.isActive}
                      onCheckedChange={(checked) => setFaqFormData(prev => ({ ...prev, isActive: checked }))}
                    />
                    <Label htmlFor="faq-active">FAQ active</Label>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={createFaqMutation.isPending || updateFaqMutation.isPending}>
                      {editingFaq ? 'Mettre à jour' : 'Créer'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetFaqForm}>
                      Annuler
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {faqsLoading ? (
              <div>Chargement des FAQs...</div>
            ) : (
              sections.map((section) => {
                const sectionFaqs = faqsBySection[section.id] || [];
                const isExpanded = expandedSections.has(section.id);

                return (
                  <Card key={section.id}>
                    <CardHeader 
                      className="cursor-pointer"
                      onClick={() => toggleSectionExpansion(section.id)}
                    >
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <FolderOpen className="h-5 w-5" />
                          {language === 'fr' ? section.nameFr : section.nameEn}
                          <span className="text-sm font-normal text-gray-500">
                            ({sectionFaqs.length} questions)
                          </span>
                        </CardTitle>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </CardHeader>
                    {isExpanded && (
                      <CardContent className="space-y-2">
                        {sectionFaqs.length === 0 ? (
                          <div className="text-gray-500 italic">Aucune question dans cette section</div>
                        ) : (
                          sectionFaqs.map((faq, index) => (
                            <Card key={faq.id} className="border-l-4 border-l-blue-500">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="font-medium mb-2">
                                      {language === 'fr' ? faq.questionFr : faq.questionEn}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      <RichTextDisplay 
                                        content={language === 'fr' ? faq.answerFr : faq.answerEn}
                                        className="prose prose-sm max-w-none"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {/* Reorder buttons */}
                                    <div className="flex flex-col gap-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => reorderFaqMutation.mutate({ id: faq.id, direction: 'up' })}
                                        disabled={index === 0 || reorderFaqMutation.isPending}
                                        className="h-6 w-6 p-0"
                                      >
                                        <ChevronUp className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => reorderFaqMutation.mutate({ id: faq.id, direction: 'down' })}
                                        disabled={index === sectionFaqs.length - 1 || reorderFaqMutation.isPending}
                                        className="h-6 w-6 p-0"
                                      >
                                        <ChevronDown className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <Switch
                                      checked={faq.isActive}
                                      onCheckedChange={(checked) => 
                                        updateFaqMutation.mutate({
                                          id: faq.id,
                                          data: { isActive: checked }
                                        })
                                      }
                                    />
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditFaq(faq)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteFaq(faq.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}