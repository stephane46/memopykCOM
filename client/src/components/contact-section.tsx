import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import type { ContactFormData } from "@/lib/types";

export function ContactSection() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    package: '',
    message: ''
  });

  const createContactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const response = await apiRequest('POST', '/api/contacts', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: t('contact.success.title', { fr: 'Message envoyé', en: 'Message sent' }),
        description: t('contact.success.description', { 
          fr: 'Nous vous répondrons dans les 24 heures.', 
          en: 'We will respond within 24 hours.' 
        }),
      });
      setFormData({ name: '', email: '', phone: '', package: '', message: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
    },
    onError: () => {
      toast({
        title: t('contact.error.title', { fr: 'Erreur', en: 'Error' }),
        description: t('contact.error.description', { 
          fr: 'Une erreur est survenue. Veuillez réessayer.', 
          en: 'An error occurred. Please try again.' 
        }),
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast({
        title: t('contact.validation.title', { fr: 'Champs requis', en: 'Required fields' }),
        description: t('contact.validation.description', { 
          fr: 'Veuillez remplir tous les champs obligatoires.', 
          en: 'Please fill in all required fields.' 
        }),
        variant: "destructive",
      });
      return;
    }
    createContactMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <section id="contact" className="py-20 bg-memopyk-cream">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-playfair text-4xl lg:text-5xl font-bold text-memopyk-navy mb-6">
            {t('contact.title', { 
              fr: 'Contactez-nous ou demandez un devis personnalisé', 
              en: 'Contact us or request a personalized quote' 
            })}
          </h2>
          <p className="text-xl text-memopyk-blue">
            {t('contact.subtitle', { 
              fr: 'Prêt à commencer votre projet de film mémoire ? Nous sommes là pour vous accompagner.',
              en: 'Ready to start your memory film project? We\'re here to guide you.'
            })}
          </p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label className="text-memopyk-navy font-semibold">
                  {t('contact.form.name', { fr: 'Nom complet', en: 'Full Name' })}
                  <span className="text-memopyk-highlight ml-1">*</span>
                </Label>
                <Input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="mt-2 focus:ring-memopyk-sky focus:border-transparent"
                  placeholder={t('contact.form.namePlaceholder', { fr: 'Votre nom', en: 'Your name' })}
                />
              </div>
              <div>
                <Label className="text-memopyk-navy font-semibold">
                  {t('contact.form.email', { fr: 'Email', en: 'Email' })}
                  <span className="text-memopyk-highlight ml-1">*</span>
                </Label>
                <Input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="mt-2 focus:ring-memopyk-sky focus:border-transparent"
                  placeholder="votre@email.com"
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label className="text-memopyk-navy font-semibold">
                  {t('contact.form.phone', { fr: 'Téléphone', en: 'Phone' })}
                </Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="mt-2 focus:ring-memopyk-sky focus:border-transparent"
                  placeholder="+33 1 23 45 67 89"
                />
              </div>
              <div>
                <Label className="text-memopyk-navy font-semibold">
                  {t('contact.form.package', { fr: 'Package préféré', en: 'Preferred Package' })}
                </Label>
                <Select value={formData.package} onValueChange={(value) => handleInputChange('package', value)}>
                  <SelectTrigger className="mt-2 focus:ring-memopyk-sky focus:border-transparent">
                    <SelectValue placeholder={t('contact.form.packagePlaceholder', { 
                      fr: 'Choisir un package', 
                      en: 'Choose a package' 
                    })} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="essential">
                      {t('contact.form.essential', { fr: 'Essentiel - €299', en: 'Essential - €299' })}
                    </SelectItem>
                    <SelectItem value="premium">
                      {t('contact.form.premium', { fr: 'Premium - €499', en: 'Premium - €499' })}
                    </SelectItem>
                    <SelectItem value="luxe">
                      {t('contact.form.luxury', { fr: 'Luxe - €799', en: 'Luxury - €799' })}
                    </SelectItem>
                    <SelectItem value="custom">
                      {t('contact.form.custom', { fr: 'Personnalisé', en: 'Custom' })}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label className="text-memopyk-navy font-semibold">
                {t('contact.form.details', { fr: 'Détails du projet', en: 'Project Details' })}
              </Label>
              <Textarea
                rows={5}
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                className="mt-2 focus:ring-memopyk-sky focus:border-transparent resize-none"
                placeholder={t('contact.form.detailsPlaceholder', { 
                  fr: 'Parlez-nous de votre projet, vos photos/vidéos, occasions spéciales, préférences musicales...',
                  en: 'Tell us about your project, your photos/videos, special occasions, music preferences...'
                })}
              />
            </div>
            
            <div className="text-center">
              <Button 
                type="submit" 
                disabled={createContactMutation.isPending}
                className="bg-memopyk-highlight hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-full text-lg transition-all transform hover:scale-105 shadow-lg"
              >
                {createContactMutation.isPending 
                  ? t('contact.form.sending', { fr: 'Envoi...', en: 'Sending...' })
                  : t('contact.form.submit', { 
                      fr: 'Commencer mon projet de film mémoire', 
                      en: 'Start My Memory Film Project' 
                    })
                }
              </Button>
              <p className="text-sm text-memopyk-blue mt-4">
                {t('contact.form.response', { 
                  fr: 'Nous vous répondons dans les 24 heures', 
                  en: 'We respond within 24 hours' 
                })}
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

export default ContactSection;
