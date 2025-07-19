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
  videoUrlEn?: string;
  videoUrlFr?: string;
  imageUrlEn?: string;
  imageUrlFr?: string;
  priceEn?: string;
  priceFr?: string;
  // Content Stats (red box 1)
  contentStatsEn?: string;
  contentStatsFr?: string;
  // Duration (red box 2)
  durationEn?: string;
  durationFr?: string;
  // Client wanted (red box 3)
  feature1En?: string;
  feature1Fr?: string;
  // Video Story (red box 4)
  feature2En?: string;
  feature2Fr?: string;
  additionalInfoEn?: string;
  additionalInfoFr?: string;
  orderIndex: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
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
