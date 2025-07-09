import { pgTable, text, serial, integer, boolean, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (for admin authentication)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Hero Videos table
export const heroVideos = pgTable("hero_videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  titleEn: text("title_en").notNull(),
  titleFr: text("title_fr").notNull(),
  urlEn: text("url_en").notNull(),
  urlFr: text("url_fr").notNull(),
  orderIndex: integer("order_index").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Gallery Items table
export const galleryItems = pgTable("gallery_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  titleEn: text("title_en").notNull(),
  titleFr: text("title_fr").notNull(),
  descriptionEn: text("description_en"),
  descriptionFr: text("description_fr"),
  videoUrl: text("video_url"),
  imageUrlEn: text("image_url_en"),
  imageUrlFr: text("image_url_fr"),
  priceEn: text("price_en"),
  priceFr: text("price_fr"),
  altTextEn: text("alt_text_en"),
  altTextFr: text("alt_text_fr"),
  additionalInfoEn: text("additional_info_en"),
  additionalInfoFr: text("additional_info_fr"),
  orderIndex: integer("order_index").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// FAQs table
export const faqs = pgTable("faqs", {
  id: uuid("id").primaryKey().defaultRandom(),
  section: text("section").notNull(),
  sectionNameEn: text("section_name_en").notNull(),
  sectionNameFr: text("section_name_fr").notNull(),
  sectionOrder: integer("section_order").default(0),
  orderIndex: integer("order_index").default(0),
  questionEn: text("question_en").notNull(),
  questionFr: text("question_fr").notNull(),
  answerEn: text("answer_en").notNull(),
  answerFr: text("answer_fr").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// SEO Settings table
export const seoSettings = pgTable("seo_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  page: text("page").notNull(),
  urlSlugEn: text("url_slug_en"),
  urlSlugFr: text("url_slug_fr"),
  metaTitleEn: text("meta_title_en"),
  metaTitleFr: text("meta_title_fr"),
  metaDescriptionEn: text("meta_description_en"),
  metaDescriptionFr: text("meta_description_fr"),
  ogTitleEn: text("og_title_en"),
  ogTitleFr: text("og_title_fr"),
  ogDescriptionEn: text("og_description_en"),
  ogDescriptionFr: text("og_description_fr"),
  ogImageUrl: text("og_image_url"),
  twitterTitleEn: text("twitter_title_en"),
  twitterTitleFr: text("twitter_title_fr"),
  twitterDescriptionEn: text("twitter_description_en"),
  twitterDescriptionFr: text("twitter_description_fr"),
  twitterImageUrl: text("twitter_image_url"),
  canonicalUrl: text("canonical_url"),
  robotsIndex: boolean("robots_index").default(true),
  robotsFollow: boolean("robots_follow").default(true),
  jsonLd: jsonb("json_ld"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Contacts table
export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  package: text("package"),
  message: text("message"),
  preferredContact: text("preferred_contact"),
  status: text("status").default("new"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Legal Documents table
export const legalDocuments = pgTable("legal_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(), // "legal_notice", "privacy_policy", "cookie_policy", "terms_of_sale", "terms_of_use", "faq"
  titleEn: text("title_en").notNull(),
  titleFr: text("title_fr").notNull(),
  contentEn: text("content_en").notNull(),
  contentFr: text("content_fr").notNull(),
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Deployment History table
export const deploymentHistory = pgTable("deployment_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(), // "deployment", "nginx_setup"
  status: text("status").notNull(), // "success", "failed", "in_progress"
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // duration in seconds
  logs: text("logs"),
  host: text("host"),
  domain: text("domain"),
  createdAt: timestamp("created_at").defaultNow()
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertHeroVideoSchema = createInsertSchema(heroVideos).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertGalleryItemSchema = createInsertSchema(galleryItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertFaqSchema = createInsertSchema(faqs).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSeoSettingSchema = createInsertSchema(seoSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertLegalDocumentSchema = createInsertSchema(legalDocuments).omit({
  id: true,
  updatedAt: true
});

export const insertDeploymentHistorySchema = createInsertSchema(deploymentHistory).omit({
  id: true,
  createdAt: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type HeroVideo = typeof heroVideos.$inferSelect;
export type InsertHeroVideo = z.infer<typeof insertHeroVideoSchema>;

export type GalleryItem = typeof galleryItems.$inferSelect;
export type InsertGalleryItem = z.infer<typeof insertGalleryItemSchema>;

export type Faq = typeof faqs.$inferSelect;
export type InsertFaq = z.infer<typeof insertFaqSchema>;

export type SeoSetting = typeof seoSettings.$inferSelect;
export type InsertSeoSetting = z.infer<typeof insertSeoSettingSchema>;

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;

export type LegalDocument = typeof legalDocuments.$inferSelect;
export type InsertLegalDocument = z.infer<typeof insertLegalDocumentSchema>;

export type DeploymentHistory = typeof deploymentHistory.$inferSelect;
export type InsertDeploymentHistory = z.infer<typeof insertDeploymentHistorySchema>;
