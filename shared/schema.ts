import { pgTable, text, varchar, serial, integer, boolean, timestamp, uuid, jsonb, doublePrecision, bigint } from "drizzle-orm/pg-core";
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
  // Local caching fields
  localFileEn: text("local_file_en"), // Local filename when cached
  localFileFr: text("local_file_fr"), // Local filename when cached
  hasLocalCopyEn: boolean("has_local_copy_en").default(false),
  hasLocalCopyFr: boolean("has_local_copy_fr").default(false),
  orderIndex: integer("order_index").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Hero Text Settings table  
export const heroTextSettings = pgTable("hero_text_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  titleEn: text("title_en").notNull(),
  titleFr: text("title_fr").notNull(),
  fontSize: integer("font_size").default(60), // Font size in pixels (default: text-6xl = 60px)
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
  videoUrlEn: text("video_url_en"),
  videoUrlFr: text("video_url_fr"),
  // Local caching fields for gallery videos
  localVideoFileEn: text("local_video_file_en"), // Local filename when cached
  localVideoFileFr: text("local_video_file_fr"), // Local filename when cached
  hasLocalVideoCopyEn: boolean("has_local_video_copy_en").default(false),
  hasLocalVideoCopyFr: boolean("has_local_video_copy_fr").default(false),
  // Video dimensions for optimization
  videoWidthEn: integer("video_width_en"),
  videoHeightEn: integer("video_height_en"),
  videoAspectRatioEn: doublePrecision("video_aspect_ratio_en"),
  videoOrientationEn: text("video_orientation_en").default("landscape"),
  videoWidthFr: integer("video_width_fr"),
  videoHeightFr: integer("video_height_fr"),
  videoAspectRatioFr: doublePrecision("video_aspect_ratio_fr"),
  videoOrientationFr: text("video_orientation_fr").default("landscape"),
  imageUrlEn: text("image_url_en"),
  imageUrlFr: text("image_url_fr"),
  staticImageUrlEn: text("static_image_url_en"), // 300x200 cropped static image
  staticImageUrlFr: text("static_image_url_fr"), // 300x200 cropped static image
  imagePositionEn: jsonb("image_position_en"), // {x: number, y: number, scale: number}
  imagePositionFr: jsonb("image_position_fr"), // {x: number, y: number, scale: number}
  noVideoMessageEn: text("no_video_message_en"),
  noVideoMessageFr: text("no_video_message_fr"),
  priceEn: text("price_en"),
  priceFr: text("price_fr"),
  altTextEn: text("alt_text_en"),
  altTextFr: text("alt_text_fr"),
  additionalInfoEn: text("additional_info_en"),
  additionalInfoFr: text("additional_info_fr"),
  // Content Stats (red box 1): "80 videos & 10 photos provided by Client"
  contentStatsEn: text("content_stats_en"),
  contentStatsFr: text("content_stats_fr"),
  // Duration (red box 2): "2 minutes"
  durationEn: text("duration_en"),
  durationFr: text("duration_fr"),
  // Features (red boxes 3 & 4): "Client wanted", "Video Story"
  feature1En: text("feature1_en"), // Client wanted
  feature1Fr: text("feature1_fr"), // Client wanted
  feature2En: text("feature2_en"), // Video Story
  feature2Fr: text("feature2_fr"), // Video Story
  orderIndex: integer("order_index").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// FAQ Sections table
export const faqSections = pgTable("faq_sections", {
  id: varchar("id").primaryKey(),
  key: varchar("key").notNull().unique(),
  nameEn: varchar("name_en").notNull(),
  nameFr: varchar("name_fr").notNull(),
  orderIndex: integer("order_index").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// FAQs table
export const faqs = pgTable("faqs", {
  id: uuid("id").primaryKey().defaultRandom(),
  sectionNameEn: varchar("section_name_en").notNull(),
  sectionNameFr: varchar("section_name_fr").notNull(),
  sectionOrder: integer("section_order").default(0),
  orderIndex: integer("order_index").default(0),
  questionEn: text("question_en").notNull(),
  questionFr: text("question_fr").notNull(),
  answerEn: text("answer_en").notNull(),
  answerFr: text("answer_fr").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  sectionId: varchar("section_id").notNull().references(() => faqSections.id, { onDelete: 'cascade' })
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

// CTA Settings table
export const ctaSettings = pgTable("cta_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  titleEn: text("title_en").notNull(),
  titleFr: text("title_fr").notNull(),
  subtitleEn: text("subtitle_en").notNull(),
  subtitleFr: text("subtitle_fr").notNull(),
  button1TextEn: text("button1_text_en").notNull(),
  button1TextFr: text("button1_text_fr").notNull(),
  button1UrlEn: text("button1_url_en").notNull(),
  button1UrlFr: text("button1_url_fr").notNull(),
  button2TextEn: text("button2_text_en").notNull(),
  button2TextFr: text("button2_text_fr").notNull(),
  button2UrlEn: text("button2_url_en").notNull(),
  button2UrlFr: text("button2_url_fr").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Legal Documents table
export const legalDocuments = pgTable("legal_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(), // mentions-legales, politique-confidentialite, etc.
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

export const insertHeroTextSettingSchema = createInsertSchema(heroTextSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertGalleryItemSchema = createInsertSchema(galleryItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertFaqSectionSchema = createInsertSchema(faqSections).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertFaqSchema = createInsertSchema(faqs).omit({
  id: true,
  sectionNameEn: true,
  sectionNameFr: true,
  sectionOrder: true,
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

export const insertCtaSettingSchema = createInsertSchema(ctaSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertLegalDocumentSchema = createInsertSchema(legalDocuments).omit({
  id: true,
  createdAt: true,
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

export type HeroTextSetting = typeof heroTextSettings.$inferSelect;
export type InsertHeroTextSetting = z.infer<typeof insertHeroTextSettingSchema>;

export type GalleryItem = typeof galleryItems.$inferSelect;
export type InsertGalleryItem = z.infer<typeof insertGalleryItemSchema>;

export type FaqSection = typeof faqSections.$inferSelect;
export type InsertFaqSection = z.infer<typeof insertFaqSectionSchema>;

export type Faq = typeof faqs.$inferSelect;
export type InsertFaq = z.infer<typeof insertFaqSchema>;

export type SeoSetting = typeof seoSettings.$inferSelect;
export type InsertSeoSetting = z.infer<typeof insertSeoSettingSchema>;

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;

export type CtaSetting = typeof ctaSettings.$inferSelect;
export type InsertCtaSetting = z.infer<typeof insertCtaSettingSchema>;

export type LegalDocument = typeof legalDocuments.$inferSelect;
export type InsertLegalDocument = z.infer<typeof insertLegalDocumentSchema>;

export type DeploymentHistory = typeof deploymentHistory.$inferSelect;
export type InsertDeploymentHistory = z.infer<typeof insertDeploymentHistorySchema>;

// Video Analytics - Visitor Sessions
export const videoAnalyticsSessions = pgTable("video_analytics_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: text("session_id").notNull().unique(), // Generated client-side UUID
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent"),
  country: text("country"), // From IP geolocation
  continent: text("continent"), // From IP geolocation
  city: text("city"), // From IP geolocation
  language: text("language").notNull(), // fr-FR or en-US
  isUniqueVisitor: boolean("is_unique_visitor").default(true), // First time visitor
  isExcluded: boolean("is_excluded").default(false), // Excluded IP (admin, etc.)
  firstVisit: timestamp("first_visit").defaultNow(),
  lastActivity: timestamp("last_activity").defaultNow(),
  totalSessions: integer("total_sessions").default(1), // Number of sessions from this visitor
  createdAt: timestamp("created_at").defaultNow()
});

// Video Analytics - Individual Video Views
export const videoAnalyticsViews = pgTable("video_analytics_views", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: text("session_id").notNull(), // Links to videoAnalyticsSessions
  videoId: text("video_id").notNull(), // Hero video ID or gallery item ID
  videoType: text("video_type").notNull(), // "hero" or "gallery"
  videoTitle: text("video_title"), // Video title for easy reference
  videoDuration: integer("video_duration"), // Total video duration in seconds
  watchTime: integer("watch_time").default(0), // Time watched in seconds
  watchPercentage: doublePrecision("watch_percentage").default(0), // Percentage watched (0-100)
  maxWatchTime: integer("max_watch_time").default(0), // Maximum continuous watch time
  isCompleted: boolean("is_completed").default(false), // Watched >= 90%
  language: text("language").notNull(), // Language of video viewed
  startedAt: timestamp("started_at").defaultNow(),
  lastWatchedAt: timestamp("last_watched_at").defaultNow(),
  viewCount: integer("view_count").default(1), // Number of times this video was viewed in this session
  createdAt: timestamp("created_at").defaultNow()
});

// Video Analytics - Aggregated Statistics (for performance)
export const videoAnalyticsStats = pgTable("video_analytics_stats", {
  id: uuid("id").primaryKey().defaultRandom(),
  videoId: text("video_id").notNull(),
  videoType: text("video_type").notNull(), // "hero" or "gallery"
  language: text("language").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  totalViews: bigint("total_views", { mode: "number" }).default(0),
  uniqueViews: bigint("unique_views", { mode: "number" }).default(0),
  totalWatchTime: bigint("total_watch_time", { mode: "number" }).default(0), // Total seconds watched
  averageWatchTime: doublePrecision("average_watch_time").default(0), // Average seconds watched
  averageWatchPercentage: doublePrecision("average_watch_percentage").default(0), // Average percentage watched
  completionRate: doublePrecision("completion_rate").default(0), // Percentage of views that completed (0-100)
  topCountries: jsonb("top_countries"), // Array of {country: string, views: number}
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Video Analytics - Settings
export const videoAnalyticsSettings = pgTable("video_analytics_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  excludedIps: jsonb("excluded_ips").default([]), // Array of IP addresses to exclude
  completionThreshold: integer("completion_threshold").default(90), // Percentage to consider "completed"
  trackingEnabled: boolean("tracking_enabled").default(true),
  dataRetentionDays: integer("data_retention_days").default(365), // How long to keep analytics data
  lastResetDate: timestamp("last_reset_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Zod schemas for video analytics
export const insertVideoAnalyticsSessionSchema = createInsertSchema(videoAnalyticsSessions).omit({
  id: true,
  createdAt: true
});

export const insertVideoAnalyticsViewSchema = createInsertSchema(videoAnalyticsViews).omit({
  id: true,
  createdAt: true
});

export const insertVideoAnalyticsStatsSchema = createInsertSchema(videoAnalyticsStats).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertVideoAnalyticsSettingsSchema = createInsertSchema(videoAnalyticsSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// TypeScript types for video analytics
export type VideoAnalyticsSession = typeof videoAnalyticsSessions.$inferSelect;
export type InsertVideoAnalyticsSession = z.infer<typeof insertVideoAnalyticsSessionSchema>;

export type VideoAnalyticsView = typeof videoAnalyticsViews.$inferSelect;
export type InsertVideoAnalyticsView = z.infer<typeof insertVideoAnalyticsViewSchema>;

export type VideoAnalyticsStats = typeof videoAnalyticsStats.$inferSelect;
export type InsertVideoAnalyticsStats = z.infer<typeof insertVideoAnalyticsStatsSchema>;

export type VideoAnalyticsSettings = typeof videoAnalyticsSettings.$inferSelect;
export type InsertVideoAnalyticsSettings = z.infer<typeof insertVideoAnalyticsSettingsSchema>;
