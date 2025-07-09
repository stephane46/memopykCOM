import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, GripVertical, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { FaqData } from "@/lib/types";

const FAQ_SECTIONS = [
  { key: 'general', nameFr: 'Questions Générales', nameEn: 'General Questions', order: 0 },
  { key: 'getting-started', nameFr: 'Commencer', nameEn: 'Getting Started', order: 1 },
  { key: 'pricing', nameFr: 'Tarifs & Packages', nameEn: 'Pricing & Packages', order: 2 },
  { key: 'process', nameFr: 'Processus & Livraison', nameEn: 'Process & Delivery', order: 3 }
];

export function FaqManagement() {
  const [showForm, setShowForm] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqData | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    section: '',
    sectionNameEn: '',
    sectionNameFr: '',
    sectionOrder: 0,
    orderIndex: 0,
    questionEn: '',
    questionFr: '',
    answerEn: '',
    answerFr: '',
    isActive: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: faqs = [], isLoading } = useQuery<FaqData[]>({
    queryKey: ['/api/faqs'],
  });

  const createFaqMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('POST', '/api/faqs', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "FAQ ajoutée",
        description: "La question fréquente a été ajoutée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/faqs'] });
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la FAQ",
        variant: "destructive",
      });
    }
  });

  const updateFaqMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const response = await apiRequest('PUT', `/api/faqs/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "FAQ mise à jour",
        description: "La question fréquente a été mise à jour avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/faqs'] });
      resetForm();
    },
    onError: () => {
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

  // Group FAQs by section
  const faqsBySection = faqs.reduce((acc, faq) => {
    if (!acc[faq.section]) {
      acc[faq.section] = [];
    }
    acc[faq.section].push(faq);
    return acc;
  }, {} as Record<string, FaqData[]>);

  const resetForm = () => {
    setFormData({
      section: '',
      sectionNameEn: '',
      sectionNameFr: '',
      sectionOrder: 0,
      orderIndex: 0,
      questionEn: '',
      questionFr: '',
      answerEn: '',
      answerFr: '',
      isActive: true
    });
    setEditingFaq(null);
    setShowForm(false);
  };

  const handleEdit = (faq: FaqData) => {
    setFormData({
      section: faq.section,
      sectionNameEn: faq.sectionNameEn,
      sectionNameFr: faq.sectionNameFr,
      sectionOrder: faq.sectionOrder,
      orderIndex: faq.orderIndex,
      questionEn: faq.questionEn,
      questionFr: faq.questionFr,
      answerEn: faq.answerEn,
      answerFr: faq.answerFr,
      isActive: faq.isActive
    });
    setEditingFaq(faq);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-populate section info if using predefined section
    const sectionInfo = FAQ_SECTIONS.find(s => s.key === formData.section);
    const submitData = sectionInfo ? {
      ...formData,
      sectionNameEn: sectionInfo.nameEn,
      sectionNameFr: sectionInfo.nameFr,
      sectionOrder: sectionInfo.order
    } : formData;

    if (editingFaq) {
      updateFaqMutation.mutate({ id: editingFaq.id, data: submitData });
    } else {
      createFaqMutation.mutate(submitData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette FAQ ?')) {
      deleteFaqMutation.mutate(id);
    }
  };

  const toggleFaqStatus = (faq: FaqData) => {
    updateFaqMutation.mutate({
      id: faq.id,
      data: { isActive: !faq.isActive }
    });
  };

  const toggleSection = (sectionKey: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionKey)) {
      newExpanded.delete(sectionKey);
    } else {
      newExpanded.add(sectionKey);
    }
    setExpandedSections(newExpanded);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-memopyk-navy">Gestion des FAQ</h2>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-memopyk-highlight hover:bg-orange-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une FAQ
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingFaq ? 'Modifier la FAQ' : 'Ajouter une nouvelle FAQ'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="section">Section</Label>
                  <Select value={formData.section} onValueChange={(value) => setFormData(prev => ({ ...prev, section: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une section" />
                    </SelectTrigger>
                    <SelectContent>
                      {FAQ_SECTIONS.map((section) => (
                        <SelectItem key={section.key} value={section.key}>
                          {section.nameFr} / {section.nameEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="orderIndex">Ordre dans la section</Label>
                  <Input
                    id="orderIndex"
                    type="number"
                    value={formData.orderIndex}
                    onChange={(e) => setFormData(prev => ({ ...prev, orderIndex: parseInt(e.target.value) || 0 }))}
                    min="0"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-memopyk-navy">Version française</h3>
                  <div>
                    <Label htmlFor="questionFr">Question (Français)</Label>
                    <Input
                      id="questionFr"
                      value={formData.questionFr}
                      onChange={(e) => setFormData(prev => ({ ...prev, questionFr: e.target.value }))}
                      placeholder="Question en français"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="answerFr">Réponse (Français)</Label>
                    <Textarea
                      id="answerFr"
                      value={formData.answerFr}
                      onChange={(e) => setFormData(prev => ({ ...prev, answerFr: e.target.value }))}
                      placeholder="Réponse détaillée en français"
                      rows={4}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-memopyk-navy">Version anglaise</h3>
                  <div>
                    <Label htmlFor="questionEn">Question (Anglais)</Label>
                    <Input
                      id="questionEn"
                      value={formData.questionEn}
                      onChange={(e) => setFormData(prev => ({ ...prev, questionEn: e.target.value }))}
                      placeholder="Question in English"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="answerEn">Réponse (Anglais)</Label>
                    <Textarea
                      id="answerEn"
                      value={formData.answerEn}
                      onChange={(e) => setFormData(prev => ({ ...prev, answerEn: e.target.value }))}
                      placeholder="Detailed answer in English"
                      rows={4}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label>FAQ active</Label>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  type="submit"
                  disabled={createFaqMutation.isPending || updateFaqMutation.isPending}
                >
                  {editingFaq ? 'Mettre à jour' : 'Ajouter'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        <h3 className="font-semibold text-memopyk-navy">FAQ existantes par section</h3>
        
        {FAQ_SECTIONS.map((section) => {
          const sectionFaqs = faqsBySection[section.key] || [];
          const isExpanded = expandedSections.has(section.key);
          
          return (
            <Card key={section.key}>
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => toggleSection(section.key)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {section.nameFr} / {section.nameEn}
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({sectionFaqs.length} FAQ{sectionFaqs.length !== 1 ? 's' : ''})
                    </span>
                  </CardTitle>
                  {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="pt-0">
                  {sectionFaqs.length === 0 ? (
                    <p className="text-center text-memopyk-blue py-4">
                      Aucune FAQ dans cette section
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {sectionFaqs
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map((faq) => (
                          <div 
                            key={faq.id} 
                            className={`border rounded-lg p-4 ${!faq.isActive ? 'opacity-60 bg-gray-50' : 'bg-white'}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3 flex-1">
                                <GripVertical className="h-5 w-5 text-gray-400 cursor-move mt-1" />
                                <HelpCircle className="h-5 w-5 text-memopyk-sky mt-1" />
                                <div className="flex-1">
                                  <h4 className="font-medium text-memopyk-navy mb-1">
                                    {faq.questionFr}
                                  </h4>
                                  <p className="text-sm text-gray-600 mb-2">
                                    {faq.questionEn}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Position {faq.orderIndex} • {faq.isActive ? 'Active' : 'Inactive'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(faq)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(faq.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={faq.isActive}
                                    onCheckedChange={() => toggleFaqStatus(faq)}
                                  />
                                  <span className="text-sm">Active</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
        
        {faqs.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-memopyk-blue">Aucune FAQ configurée</p>
              <p className="text-sm text-gray-500 mt-2">
                Commencez par ajouter votre première question fréquente
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
