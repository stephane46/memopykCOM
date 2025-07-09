import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, FileText, Type, Minus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface LegalDocumentData {
  id: string;
  type: string;
  titleEn: string;
  titleFr: string;
  contentEn: string;
  contentFr: string;
  isActive: boolean;
  updatedAt: string;
}

interface LegalDocumentFormData {
  type: string;
  titleEn: string;
  titleFr: string;
  contentEn: string;
  contentFr: string;
  isActive: boolean;
}

const DOCUMENT_TYPES = [
  { value: "legal_notice", labelEn: "Legal Notice", labelFr: "Mentions Légales" },
  { value: "privacy_policy", labelEn: "Privacy Policy", labelFr: "Politique de confidentialité" },
  { value: "cookie_policy", labelEn: "Cookie Policy", labelFr: "Politique de cookies" },
  { value: "terms_of_sale", labelEn: "Terms of Sale", labelFr: "Conditions Générales de Vente" },
  { value: "terms_of_use", labelEn: "Terms of Use", labelFr: "Conditions Générales d'Utilisation" },
  { value: "faq", labelEn: "FAQ", labelFr: "FAQ" },
];

// Custom Rich Text Editor Component
function RichTextEditor({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  const quillRef = useRef<ReactQuill>(null);

  const insertHeader = (level: number) => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const range = quill.getSelection();
      if (range) {
        quill.formatLine(range.index, range.length, 'header', level);
      }
    }
  };

  const insertSeparator = () => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const range = quill.getSelection();
      if (range) {
        const separatorHtml = '<hr style="border: none; border-top: 2px solid #ccc; margin: 20px 0;">';
        quill.clipboard.dangerouslyPasteHTML(range.index, separatorHtml);
        quill.setSelection(range.index + 1, 0);
      }
    }
  };

  const modules = {
    toolbar: {
      container: [
        ['bold', 'italic', 'underline'],
        ['link'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['clean']
      ],
    },
  };

  const formats = [
    'header', 'bold', 'italic', 'underline',
    'list', 'bullet', 'link'
  ];

  return (
    <div>
      <Label className="block mb-2">{label}</Label>
      <div className="border rounded-lg">
        {/* Custom Formatting Buttons */}
        <div className="flex gap-2 p-3 border-b bg-gray-50">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertHeader(1)}
            className="flex items-center gap-1"
          >
            <Type className="h-4 w-4" />
            H1
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertHeader(2)}
            className="flex items-center gap-1"
          >
            <Type className="h-4 w-4" />
            H2
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertHeader(3)}
            className="flex items-center gap-1"
          >
            <Type className="h-4 w-4" />
            H3
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={insertSeparator}
            className="flex items-center gap-1"
          >
            <Minus className="h-4 w-4" />
            Ligne
          </Button>
        </div>
        
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          style={{ minHeight: '200px' }}
        />
      </div>
    </div>
  );
}

export function LegalManagement() {
  const [editingDocument, setEditingDocument] = useState<LegalDocumentData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<LegalDocumentFormData>({
    type: "",
    titleEn: "",
    titleFr: "",
    contentEn: "",
    contentFr: "",
    isActive: true,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery<LegalDocumentData[]>({
    queryKey: ["/api/legal-documents"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: LegalDocumentFormData) => {
      const response = await apiRequest("POST", "/api/legal-documents", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/legal-documents"] });
      setShowForm(false);
      resetForm();
      toast({
        title: "Document créé",
        description: "Le document légal a été créé avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le document.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LegalDocumentFormData> }) => {
      const response = await apiRequest("PUT", `/api/legal-documents/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/legal-documents"] });
      setEditingDocument(null);
      resetForm();
      toast({
        title: "Document modifié",
        description: "Le document légal a été modifié avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le document.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/legal-documents/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/legal-documents"] });
      toast({
        title: "Document supprimé",
        description: "Le document légal a été supprimé avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le document.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      type: "",
      titleEn: "",
      titleFr: "",
      contentEn: "",
      contentFr: "",
      isActive: true,
    });
  };

  const handleEdit = (document: LegalDocumentData) => {
    setEditingDocument(document);
    setFormData({
      type: document.type,
      titleEn: document.titleEn,
      titleFr: document.titleFr,
      contentEn: document.contentEn,
      contentFr: document.contentFr,
      isActive: document.isActive,
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDocument) {
      updateMutation.mutate({ id: editingDocument.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingDocument(null);
    resetForm();
  };

  const getDocumentTypeLabel = (type: string) => {
    const docType = DOCUMENT_TYPES.find(dt => dt.value === type);
    return docType ? docType.labelFr : type;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-memopyk-navy">Documents Légaux</h2>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-memopyk-highlight hover:bg-orange-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Document
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingDocument ? "Modifier le Document" : "Nouveau Document"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type de Document</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.labelFr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="titleFr">Titre (Français)</Label>
                  <Input
                    id="titleFr"
                    value={formData.titleFr}
                    onChange={(e) => setFormData({ ...formData, titleFr: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="titleEn">Titre (Anglais)</Label>
                  <Input
                    id="titleEn"
                    value={formData.titleEn}
                    onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <RichTextEditor
                    label="Contenu (Français)"
                    value={formData.contentFr}
                    onChange={(value) => setFormData({ ...formData, contentFr: value })}
                  />
                </div>
                <div>
                  <RichTextEditor
                    label="Contenu (Anglais)"
                    value={formData.contentEn}
                    onChange={(value) => setFormData({ ...formData, contentEn: value })}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Annuler
                </Button>
                <Button 
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-memopyk-highlight hover:bg-orange-600"
                >
                  {editingDocument ? "Modifier" : "Créer"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {documents.map((document) => (
          <Card key={document.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-memopyk-blue" />
                    <h3 className="font-semibold text-lg text-memopyk-navy">
                      {document.titleFr}
                    </h3>
                    <Badge variant={document.isActive ? "default" : "secondary"}>
                      {document.isActive ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Type: {getDocumentTypeLabel(document.type)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Dernière modification: {new Date(document.updatedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(document)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(document.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {documents.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun document légal créé</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}