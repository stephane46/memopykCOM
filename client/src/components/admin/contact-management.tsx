import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Mail, 
  Phone, 
  Calendar, 
  Package, 
  MessageSquare, 
  Eye, 
  Trash2, 
  Search,
  Download,
  Filter
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ContactData } from "@/lib/types";

const STATUS_OPTIONS = [
  { value: 'new', label: 'Nouveau', color: 'bg-blue-500' },
  { value: 'contacted', label: 'Contacté', color: 'bg-yellow-500' },
  { value: 'in-progress', label: 'En cours', color: 'bg-orange-500' },
  { value: 'completed', label: 'Terminé', color: 'bg-green-500' },
  { value: 'cancelled', label: 'Annulé', color: 'bg-red-500' }
];

const PACKAGE_OPTIONS = [
  { value: 'essential', label: 'Essentiel - €299' },
  { value: 'premium', label: 'Premium - €499' },
  { value: 'luxe', label: 'Luxe - €799' },
  { value: 'custom', label: 'Personnalisé' }
];

export function ContactManagement() {
  const [selectedContact, setSelectedContact] = useState<ContactData | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading } = useQuery<ContactData[]>({
    queryKey: ['/api/contacts'],
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { status: string } }) => {
      const response = await apiRequest('PUT', `/api/contacts/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Contact mis à jour",
        description: "Le statut du contact a été mis à jour avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le contact",
        variant: "destructive",
      });
    }
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/contacts/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Contact supprimé",
        description: "Le contact a été supprimé avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      setSelectedContact(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le contact",
        variant: "destructive",
      });
    }
  });

  const handleStatusChange = (contactId: string, newStatus: string) => {
    updateContactMutation.mutate({ id: contactId, data: { status: newStatus } });
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) {
      deleteContactMutation.mutate(id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(opt => opt.value === status);
    return statusOption || { value: status, label: status, color: 'bg-gray-500' };
  };

  const getPackageLabel = (packageValue: string) => {
    const packageOption = PACKAGE_OPTIONS.find(opt => opt.value === packageValue);
    return packageOption?.label || packageValue;
  };

  // Filter contacts based on status and search term
  const filteredContacts = contacts.filter(contact => {
    const matchesStatus = filterStatus === 'all' || contact.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Group contacts by status for stats
  const contactStats = STATUS_OPTIONS.reduce((acc, status) => {
    acc[status.value] = contacts.filter(c => c.status === status.value).length;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-memopyk-navy">Gestion des Contacts</h2>
        <div className="flex space-x-2">
          <Button variant="outline" className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Exporter</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-memopyk-navy">{contacts.length}</div>
            <div className="text-sm text-gray-600">Total</div>
          </CardContent>
        </Card>
        {STATUS_OPTIONS.map((status) => (
          <Card key={status.value}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-memopyk-navy">{contactStats[status.value] || 0}</div>
              <div className="text-sm text-gray-600">{status.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Contacts List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-memopyk-navy">
            Contacts ({filteredContacts.length})
          </h3>
          
          {filteredContacts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-memopyk-blue">
                  {contacts.length === 0 ? 'Aucun contact reçu' : 'Aucun contact trouvé'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {contacts.length === 0 
                    ? 'Les nouveaux contacts apparaîtront ici'
                    : 'Essayez d\'ajuster vos filtres de recherche'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredContacts.map((contact) => {
              const statusBadge = getStatusBadge(contact.status);
              
              return (
                <Card 
                  key={contact.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedContact?.id === contact.id ? 'ring-2 ring-memopyk-sky' : ''
                  }`}
                  onClick={() => setSelectedContact(contact)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-memopyk-navy">{contact.name}</h4>
                          <Badge className={`${statusBadge.color} text-white`}>
                            {statusBadge.label}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4" />
                            <span>{contact.email}</span>
                          </div>
                          
                          {contact.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4" />
                              <span>{contact.phone}</span>
                            </div>
                          )}
                          
                          {contact.package && (
                            <div className="flex items-center space-x-2">
                              <Package className="h-4 w-4" />
                              <span>{getPackageLabel(contact.package)}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(contact.createdAt)}</span>
                          </div>
                        </div>
                        
                        {contact.message && (
                          <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                            {contact.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-4">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Contact Details */}
        <div className="space-y-4">
          <h3 className="font-semibold text-memopyk-navy">Détails du contact</h3>
          
          {selectedContact ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{selectedContact.name}</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(selectedContact.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <Label className="font-semibold">Statut</Label>
                  <Select 
                    value={selectedContact.status} 
                    onValueChange={(value) => handleStatusChange(selectedContact.id, value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="font-semibold">Email</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input value={selectedContact.email} readOnly />
                    <Button size="sm" variant="outline" asChild>
                      <a href={`mailto:${selectedContact.email}`}>
                        <Mail className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
                
                {selectedContact.phone && (
                  <div>
                    <Label className="font-semibold">Téléphone</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input value={selectedContact.phone} readOnly />
                      <Button size="sm" variant="outline" asChild>
                        <a href={`tel:${selectedContact.phone}`}>
                          <Phone className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
                
                {selectedContact.package && (
                  <div>
                    <Label className="font-semibold">Package</Label>
                    <Input 
                      value={getPackageLabel(selectedContact.package)} 
                      readOnly 
                      className="mt-1"
                    />
                  </div>
                )}
                
                <div>
                  <Label className="font-semibold">Date de contact</Label>
                  <Input 
                    value={formatDate(selectedContact.createdAt)} 
                    readOnly 
                    className="mt-1"
                  />
                </div>
                
                {selectedContact.message && (
                  <div>
                    <Label className="font-semibold">Message</Label>
                    <Textarea 
                      value={selectedContact.message} 
                      readOnly 
                      rows={6}
                      className="mt-1"
                    />
                  </div>
                )}
                
                <div className="pt-4 border-t">
                  <Button 
                    className="w-full bg-memopyk-highlight hover:bg-orange-600"
                    asChild
                  >
                    <a href={`mailto:${selectedContact.email}?subject=Votre projet MEMOPYK`}>
                      <Mail className="h-4 w-4 mr-2" />
                      Répondre par email
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-memopyk-blue">Sélectionnez un contact</p>
                <p className="text-sm text-gray-500 mt-2">
                  Cliquez sur un contact dans la liste pour voir ses détails
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
