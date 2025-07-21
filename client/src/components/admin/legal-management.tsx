import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Trash2, Plus, Edit2, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LegalRichTextEditor } from "@/components/ui/legal-rich-text-editor";
import type { LegalDocument } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Form schema for legal documents - matches insertLegalDocumentSchema
const legalDocumentSchema = z.object({
  type: z.string().min(1, "Document type is required"),
  titleFr: z.string().min(1, "French title is required"),
  titleEn: z.string().min(1, "English title is required"),
  contentFr: z.string().min(1, "French content is required"),
  contentEn: z.string().min(1, "English content is required"),
  isActive: z.boolean().default(true),
});

type LegalDocumentFormData = z.infer<typeof legalDocumentSchema>;

const documentTypes = [
  { value: "mentions-legales", labelFr: "Mentions Légales", labelEn: "Legal Notice" },
  { value: "politique-confidentialite", labelFr: "Politique de confidentialité", labelEn: "Privacy Policy" },
  { value: "politique-cookies", labelFr: "Politique de cookies", labelEn: "Cookie Policy" },
  { value: "cgv", labelFr: "Conditions Générales de Vente", labelEn: "Terms of Sale" },
  { value: "cgu", labelFr: "Conditions Générales d'Utilisation", labelEn: "Terms of Use" },
];

