export interface Language {
  code: 'fr' | 'en';
  name: string;
  flag: string;
}

export const languages: Language[] = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' }
];

export interface HeroVideoData {
  id: string;
  titleEn: string;
  titleFr: string;
  urlEn: string;
  urlFr: string;
  orderIndex: number;
  isActive: boolean;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  package?: string;
  message?: string;
}

export interface FaqData {
  id: string;
  section: string;
  sectionNameEn: string;
  sectionNameFr: string;
  sectionOrder: number;
  orderIndex: number;
  questionEn: string;
  questionFr: string;
  answerEn: string;
  answerFr: string;
  isActive: boolean;
}

export interface GalleryItemData {
  id: string;
  titleEn: string;
  titleFr: string;
  descriptionEn?: string;
  descriptionFr?: string;
  videoUrl?: string;
  imageUrlEn?: string;
  imageUrlFr?: string;
  priceEn?: string;
  priceFr?: string;
  isActive: boolean;
}

export interface ContactData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  package?: string;
  message?: string;
  status: string;
  createdAt: string;
}