export default function LegalManagement() {
  const [editingDocument, setEditingDocument] = useState<LegalDocument | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [previewContent, setPreviewContent] = useState<{ type: 'fr' | 'en', content: string } | null>(null);
  const { toast } = useToast();

  const form = useForm<LegalDocumentFormData>({
    resolver: zodResolver(legalDocumentSchema),
    defaultValues: {
      type: "",
      titleFr: "",
      titleEn: "",
      contentFr: "",
      contentEn: "",
      isActive: true,
    },
  });

  // Fetch legal documents
  const { data: legalDocuments = [], isLoading } = useQuery({
    queryKey: ["/api/legal-documents"],
  });

  // Create document mutation
  const createMutation = useMutation({
    mutationFn: async (data: LegalDocumentFormData) => {
      console.log("🆕 Creating legal document:", data);
      console.log("📝 Form data validation:", legalDocumentSchema.safeParse(data));
      console.log("🔍 Data types:", {
        type: typeof data.type,
        titleFr: typeof data.titleFr,
        titleEn: typeof data.titleEn,
        contentFr: typeof data.contentFr,
        contentEn: typeof data.contentEn,
        isActive: typeof data.isActive
      });
      
      try {
        const result = await apiRequest("POST", "/api/legal-documents", data);
        console.log("✅ API request successful:", result);
        return result;
      } catch (error) {
        console.error("❌ API request failed:", error);
        throw error;
      }
    },
    onSuccess: (result) => {
      console.log("✅ Legal document created successfully:", result);
      queryClient.invalidateQueries({ queryKey: ["/api/legal-documents"] });
      toast({
        title: "Document créé",
        description: "Le document légal a été créé avec succès.",
      });
      resetForm();
    },
    onError: (error) => {
      console.error("❌ Error creating legal document:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le document légal.",
        variant: "destructive",
      });
    },
  });

  // Update document mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LegalDocumentFormData> }) => {
      console.log("🔄 Updating legal document:", id, data);
      return await apiRequest("PATCH", `/api/legal-documents/${id}`, data);
    },
    onSuccess: (result) => {
      console.log("✅ Legal document updated successfully:", result);
      queryClient.invalidateQueries({ queryKey: ["/api/legal-documents"] });
      toast({
        title: "Document mis à jour",
        description: "Le document légal a été mis à jour avec succès.",
      });
      resetForm();
    },
    onError: (error) => {
      console.error("❌ Error updating legal document:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le document légal.",
        variant: "destructive",
      });
    },
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/legal-documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/legal-documents"] });
      toast({
        title: "Document supprimé",
        description: "Le document légal a été supprimé avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le document légal.",
        variant: "destructive",
      });
      console.error("Error deleting legal document:", error);
    },
  });

  const resetForm = () => {
    setEditingDocument(null);
    setShowForm(false);
    form.reset({
      type: "",
      titleFr: "",
      titleEn: "",
      contentFr: "",
      contentEn: "",
      isActive: true,
    });
  };

  const handleEdit = (document: LegalDocument) => {
    setEditingDocument(document);
    setShowForm(true);
    form.reset({
      type: document.type,
      titleFr: document.titleFr,
      titleEn: document.titleEn,
      contentFr: document.contentFr,
      contentEn: document.contentEn,
      isActive: document.isActive,
    });
  };

  const handleSubmit = (data: LegalDocumentFormData) => {
    console.log("📝 Form submitted with data:", data);
    console.log("📋 Form validation errors:", form.formState.errors);
    console.log("🔄 Editing document:", editingDocument);
    
    if (editingDocument) {
      console.log("🔄 Calling update mutation...");
      updateMutation.mutate({ id: editingDocument.id, data });
    } else {
      console.log("🆕 Calling create mutation...");
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce document légal ?")) {
      deleteMutation.mutate(id);
    }
  };

  const getDocumentTypeLabel = (type: string, lang: 'fr' | 'en') => {
    const docType = documentTypes.find(dt => dt.value === type);
    return docType ? (lang === 'fr' ? docType.labelFr : docType.labelEn) : type;
  };

  // Generate preview URLs for legal documents
  const getPreviewUrls = (type: string) => {
    const urlMappings: Record<string, { fr: string; en: string }> = {
      'mentions-legales': {
        fr: '/fr-FR/mentions-legales',
        en: '/en-US/legal-notice'
      },
      'politique-confidentialite': {
        fr: '/fr-FR/politique-confidentialite',
        en: '/en-US/privacy-policy'
      },
      'politique-cookies': {
        fr: '/fr-FR/politique-cookies',
        en: '/en-US/cookie-policy'
      },
      'cgv': {
        fr: '/fr-FR/conditions-generales-vente',
        en: '/en-US/terms-of-sale'
      },
      'cgu': {
        fr: '/fr-FR/conditions-generales-utilisation',
        en: '/en-US/terms-of-use'
      }
    };
    
    return urlMappings[type] || { fr: '/fr-FR/document', en: '/en-US/document' };
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Chargement des documents légaux...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des Documents Légaux</h2>
        <Button 
          onClick={() => setShowForm(true)} 
          disabled={showForm}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouveau Document
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingDocument ? "Modifier le Document" : "Nouveau Document Légal"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Document Type */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de Document</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un type..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {documentTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.labelFr} / {type.labelEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Titles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="titleFr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titre (Français)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Titre en français..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="titleEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titre (Anglais)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Titre en anglais..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Content - French */}
                <FormField
                  control={form.control}
                  name="contentFr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contenu (Français)</FormLabel>
                      <FormControl>
                        <LegalRichTextEditor
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Contenu en français..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Content - English */}
                <FormField
                  control={form.control}
                  name="contentEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contenu (Anglais)</FormLabel>
                      <FormControl>
                        <LegalRichTextEditor
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Contenu en anglais..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Buttons */}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    onClick={() => {
                      console.log("🔘 Submit button clicked");
                      console.log("📋 Current form errors:", form.formState.errors);
                      console.log("📝 Current form values:", form.getValues());
                      console.log("✅ Form is valid:", form.formState.isValid);
                    }}
                  >
                    {editingDocument ? "Mettre à jour" : "Créer"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Documents List */}
      <div className="grid gap-4">
        {legalDocuments.map((document: LegalDocument) => (
          <Card key={document.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{document.titleFr}</h3>
                    <Badge variant={document.isActive ? "default" : "secondary"}>
                      {document.isActive ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Type: {getDocumentTypeLabel(document.type, 'fr')}
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Anglais: {document.titleEn}
                  </p>
                  
                  {/* Preview URLs */}
                  <div className="flex gap-2 mt-2">
                    <a 
                      href={getPreviewUrls(document.type).fr}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                    >
                      🇫🇷 {getPreviewUrls(document.type).fr}
                    </a>
                    <a 
                      href={getPreviewUrls(document.type).en}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
                    >
                      🇺🇸 {getPreviewUrls(document.type).en}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPreviewContent({ type: 'fr', content: document.contentFr })}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    FR
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPreviewContent({ type: 'en', content: document.contentEn })}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    EN
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(document)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(document.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {legalDocuments.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Aucun document légal trouvé.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Cliquez sur "Nouveau Document" pour commencer.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Preview Modal */}
      {previewContent && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Aperçu {previewContent.type === 'fr' ? '(Français)' : '(English)'}
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPreviewContent(null)}
              >
                <EyeOff className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="overflow-auto max-h-[60vh]">
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: previewContent.content }}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}