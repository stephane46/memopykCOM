import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { 
  users, heroVideos, galleryItems, faqSections, faqs, seoSettings, contacts, ctaSettings, legalDocuments, deploymentHistory,
  videoAnalyticsSessions, videoAnalyticsViews, videoAnalyticsStats, videoAnalyticsSettings,
  type User, type InsertUser,
  type HeroVideo, type InsertHeroVideo,
  type HeroTextSetting, type InsertHeroTextSetting,
  type GalleryItem, type InsertGalleryItem,
  type FaqSection, type InsertFaqSection,
  type Faq, type InsertFaq,
  type SeoSetting, type InsertSeoSetting,
  type Contact, type InsertContact,
  type CtaSetting, type InsertCtaSetting,
  type LegalDocument, type InsertLegalDocument,
  type DeploymentHistory, type InsertDeploymentHistory,
  type VideoAnalyticsSession, type InsertVideoAnalyticsSession,
  type VideoAnalyticsView, type InsertVideoAnalyticsView,
  type VideoAnalyticsStats, type InsertVideoAnalyticsStats,
  type VideoAnalyticsSettings, type InsertVideoAnalyticsSettings
} from "@shared/schema";
import { eq, asc, desc } from "drizzle-orm";
import { createDatabaseTunnel } from "./ssh-tunnel";

// SSH Tunnel setup
let tunnel: any = null;
let pool: any = null;
let db: any = null;

async function initializeDatabase() {
  // Always use direct connection in production, only use SSH tunnel in development
  if (process.env.NODE_ENV === 'production') {
    console.log("🔄 Production mode: Using direct database connection...");
    
    // Validate DATABASE_PASSWORD is available and is a string
    const dbPassword = process.env.DATABASE_PASSWORD;
    if (!dbPassword || typeof dbPassword !== 'string') {
      throw new Error("DATABASE_PASSWORD environment variable is required and must be a string");
    }
    console.log("✅ DATABASE_PASSWORD validated as string");
    
    // Construct connection string with DATABASE_PASSWORD
    const baseUrl = process.env.DATABASE_URL;
    const password = process.env.DATABASE_PASSWORD;
    
    if (!baseUrl || !password) {
      throw new Error("DATABASE_URL and DATABASE_PASSWORD environment variables are required");
    }
    
    // Build proper connection string with password
    const connectionString = `postgresql://postgres:${password}@supabase.memopyk.org:5432/postgres`;
    console.log("🔗 Using connection string with proper password injection");

    pool = new Pool({
      connectionString,
      ssl: false,
      connectionTimeoutMillis: 10000,
      max: 10,
      idleTimeoutMillis: 30000,
    });

    db = drizzle(pool);
    
    try {
      const client = await pool.connect();
      console.log("✅ Database connected successfully (production direct connection)");
      client.release();
      return true;
    } catch (err) {
      console.error("⚠️ Production database connection failed, will retry on first request:", err.message);
      // Don't throw error in production - let server start and retry on first request
      return false;
    }
  }
  
  try {
    console.log("🔄 Attempting SSH tunnel connection...");
    // Create SSH tunnel
    tunnel = createDatabaseTunnel();
    await tunnel.connect();
    
    // Use tunneled connection
    const tunnelConnectionString = process.env.DATABASE_URL?.replace(
      'supabase.memopyk.org:5432',
      'localhost:15432'
    );
    
    if (!tunnelConnectionString) {
      throw new Error("DATABASE_URL environment variable is required");
    }

    pool = new Pool({
      connectionString: tunnelConnectionString,
      ssl: false
    });

    db = drizzle(pool);

    // Test connection with timeout
    const client = await pool.connect();
    console.log("✅ Database connected successfully through SSH tunnel");
    client.release();
    
  } catch (err) {
    console.log("🔄 SSH tunnel failed, trying direct connection...");
    console.log("Tunnel error:", err.message);
    
    // Fallback to direct connection (for when port 5432 is exposed)
    const password = process.env.DATABASE_PASSWORD;
    if (!password) {
      throw new Error("DATABASE_PASSWORD environment variable is required");
    }
    
    // Use correct postgres user with DATABASE_PASSWORD
    const connectionString = `postgresql://postgres:${password}@supabase.memopyk.org:5432/postgres`;

    pool = new Pool({
      connectionString,
      ssl: false,
      connectionTimeoutMillis: 5000, // 5 second timeout
    });

    db = drizzle(pool);
    
    try {
      console.log("🔄 Testing direct database connection...");
      const client = await pool.connect();
      console.log("✅ Database connected successfully (direct connection)");
      client.release();
    } catch (directErr) {
      console.log("❌ Direct database connection also failed:", directErr.message);
      
      // Try Supabase REST API as fallback (works without port 5432)
      console.log("🔄 Trying Supabase REST API for external environment...");
      try {
        const { createSupabaseStorage } = await import('./supabase-storage');
        const supabaseStorage = await createSupabaseStorage();
        
        if (supabaseStorage) {
          console.log("✅ Supabase REST API connection successful");
          // Store supabase storage globally for storage methods
          global.supabaseStorage = supabaseStorage;
          return;
        } else {
          console.log("❌ Supabase REST API connection failed");
        }
      } catch (supabaseErr) {
        console.log("❌ Supabase REST API initialization failed:", supabaseErr.message);
      }
      
      console.log("🔧 Please expose port 5432 in Coolify for your Supabase service");
      
      // Keep the tunnel active for when port becomes available
      if (tunnel && tunnel.isActive()) {
        console.log("SSH tunnel remains active, waiting for port 5432 exposure...");
      }
    }
  }
}

// Initialize database connection using IIFE to handle ESM module constraints
// In production, don't block server startup on database connection
(async () => {
  try {
    await initializeDatabase();
  } catch (error) {
    console.error("⚠️ Database initialization failed, server will start anyway:", error.message);
    if (process.env.NODE_ENV === 'production') {
      console.log("🚀 Server will start without database - endpoints will retry connection");
    }
  }
})();

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Hero Videos
  getHeroVideos(): Promise<HeroVideo[]>;
  getHeroVideo(id: string): Promise<HeroVideo | undefined>;
  createHeroVideo(video: InsertHeroVideo): Promise<HeroVideo>;
  updateHeroVideo(id: string, video: Partial<InsertHeroVideo>): Promise<HeroVideo | undefined>;
  deleteHeroVideo(id: string): Promise<boolean>;

  // Gallery Items
  getGalleryItems(): Promise<GalleryItem[]>;
  getGalleryItem(id: string): Promise<GalleryItem | undefined>;
  createGalleryItem(item: InsertGalleryItem): Promise<GalleryItem>;
  updateGalleryItem(id: string, item: Partial<InsertGalleryItem>): Promise<GalleryItem | undefined>;
  deleteGalleryItem(id: string): Promise<boolean>;

  // FAQ Sections
  getFaqSections(): Promise<FaqSection[]>;
  getFaqSection(id: string): Promise<FaqSection | undefined>;
  createFaqSection(section: InsertFaqSection): Promise<FaqSection>;
  updateFaqSection(id: string, section: Partial<InsertFaqSection>): Promise<FaqSection | undefined>;
  deleteFaqSection(id: string): Promise<boolean>;

  // FAQs
  getFaqs(): Promise<Faq[]>;
  getFaq(id: string): Promise<Faq | undefined>;
  createFaq(faq: InsertFaq): Promise<Faq>;
  updateFaq(id: string, faq: Partial<InsertFaq>): Promise<Faq | undefined>;
  deleteFaq(id: string): Promise<boolean>;

  // SEO Settings
  getSeoSettings(): Promise<SeoSetting[]>;
  getSeoSetting(id: string): Promise<SeoSetting | undefined>;
  createSeoSetting(setting: InsertSeoSetting): Promise<SeoSetting>;
  updateSeoSetting(id: string, setting: Partial<InsertSeoSetting>): Promise<SeoSetting | undefined>;
  deleteSeoSetting(id: string): Promise<boolean>;

  // Contacts
  getContacts(): Promise<Contact[]>;
  getContact(id: string): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: string): Promise<boolean>;

  // Legal Documents
  getLegalDocuments(): Promise<LegalDocument[]>;
  getLegalDocument(id: string): Promise<LegalDocument | undefined>;
  createLegalDocument(document: InsertLegalDocument): Promise<LegalDocument>;
  updateLegalDocument(id: string, document: Partial<InsertLegalDocument>): Promise<LegalDocument | undefined>;
  deleteLegalDocument(id: string): Promise<boolean>;

  // Deployment History
  getDeploymentHistory(): Promise<DeploymentHistory[]>;
  getDeploymentHistoryEntry(id: string): Promise<DeploymentHistory | undefined>;
  createDeploymentHistoryEntry(entry: InsertDeploymentHistory): Promise<DeploymentHistory>;
  updateDeploymentHistoryEntry(id: string, entry: Partial<InsertDeploymentHistory>): Promise<DeploymentHistory | undefined>;

  // Video Analytics - Sessions
  createOrUpdateAnalyticsSession(session: InsertVideoAnalyticsSession): Promise<VideoAnalyticsSession>;
  getAnalyticsSession(sessionId: string): Promise<VideoAnalyticsSession | undefined>;
  getAnalyticsSessions(filters?: {
    dateFrom?: string;
    dateTo?: string;
    excludeAdmin?: boolean;
    country?: string;
    language?: string;
  }): Promise<VideoAnalyticsSession[]>;

  // Video Analytics - Views
  recordVideoView(view: InsertVideoAnalyticsView): Promise<VideoAnalyticsView>;
  updateVideoView(id: string, view: Partial<InsertVideoAnalyticsView>): Promise<VideoAnalyticsView | undefined>;
  getVideoViews(filters?: {
    videoId?: string;
    videoType?: string;
    dateFrom?: string;
    dateTo?: string;
    language?: string;
  }): Promise<VideoAnalyticsView[]>;

  // Video Analytics - Statistics
  getVideoStats(filters?: {
    videoId?: string;
    videoType?: string;
    dateFrom?: string;
    dateTo?: string;
    language?: string;
  }): Promise<VideoAnalyticsStats[]>;
  updateVideoStats(videoId: string, videoType: string, language: string, date: string): Promise<void>;
  getTopVideos(limit?: number, dateFrom?: string, dateTo?: string): Promise<{
    videoId: string;
    videoType: string;
    totalViews: number;
    uniqueViews: number;
    averageWatchTime: number;
    completionRate: number;
  }[]>;

  // Video Analytics - Settings & Management
  getAnalyticsSettings(): Promise<VideoAnalyticsSettings | undefined>;
  updateAnalyticsSettings(settings: Partial<InsertVideoAnalyticsSettings>): Promise<VideoAnalyticsSettings>;
  resetAnalytics(resetType: 'all' | 'views' | 'sessions'): Promise<boolean>;
  getAnalyticsSummary(dateFrom?: string, dateTo?: string): Promise<{
    totalViews: number;
    uniqueVisitors: number;
    totalWatchTime: number;
    averageSessionDuration: number;
    topCountries: { country: string; views: number; }[];
    languageBreakdown: { language: string; views: number; }[];
    videoPerformance: { videoId: string; title: string; views: number; completionRate: number; }[];
  }>;
}

function getDb() {
  if (!db) {
    // In production, try to reinitialize database if not connected
    if (process.env.NODE_ENV === 'production') {
      console.log("🔄 Database not connected, attempting to reconnect...");
      initializeDatabase().catch(err => console.error("Database reconnection failed:", err.message));
    }
    return null; // Return null instead of throwing for fallback handling
  }
  return db;
}

// File-based storage functions
function loadVideosFromFile(): HeroVideo[] {
  try {
    const videoStorageFile = path.join(process.cwd(), 'server', 'video-storage.json');
    if (fs.existsSync(videoStorageFile)) {
      const data = fs.readFileSync(videoStorageFile, 'utf-8');
      const videos = JSON.parse(data);
      console.log(`📁 Loaded ${videos.length} videos from file storage`);
      return videos;
    }
  } catch (error) {
    console.error('Error loading videos from file:', error);
  }
  return [];
}

function saveVideosToFile(videos: HeroVideo[]): void {
  try {
    const videoStorageFile = path.join(process.cwd(), 'server', 'video-storage.json');
    fs.writeFileSync(videoStorageFile, JSON.stringify(videos, null, 2));
    console.log(`💾 Saved ${videos.length} videos to file storage`);
  } catch (error) {
    console.error('Error saving videos to file:', error);
  }
}

// Load videos from file on startup
let fileHeroVideos: HeroVideo[] = loadVideosFromFile();

// Function to fix existing video URLs in preview mode
export function fixExistingVideoUrls() {
  previewHeroVideos.forEach((video, index) => {
    if (video.urlFr.includes('supabase.memopyk.org:8001/object/public/memopyk-hero/')) {
      const filename = video.urlFr.split('/').pop();
      const newUrlFr = `/api/video-proxy/memopyk-hero/${filename}`;
      const newUrlEn = `/api/video-proxy/memopyk-hero/${filename}`;
      
      previewHeroVideos[index] = {
        ...video,
        urlFr: newUrlFr,
        urlEn: newUrlEn
      };
      
      console.log(`🔧 Fixed video URL for ${video.titleFr}: ${video.urlFr} -> ${newUrlFr}`);
    }
  });
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const result = await getDb().select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await getDb().select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await getDb().insert(users).values(user).returning();
    return result[0];
  }

  // Hero Videos
  async getHeroVideos(): Promise<HeroVideo[]> {
    const database = getDb();
    
    // Always try to load from file storage first
    fileHeroVideos = loadVideosFromFile();
    if (fileHeroVideos.length > 0) {
      console.log(`🎬 Serving ${fileHeroVideos.length} videos from file storage`);
      return fileHeroVideos.filter(video => video.isActive).sort((a, b) => a.orderIndex - b.orderIndex);
    }
    
    // Fallback for when database is not available (will be used later)
    if (!database) {
      console.log("🔄 Using working demo videos for testing");
      return [
        {
          id: "1",
          titleFr: "Film Mémoire Professionnel",
          titleEn: "Professional Memory Film",
          urlFr: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          urlEn: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          fallbackImageUrl: "/hero-fallback.jpg",
          orderIndex: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: "2", 
          titleFr: "Souvenirs de Famille",
          titleEn: "Family Memories",
          urlFr: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
          urlEn: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
          fallbackImageUrl: "/hero-fallback.jpg", 
          orderIndex: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
    }
    
    try {
      const dbVideos = await database.select().from(heroVideos).orderBy(asc(heroVideos.orderIndex));
      if (dbVideos && dbVideos.length > 0) {
        return dbVideos;
      }
      // No videos in database, use working demo videos as fallback
      console.log("🎬 No videos in database, using demo videos");
      return [
        {
          id: "1",
          titleFr: "Film Mémoire Professionnel",
          titleEn: "Professional Memory Film",
          urlFr: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          urlEn: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          fallbackImageUrl: "/hero-fallback.jpg",
          orderIndex: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: "2", 
          titleFr: "Souvenirs de Famille",
          titleEn: "Family Memories",
          urlFr: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
          urlEn: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
          fallbackImageUrl: "/hero-fallback.jpg", 
          orderIndex: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
    } catch (error) {
      console.error("Database query failed, using working demo videos:", error);
      // Return working Google demo videos as fallback
      return [
        {
          id: "1",
          titleFr: "Film Mémoire Professionnel",
          titleEn: "Professional Memory Film",
          urlFr: "https://supabase.memopyk.org/storage/v1/object/public/memopyk-hero/hero-video-1.mp4",
          urlEn: "https://supabase.memopyk.org/storage/v1/object/public/memopyk-hero/hero-video-1.mp4",
          fallbackImageUrl: "/hero-fallback.jpg",
          orderIndex: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: "2", 
          titleFr: "Souvenirs de Famille",
          titleEn: "Family Memories",
          urlFr: "https://supabase.memopyk.org/storage/v1/object/public/memopyk-hero/hero-video-2.mp4",
          urlEn: "https://supabase.memopyk.org/storage/v1/object/public/memopyk-hero/hero-video-2.mp4",
          fallbackImageUrl: "/hero-fallback.jpg", 
          orderIndex: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: "3", 
          titleFr: "Moments Précieux",
          titleEn: "Precious Moments",
          urlFr: "https://supabase.memopyk.org/storage/v1/object/public/memopyk-hero/hero-video-3.mp4",
          urlEn: "https://supabase.memopyk.org/storage/v1/object/public/memopyk-hero/hero-video-3.mp4",
          fallbackImageUrl: "/hero-fallback.jpg", 
          orderIndex: 2,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: "4", 
          titleFr: "Célébrations Spéciales",
          titleEn: "Special Celebrations",
          urlFr: "https://supabase.memopyk.org/storage/v1/object/public/memopyk-hero/hero-video-4.mp4",
          urlEn: "https://supabase.memopyk.org/storage/v1/object/public/memopyk-hero/hero-video-4.mp4",
          fallbackImageUrl: "/hero-fallback.jpg", 
          orderIndex: 3,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
    }
  }

  async getHeroVideo(id: string): Promise<HeroVideo | undefined> {
    const result = await getDb().select().from(heroVideos).where(eq(heroVideos.id, id)).limit(1);
    return result[0];
  }

  async createHeroVideo(video: InsertHeroVideo): Promise<HeroVideo> {
    const database = getDb();
    
    // Helper function to convert direct Supabase URLs to proxy URLs
    const convertToProxyUrl = (url: string): string => {
      if (url.includes('supabase.memopyk.org:8001/object/public/memopyk-hero/')) {
        // Extract filename from the URL
        const filename = url.split('/').pop();
        return `/api/video-proxy/memopyk-hero/${filename}`;
      }
      return url;
    };
    
    // Convert URLs to proxy format
    const proxyUrlFr = convertToProxyUrl(video.urlFr);
    const proxyUrlEn = convertToProxyUrl(video.urlEn);
    
    const newVideo = {
      id: Date.now().toString(),
      titleFr: video.titleFr,
      titleEn: video.titleEn,
      urlFr: proxyUrlFr,
      urlEn: proxyUrlEn,
      fallbackImageUrl: video.fallbackImageUrl || "/hero-fallback.jpg",
      orderIndex: video.orderIndex || fileHeroVideos.length,
      isActive: video.isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Always save to file storage first
    fileHeroVideos.push(newVideo);
    saveVideosToFile(fileHeroVideos);
    console.log(`🎬 Hero video saved to file storage: ${newVideo.titleFr} (total: ${fileHeroVideos.length})`);
    console.log(`🎬 Converted URL: ${video.urlFr} -> ${proxyUrlFr}`);
    
    // Try database insert if available
    if (database) {
      try {
        const videoWithProxyUrls = {
          ...video,
          urlFr: proxyUrlFr,
          urlEn: proxyUrlEn
        };
        await database.insert(heroVideos).values(videoWithProxyUrls);
        console.log(`✅ Hero video also saved to database: ${newVideo.titleFr}`);
      } catch (error) {
        console.log(`📁 Database unavailable, video saved to file only: ${error.message}`);
      }
    }
    
    return newVideo;
  }

  async updateHeroVideo(id: string, video: Partial<InsertHeroVideo>): Promise<HeroVideo | undefined> {
    // Update in file storage first
    const videoIndex = fileHeroVideos.findIndex(v => v.id === id);
    if (videoIndex !== -1) {
      fileHeroVideos[videoIndex] = {
        ...fileHeroVideos[videoIndex],
        ...video,
        updatedAt: new Date()
      };
      saveVideosToFile(fileHeroVideos);
      console.log(`🎬 Hero video updated in file storage: ${fileHeroVideos[videoIndex].titleFr}`);
      
      // Try database update if available
      const database = getDb();
      if (database) {
        try {
          await database.update(heroVideos)
            .set({ ...video, updatedAt: new Date() })
            .where(eq(heroVideos.id, id));
          console.log(`✅ Hero video also updated in database: ${fileHeroVideos[videoIndex].titleFr}`);
        } catch (error) {
          console.log(`📁 Database unavailable, video updated in file only: ${error.message}`);
        }
      }
      
      return fileHeroVideos[videoIndex];
    }
    
    return undefined;
  }

  async deleteHeroVideo(id: string): Promise<boolean> {
    // Delete from file storage first
    const videoIndex = fileHeroVideos.findIndex(v => v.id === id);
    if (videoIndex !== -1) {
      fileHeroVideos.splice(videoIndex, 1);
      // Reorder indices after deletion
      fileHeroVideos.forEach((video, index) => {
        video.orderIndex = index;
      });
      saveVideosToFile(fileHeroVideos);
      console.log(`🎬 Hero video deleted from file storage and indices reordered`);
      
      // Try database delete if available
      const database = getDb();
      if (database) {
        try {
          await database.delete(heroVideos).where(eq(heroVideos.id, id));
          console.log(`✅ Hero video also deleted from database`);
        } catch (error) {
          console.log(`📁 Database unavailable, video deleted from file only: ${error.message}`);
        }
      }
      
      return true;
    }
    
    return false;
  }

  async reorderHeroVideo(id: string, direction: 'up' | 'down'): Promise<boolean> {
    const videoIndex = fileHeroVideos.findIndex(v => v.id === id);
    if (videoIndex === -1) {
      return false;
    }

    const newIndex = direction === 'up' ? videoIndex - 1 : videoIndex + 1;
    
    // Check bounds
    if (newIndex < 0 || newIndex >= fileHeroVideos.length) {
      return false;
    }

    // Swap videos
    const temp = fileHeroVideos[videoIndex];
    fileHeroVideos[videoIndex] = fileHeroVideos[newIndex];
    fileHeroVideos[newIndex] = temp;

    // Update order indices
    fileHeroVideos[videoIndex].orderIndex = videoIndex;
    fileHeroVideos[newIndex].orderIndex = newIndex;
    fileHeroVideos[videoIndex].updatedAt = new Date();
    fileHeroVideos[newIndex].updatedAt = new Date();

    // Save to file
    saveVideosToFile(fileHeroVideos);
    console.log(`🎬 Hero video reordered: ${temp.titleFr} moved ${direction}`);

    // Try database update if available
    const database = getDb();
    if (database) {
      try {
        await database.update(heroVideos)
          .set({ orderIndex: videoIndex, updatedAt: new Date() })
          .where(eq(heroVideos.id, fileHeroVideos[videoIndex].id));
        await database.update(heroVideos)
          .set({ orderIndex: newIndex, updatedAt: new Date() })
          .where(eq(heroVideos.id, fileHeroVideos[newIndex].id));
        console.log(`✅ Hero video order also updated in database`);
      } catch (error) {
        console.log(`📁 Database unavailable, video reordered in file only: ${error.message}`);
      }
    }

    return true;
  }

  // Hero Text Settings (File-only storage for performance)
  async getHeroTextSettings(): Promise<HeroTextSetting[]> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'server', 'hero-text-storage.json');
      const fileData = await fs.readFile(filePath, 'utf-8');
      const heroTexts = JSON.parse(fileData);
      return heroTexts.map((text: any) => ({
        ...text,
        createdAt: new Date(text.createdAt),
        updatedAt: new Date(text.updatedAt)
      }));
    } catch (fileError) {
      // Return default text if file doesn't exist
      return [{
        id: "default-text",
        titleFr: "Transformez vos souvenirs en films cinématographiques",
        titleEn: "Transform your memories into cinematic films",
        fontSize: 60,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }];
    }
  }

  async getActiveHeroTextSetting(): Promise<HeroTextSetting | undefined> {
    const settings = await this.getHeroTextSettings();
    return settings.find(setting => setting.isActive) || settings[0]; // Return active setting or first as fallback
  }

  async createHeroTextSetting(setting: InsertHeroTextSetting): Promise<HeroTextSetting> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'server', 'hero-text-storage.json');
      
      let heroTexts;
      try {
        const fileData = await fs.readFile(filePath, 'utf-8');
        heroTexts = JSON.parse(fileData);
      } catch {
        heroTexts = [];
      }
      
      // Generate unique ID
      const newText = {
        id: `hero-text-${Date.now()}`,
        ...setting,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      heroTexts.push(newText);
      await fs.writeFile(filePath, JSON.stringify(heroTexts, null, 2));
      console.log('📁 Created new hero text in file storage');
      
      return {
        ...newText,
        createdAt: new Date(newText.createdAt),
        updatedAt: new Date(newText.updatedAt)
      };
    } catch (error) {
      console.error('Error creating hero text in file storage:', error);
      throw new Error('Failed to create hero text setting');
    }
  }

  async updateHeroTextSetting(id: string, setting: Partial<InsertHeroTextSetting>): Promise<HeroTextSetting | undefined> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'server', 'hero-text-storage.json');
      
      let heroTexts;
      try {
        const fileData = await fs.readFile(filePath, 'utf-8');
        heroTexts = JSON.parse(fileData);
      } catch {
        heroTexts = [{
          id: "default-text",
          titleFr: "Transformez vos souvenirs en films cinématographiques",
          titleEn: "Transform your memories into cinematic films",
          fontSize: 60,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }];
      }
      
      const index = heroTexts.findIndex((text: any) => text.id === id);
      if (index !== -1) {
        heroTexts[index] = {
          ...heroTexts[index],
          ...setting,
          updatedAt: new Date().toISOString()
        };
        await fs.writeFile(filePath, JSON.stringify(heroTexts, null, 2));
        console.log('📁 Updated hero text settings in file storage');
        
        const updatedText = {
          ...heroTexts[index],
          createdAt: new Date(heroTexts[index].createdAt),
          updatedAt: new Date(heroTexts[index].updatedAt)
        };
        console.log('📁 Returning updated hero text:', updatedText);
        return updatedText;
      } else {
        // If not found, create new entry (should not happen with default-text)
        console.log(`Hero text with id ${id} not found, creating new entry`);
        const newText = {
          id,
          titleFr: "Transformez vos souvenirs en films cinématographiques",
          titleEn: "Transform your memories into cinematic films",
          fontSize: 60,
          isActive: true,
          ...setting,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        heroTexts.push(newText);
        await fs.writeFile(filePath, JSON.stringify(heroTexts, null, 2));
        console.log('📁 Created new hero text settings in file storage');
        
        const createdText = {
          ...newText,
          createdAt: new Date(newText.createdAt),
          updatedAt: new Date(newText.updatedAt)
        };
        console.log('📁 Returning created hero text:', createdText);
        return createdText;
      }
    } catch (error) {
      console.error('File storage update failed:', error);
      throw new Error("Hero text update failed");
    }
    
    // This should never be reached, but just in case
    throw new Error("Hero text update failed - unexpected error");
  }

  async deleteHeroTextSetting(id: string): Promise<boolean> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'server', 'hero-text-storage.json');
      
      let heroTexts;
      try {
        const fileData = await fs.readFile(filePath, 'utf-8');
        heroTexts = JSON.parse(fileData);
      } catch {
        return false; // File doesn't exist or is empty
      }
      
      const initialLength = heroTexts.length;
      heroTexts = heroTexts.filter((text: any) => text.id !== id);
      
      if (heroTexts.length < initialLength) {
        await fs.writeFile(filePath, JSON.stringify(heroTexts, null, 2));
        console.log('📁 Deleted hero text from file storage');
        return true;
      }
      
      return false; // Text with ID not found
    } catch (error) {
      console.error('Error deleting hero text from file storage:', error);
      return false;
    }
  }

  // Gallery Items
  async getGalleryItems(): Promise<GalleryItem[]> {
    // First try to read from file storage (like hero videos)
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const storageFile = path.join(process.cwd(), 'server', 'gallery-storage.json');
      console.log("📁 GALLERY DEBUG: Trying to read from:", storageFile);
      
      try {
        const fileContent = await fs.readFile(storageFile, 'utf-8');
        const fileItems = JSON.parse(fileContent);
        console.log(`📁 GALLERY DEBUG: Found ${fileItems?.length || 0} items in file`);
        if (fileItems && fileItems.length > 0) {
          console.log("📁 Loading gallery items from file storage");
          return fileItems;
        }
        console.log("📁 GALLERY DEBUG: File exists but has 0 items, trying database");
      } catch (fileError) {
        console.log("📁 GALLERY DEBUG: File read error:", fileError.message);
        console.log("📁 No gallery file storage found, trying database");
      }
    } catch (error) {
      console.log("📁 GALLERY DEBUG: System error:", error.message);
      console.log("📁 File system error, trying database");
    }

    const database = getDb();
    
    // Fallback for when database is not available
    if (!database) {
      console.log("📁 Database not available, returning empty gallery");
      return [];
    }
    
    try {
      const dbItems = await database.select().from(galleryItems).orderBy(asc(galleryItems.orderIndex));
      if (dbItems && dbItems.length > 0) {
        return dbItems;
      }
      // No items in database, return empty array
      console.log("📁 No gallery items in database, returning empty gallery");
      return [];
    } catch (error) {
      console.error("Error fetching gallery items:", error);
      console.log("📁 Database error, returning empty gallery");
      return [];
    }
  }

  async getGalleryItemsFromFile(): Promise<GalleryItem[]> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const storageFile = path.join(process.cwd(), 'server', 'gallery-storage.json');
      
      try {
        const fileContent = await fs.readFile(storageFile, 'utf-8');
        const items = JSON.parse(fileContent);
        return items || [];
      } catch (fileError) {
        console.log("📁 No gallery file storage found, returning empty");
        return [];
      }
    } catch (error) {
      console.error("📁 File system error:", error);
      return [];
    }
  }

  async getGalleryItem(id: string): Promise<GalleryItem | undefined> {
    try {
      const result = await getDb().select().from(galleryItems).where(eq(galleryItems.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching gallery item:", error);
      console.log("📁 Loading gallery item from file storage");
      return await this.getGalleryItemFromFile(id);
    }
  }

  private async getGalleryItemFromFile(id: string): Promise<GalleryItem | undefined> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const storageFile = path.join(process.cwd(), 'server', 'gallery-storage.json');
      
      const fileContent = await fs.readFile(storageFile, 'utf-8');
      const items: GalleryItem[] = JSON.parse(fileContent) || [];
      return items.find(item => item.id === id);
    } catch (error) {
      console.log("📁 No gallery file storage found for item", id);
      return undefined;
    }
  }

  async createGalleryItem(item: InsertGalleryItem): Promise<GalleryItem> {
    try {
      // Try database first
      const result = await getDb().insert(galleryItems).values(item).returning();
      return result[0];
    } catch (error) {
      // Fall back to file storage
      console.log("📁 Creating gallery item in file storage");
      return await this.saveGalleryItemToFile(item);
    }
  }

  async updateGalleryItem(id: string, item: Partial<InsertGalleryItem>): Promise<GalleryItem | undefined> {
    try {
      const database = getDb();
      
      if (!database) {
        // Fall back to file storage immediately if no database
        console.log("📁 Database not available, updating gallery item in file storage");
        return await this.updateGalleryItemInFile(id, item);
      }
      
      // Try database first
      const result = await database.update(galleryItems)
        .set({ ...item, updatedAt: new Date() })
        .where(eq(galleryItems.id, id))
        .returning();
      return result[0];
    } catch (error) {
      // Fall back to file storage
      console.error("❌ Database update failed, falling back to file storage:", error.message);
      return await this.updateGalleryItemInFile(id, item);
    }
  }

  async deleteGalleryItem(id: string): Promise<boolean> {
    const database = getDb();
    
    if (!database) {
      // Fall back to file storage immediately if no database
      console.log("📁 Database not available, deleting gallery item from file storage");
      return await this.deleteGalleryItemFromFile(id);
    }
    
    try {
      // Try database first
      const result = await database.delete(galleryItems).where(eq(galleryItems.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      // Fall back to file storage
      console.error("❌ Database delete failed, falling back to file storage:", error.message);
      return await this.deleteGalleryItemFromFile(id);
    }
  }

  async reorderGalleryItem(id: string, direction: 'up' | 'down'): Promise<boolean> {
    const database = getDb();
    
    if (!database) {
      // Fall back to file storage immediately if no database
      console.log("📁 Database not available, reordering gallery item in file storage");
      return await this.reorderGalleryItemInFile(id, direction);
    }
    
    try {
      // Try database first
      const items = await database.select().from(galleryItems).orderBy(galleryItems.orderIndex);
      const itemIndex = items.findIndex(item => item.id === id);
      
      if (itemIndex === -1) return false;
      
      const newIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
      if (newIndex < 0 || newIndex >= items.length) return false;
      
      // Swap order indices
      const item1 = items[itemIndex];
      const item2 = items[newIndex];
      
      await database.update(galleryItems)
        .set({ orderIndex: item2.orderIndex })
        .where(eq(galleryItems.id, item1.id));
      
      await database.update(galleryItems)
        .set({ orderIndex: item1.orderIndex })
        .where(eq(galleryItems.id, item2.id));
      
      return true;
    } catch (error) {
      // Fall back to file storage
      console.error("❌ Database reorder failed, falling back to file storage:", error.message);
      return await this.reorderGalleryItemInFile(id, direction);
    }
  }

  private async saveGalleryItemToFile(item: InsertGalleryItem): Promise<GalleryItem> {
    const fs = await import('fs/promises');
    const path = await import('path');
    const storageFile = path.join(process.cwd(), 'server', 'gallery-storage.json');
    
    // Read existing items
    let existingItems: GalleryItem[] = [];
    try {
      const fileContent = await fs.readFile(storageFile, 'utf-8');
      existingItems = JSON.parse(fileContent) || [];
    } catch (error) {
      // File doesn't exist, start with empty array
      existingItems = [];
    }
    
    const newItem: GalleryItem = {
      id: item.id || Date.now().toString(),
      titleFr: item.titleFr || "",
      titleEn: item.titleEn || "",
      descriptionFr: item.descriptionFr || "",
      descriptionEn: item.descriptionEn || "",
      imageUrlFr: item.imageUrlFr || "",
      imageUrlEn: item.imageUrlEn || "",
      videoUrlFr: item.videoUrlFr || "",
      videoUrlEn: item.videoUrlEn || "",
      priceFr: item.priceFr || "",
      priceEn: item.priceEn || "",
      orderIndex: item.orderIndex || 0,
      isActive: item.isActive !== undefined ? item.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add to existing items
    existingItems.push(newItem);
    
    // Save back to file
    await fs.writeFile(storageFile, JSON.stringify(existingItems, null, 2));
    
    return newItem;
  }

  private async updateGalleryItemInFile(id: string, item: Partial<InsertGalleryItem>): Promise<GalleryItem | undefined> {
    const fs = await import('fs/promises');
    const path = await import('path');
    const storageFile = path.join(process.cwd(), 'server', 'gallery-storage.json');
    
    try {
      const fileContent = await fs.readFile(storageFile, 'utf-8');
      const existingItems: GalleryItem[] = JSON.parse(fileContent) || [];
      
      const itemIndex = existingItems.findIndex(i => i.id === id);
      if (itemIndex === -1) {
        return undefined;
      }
      
      const updatedItem: GalleryItem = {
        ...existingItems[itemIndex],
        ...item,
        updatedAt: new Date()
      };
      
      existingItems[itemIndex] = updatedItem;
      
      // Save back to file
      await fs.writeFile(storageFile, JSON.stringify(existingItems, null, 2));
      
      return updatedItem;
    } catch (error) {
      console.error("❌ Error updating gallery item in file:", error);
      return undefined;
    }
  }

  private async deleteGalleryItemFromFile(id: string): Promise<boolean> {
    const fs = await import('fs/promises');
    const path = await import('path');
    const storageFile = path.join(process.cwd(), 'server', 'gallery-storage.json');
    
    try {
      const fileContent = await fs.readFile(storageFile, 'utf-8');
      const existingItems: GalleryItem[] = JSON.parse(fileContent) || [];
      
      const itemIndex = existingItems.findIndex(i => i.id === id);
      if (itemIndex === -1) {
        return false;
      }
      
      existingItems.splice(itemIndex, 1);
      
      // Save back to file
      await fs.writeFile(storageFile, JSON.stringify(existingItems, null, 2));
      
      return true;
    } catch (error) {
      console.error("❌ Error deleting gallery item from file:", error);
      return false;
    }
  }

  private async reorderGalleryItemInFile(id: string, direction: 'up' | 'down'): Promise<boolean> {
    const fs = await import('fs/promises');
    const path = await import('path');
    const storageFile = path.join(process.cwd(), 'server', 'gallery-storage.json');
    
    try {
      const fileContent = await fs.readFile(storageFile, 'utf-8');
      const existingItems: GalleryItem[] = JSON.parse(fileContent) || [];
      
      // Sort by orderIndex to get current order
      existingItems.sort((a, b) => a.orderIndex - b.orderIndex);
      
      const itemIndex = existingItems.findIndex(i => i.id === id);
      if (itemIndex === -1) {
        return false;
      }
      
      const newIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
      if (newIndex < 0 || newIndex >= existingItems.length) {
        return false;
      }
      
      // Swap the items in the array
      const temp = existingItems[itemIndex];
      existingItems[itemIndex] = existingItems[newIndex];
      existingItems[newIndex] = temp;
      
      // Update order indices to match new positions
      existingItems.forEach((item, index) => {
        item.orderIndex = index;
      });
      
      // Save back to file
      await fs.writeFile(storageFile, JSON.stringify(existingItems, null, 2));
      
      return true;
    } catch (error) {
      console.error("❌ Error reordering gallery item in file:", error);
      return false;
    }
  }

  // FAQ Sections
  async getFaqSections(): Promise<FaqSection[]> {
    try {
      const result = await getDb().select().from(faqSections).orderBy(faqSections.orderIndex);
      return result;
    } catch (error) {
      console.error("Error fetching FAQ sections:", error);
      console.log("📁 Loading FAQ sections from file storage");
      return await this.getFaqSectionsFromFile();
    }
  }

  private async getFaqSectionsFromFile(): Promise<FaqSection[]> {
    const fs = await import('fs/promises');
    const path = await import('path');
    const storageFile = path.join(process.cwd(), 'server', 'faq-sections-storage.json');
    
    try {
      const fileContent = await fs.readFile(storageFile, 'utf-8');
      const storedSections: FaqSection[] = JSON.parse(fileContent) || [];
      console.log(`📁 Loaded ${storedSections.length} FAQ sections from file storage`);
      return storedSections;
    } catch (error) {
      console.log("📁 No FAQ sections file found, returning default sections");
      return this.getDefaultSections();
    }
  }

  private getDefaultSections(): FaqSection[] {
    return [
      {
        id: "general",
        key: "general",
        nameEn: "General Questions",
        nameFr: "Questions Générales",
        orderIndex: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "getting-started",
        key: "getting-started",
        nameEn: "Getting Started",
        nameFr: "Commencer",
        orderIndex: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "pricing",
        key: "pricing",
        nameEn: "Pricing & Packages",
        nameFr: "Tarifs & Packages",
        orderIndex: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "process",
        key: "process",
        nameEn: "Process & Delivery",
        nameFr: "Processus & Livraison",
        orderIndex: 3,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  async getFaqSection(id: string): Promise<FaqSection | undefined> {
    try {
      const result = await getDb().select().from(faqSections).where(eq(faqSections.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching FAQ section:", error);
      const sections = await this.getFaqSectionsFromFile();
      return sections.find(s => s.id === id);
    }
  }

  async createFaqSection(section: InsertFaqSection): Promise<FaqSection> {
    try {
      const result = await getDb().insert(faqSections).values({
        ...section,
        updatedAt: new Date()
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating FAQ section:", error);
      // Save to file as fallback
      const newSection: FaqSection = {
        id: `section-${Date.now()}`,
        ...section,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await this.saveFaqSectionsToFile([newSection]);
      return newSection;
    }
  }

  async updateFaqSection(id: string, section: Partial<InsertFaqSection>): Promise<FaqSection | undefined> {
    try {
      const result = await getDb().update(faqSections)
        .set({ ...section, updatedAt: new Date() })
        .where(eq(faqSections.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating FAQ section:", error);
      // Update in file storage as fallback
      const sections = await this.getFaqSectionsFromFile();
      const sectionIndex = sections.findIndex(s => s.id === id);
      if (sectionIndex >= 0) {
        sections[sectionIndex] = { ...sections[sectionIndex], ...section, updatedAt: new Date() };
        await this.saveFaqSectionsToFile(sections);
        return sections[sectionIndex];
      }
      return undefined;
    }
  }

  async deleteFaqSection(id: string): Promise<boolean> {
    try {
      const result = await getDb().delete(faqSections).where(eq(faqSections.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting FAQ section:", error);
      // Delete from file storage as fallback
      const sections = await this.getFaqSectionsFromFile();
      const filteredSections = sections.filter(s => s.id !== id);
      if (filteredSections.length !== sections.length) {
        await this.saveFaqSectionsToFile(filteredSections);
        return true;
      }
      return false;
    }
  }

  async reorderFaqSection(id: string, direction: 'up' | 'down'): Promise<boolean> {
    try {
      const db = getDb();
      
      // Get all sections ordered by orderIndex
      const allSections = await db.select().from(faqSections).orderBy(faqSections.orderIndex);
      const currentIndex = allSections.findIndex(section => section.id === id);
      
      if (currentIndex === -1) {
        return false;
      }
      
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      if (targetIndex < 0 || targetIndex >= allSections.length) {
        return false; // Can't move beyond bounds
      }
      
      // Swap the orderIndex values
      const currentSection = allSections[currentIndex];
      const targetSection = allSections[targetIndex];
      
      await db.update(faqSections)
        .set({ orderIndex: targetSection.orderIndex, updatedAt: new Date() })
        .where(eq(faqSections.id, currentSection.id));
        
      await db.update(faqSections)
        .set({ orderIndex: currentSection.orderIndex, updatedAt: new Date() })
        .where(eq(faqSections.id, targetSection.id));
      
      return true;
    } catch (error) {
      console.error("Error reordering FAQ section:", error);
      
      // Try with file storage as fallback
      try {
        const sections = await this.getFaqSectionsFromFile();
        const currentIndex = sections.findIndex(section => section.id === id);
        
        if (currentIndex === -1) {
          return false;
        }
        
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        
        if (targetIndex < 0 || targetIndex >= sections.length) {
          return false;
        }
        
        // Swap positions in the array
        const temp = sections[currentIndex];
        sections[currentIndex] = sections[targetIndex];
        sections[targetIndex] = temp;
        
        // Update orderIndex to match new positions
        sections.forEach((section, index) => {
          section.orderIndex = index;
          section.updatedAt = new Date();
        });
        
        await this.saveFaqSectionsToFile(sections);
        return true;
      } catch (fileError) {
        console.error("Error reordering FAQ section in file storage:", fileError);
        return false;
      }
    }
  }

  private async saveFaqSectionsToFile(sections: FaqSection[]): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    const storageFile = path.join(process.cwd(), 'server', 'faq-sections-storage.json');
    
    try {
      await fs.writeFile(storageFile, JSON.stringify(sections, null, 2));
      console.log(`💾 Saved ${sections.length} FAQ sections to file storage`);
    } catch (error) {
      console.error("Error saving FAQ sections to file:", error);
    }
  }

  // FAQs with file fallback
  async getFaqs(): Promise<Faq[]> {
    try {
      // Join FAQs with their sections to get section names and order
      const result = await getDb()
        .select({
          id: faqs.id,
          sectionId: faqs.sectionId,
          section: faqSections.key,
          sectionNameEn: faqSections.nameEn,
          sectionNameFr: faqSections.nameFr,
          sectionOrder: faqSections.orderIndex,
          orderIndex: faqs.orderIndex,
          questionEn: faqs.questionEn,
          questionFr: faqs.questionFr,
          answerEn: faqs.answerEn,
          answerFr: faqs.answerFr,
          isActive: faqs.isActive,
          createdAt: faqs.createdAt,
          updatedAt: faqs.updatedAt
        })
        .from(faqs)
        .leftJoin(faqSections, eq(faqs.sectionId, faqSections.id))
        .orderBy(faqSections.orderIndex, faqs.orderIndex);
      
      return result;
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      console.log("📁 Loading FAQs from file storage");
      return await this.getFaqsFromFile();
    }
  }

  private async getFaqsFromFile(): Promise<Faq[]> {
    const fs = await import('fs/promises');
    const path = await import('path');
    const storageFile = path.join(process.cwd(), 'server', 'faq-storage.json');
    
    try {
      const fileContent = await fs.readFile(storageFile, 'utf-8');
      const storedFaqs: Faq[] = JSON.parse(fileContent) || [];
      console.log(`📁 Loaded ${storedFaqs.length} FAQs from file storage`);
      return storedFaqs;
    } catch (error) {
      console.log("📁 No FAQ file found, returning demo FAQs");
      return this.getDemoFaqs();
    }
  }

  private getDemoFaqs(): Faq[] {
    return [
      {
        id: "demo-1",
        section: "general",
        sectionNameEn: "General Questions",
        sectionNameFr: "Questions Générales",
        sectionOrder: 0,
        orderIndex: 0,
        questionEn: "What is MEMOPYK and what do you offer?",
        questionFr: "Qu'est-ce que MEMOPYK et que proposez-vous ?",
        answerEn: "MEMOPYK is a premium memory film service that transforms your personal photos and videos into professionally crafted cinematic experiences. We specialize in creating emotional visual narratives that preserve your precious memories forever.",
        answerFr: "MEMOPYK est un service premium de films mémoire qui transforme vos photos et vidéos personnelles en expériences cinématographiques professionnelles. Nous nous spécialisons dans la création de récits visuels émotionnels qui préservent vos souvenirs précieux pour toujours.",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "demo-2",
        section: "general",
        sectionNameEn: "General Questions",
        sectionNameFr: "Questions Générales",
        sectionOrder: 0,
        orderIndex: 1,
        questionEn: "How long does the process take?",
        questionFr: "Combien de temps prend le processus ?",
        answerEn: "The typical turnaround time is 2-3 weeks from the moment we receive your content. Rush orders can be accommodated for an additional fee with delivery in 1 week.",
        answerFr: "Le délai habituel est de 2 à 3 semaines à partir du moment où nous recevons votre contenu. Les commandes urgentes peuvent être accommodées moyennant des frais supplémentaires avec livraison en 1 semaine.",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "demo-3",
        section: "pricing",
        sectionNameEn: "Pricing & Packages",
        sectionNameFr: "Tarifs & Forfaits",
        sectionOrder: 1,
        orderIndex: 0,
        questionEn: "What are your pricing options?",
        questionFr: "Quelles sont vos options de tarification ?",
        answerEn: "We offer several packages starting from €299 for a basic 2-minute film, €599 for our premium 5-minute package, and €999 for our luxury 10-minute cinematic experience with advanced editing and effects.",
        answerFr: "Nous proposons plusieurs forfaits à partir de 299€ pour un film de base de 2 minutes, 599€ pour notre forfait premium de 5 minutes, et 999€ pour notre expérience cinématographique de luxe de 10 minutes avec montage et effets avancés.",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "demo-4",
        section: "technical",
        sectionNameEn: "Technical Questions",
        sectionNameFr: "Questions Techniques",
        sectionOrder: 2,
        orderIndex: 0,
        questionEn: "What file formats do you accept?",
        questionFr: "Quels formats de fichiers acceptez-vous ?",
        answerEn: "We accept all major photo formats (JPEG, PNG, TIFF, RAW) and video formats (MP4, MOV, AVI, MKV). We can work with content from smartphones, professional cameras, and even old film footage.",
        answerFr: "Nous acceptons tous les principaux formats de photos (JPEG, PNG, TIFF, RAW) et formats vidéo (MP4, MOV, AVI, MKV). Nous pouvons travailler avec du contenu de smartphones, caméras professionnelles, et même d'anciens films.",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  async getFaq(id: string): Promise<Faq | undefined> {
    try {
      const result = await getDb().select().from(faqs).where(eq(faqs.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching FAQ:", error);
      return undefined;
    }
  }

  async createFaq(faq: InsertFaq): Promise<Faq> {
    try {
      // Get section information first
      const section = await getDb()
        .select()
        .from(faqSections)
        .where(eq(faqSections.id, faq.sectionId))
        .limit(1);
      
      if (section.length === 0) {
        throw new Error(`Section with id ${faq.sectionId} not found`);
      }

      // Auto-assign orderIndex if not provided
      if (faq.orderIndex === undefined || faq.orderIndex === 0) {
        // Find the highest orderIndex in the same section
        const sectionFaqs = await getDb()
          .select()
          .from(faqs)
          .where(eq(faqs.sectionId, faq.sectionId));
        
        const maxOrder = sectionFaqs.reduce((max, f) => Math.max(max, f.orderIndex), -1);
        faq.orderIndex = maxOrder + 1;
      }

      // Prepare FAQ data with section information
      const faqData = {
        sectionId: faq.sectionId,
        sectionNameEn: section[0].nameEn,
        sectionNameFr: section[0].nameFr,
        sectionOrder: section[0].orderIndex || 0,
        orderIndex: faq.orderIndex || 0,
        questionEn: faq.questionEn,
        questionFr: faq.questionFr,
        answerEn: faq.answerEn,
        answerFr: faq.answerFr,
        isActive: faq.isActive ?? true
      };

      const result = await getDb().insert(faqs).values(faqData).returning();
      return result[0];
    } catch (error) {
      console.error("Database FAQ creation failed, using file storage:", error);
      return await this.createFaqInFile(faq);
    }
  }

  private async createFaqInFile(faq: InsertFaq): Promise<Faq> {
    const fs = await import('fs/promises');
    const path = await import('path');
    const storageFile = path.join(process.cwd(), 'server', 'faq-storage.json');
    
    try {
      // Load existing FAQs
      let existingFaqs: Faq[] = [];
      try {
        const fileContent = await fs.readFile(storageFile, 'utf-8');
        existingFaqs = JSON.parse(fileContent) || [];
      } catch (readError) {
        console.log("📁 Creating new FAQ storage file");
        existingFaqs = [];
      }
      
      // Auto-assign orderIndex if not provided
      if (faq.orderIndex === undefined || faq.orderIndex === 0) {
        const sectionFaqs = existingFaqs.filter(f => f.sectionId === faq.sectionId);
        const maxOrder = sectionFaqs.reduce((max, f) => Math.max(max, f.orderIndex), -1);
        faq.orderIndex = maxOrder + 1;
      }

      // Create new FAQ with required fields
      const newFaq: Faq = {
        id: `faq-${Date.now()}`,
        sectionId: faq.sectionId,
        orderIndex: faq.orderIndex,
        questionEn: faq.questionEn,
        questionFr: faq.questionFr,
        answerEn: faq.answerEn,
        answerFr: faq.answerFr,
        isActive: faq.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add to existing FAQs and save
      existingFaqs.push(newFaq);
      await fs.writeFile(storageFile, JSON.stringify(existingFaqs, null, 2));
      console.log(`💾 Saved new FAQ to file storage: ${newFaq.id}`);
      
      return newFaq;
    } catch (error) {
      console.error("Error creating FAQ in file storage:", error);
      throw new Error("Failed to create FAQ");
    }
  }

  async updateFaq(id: string, faq: Partial<InsertFaq>): Promise<Faq | undefined> {
    const result = await getDb().update(faqs)
      .set({ ...faq, updatedAt: new Date() })
      .where(eq(faqs.id, id))
      .returning();
    return result[0];
  }

  async deleteFaq(id: string): Promise<boolean> {
    const result = await getDb().delete(faqs).where(eq(faqs.id, id)).returning();
    return result.length > 0;
  }

  async reorderFaq(id: string, direction: 'up' | 'down'): Promise<boolean> {
    try {
      // Get the FAQ to be moved
      const currentFaq = await getDb().select().from(faqs).where(eq(faqs.id, id)).limit(1);
      if (currentFaq.length === 0) {
        return false;
      }

      const faq = currentFaq[0];
      const currentOrder = faq.orderIndex;
      const sectionId = faq.sectionId;

      // Get all FAQs in the same section, ordered by orderIndex
      const sectionFaqs = await getDb()
        .select()
        .from(faqs)
        .where(eq(faqs.sectionId, sectionId))
        .orderBy(faqs.orderIndex);

      const currentIndex = sectionFaqs.findIndex(f => f.id === id);
      if (currentIndex === -1) return false;

      let swapIndex: number;
      if (direction === 'up') {
        if (currentIndex === 0) return false; // Already at top
        swapIndex = currentIndex - 1;
      } else {
        if (currentIndex === sectionFaqs.length - 1) return false; // Already at bottom
        swapIndex = currentIndex + 1;
      }

      const swapFaq = sectionFaqs[swapIndex];

      // Swap the order indexes
      await getDb().update(faqs)
        .set({ orderIndex: swapFaq.orderIndex })
        .where(eq(faqs.id, id));
      
      await getDb().update(faqs)
        .set({ orderIndex: currentOrder })
        .where(eq(faqs.id, swapFaq.id));

      return true;
    } catch (error) {
      console.error("Error reordering FAQ:", error);
      return false;
    }
  }

  // SEO Settings
  async getSeoSettings(): Promise<SeoSetting[]> {
    try {
      const result = await getDb().select().from(seoSettings);
      return result;
    } catch (error) {
      console.error("Error fetching SEO settings:", error);
      return [];
    }
  }

  async getSeoSetting(id: string): Promise<SeoSetting | undefined> {
    try {
      const result = await getDb().select().from(seoSettings).where(eq(seoSettings.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching SEO setting:", error);
      return undefined;
    }
  }

  async createSeoSetting(setting: InsertSeoSetting): Promise<SeoSetting> {
    const result = await getDb().insert(seoSettings).values(setting).returning();
    return result[0];
  }

  async updateSeoSetting(id: string, setting: Partial<InsertSeoSetting>): Promise<SeoSetting | undefined> {
    const result = await getDb().update(seoSettings)
      .set({ ...setting, updatedAt: new Date() })
      .where(eq(seoSettings.id, id))
      .returning();
    return result[0];
  }

  async deleteSeoSetting(id: string): Promise<boolean> {
    const result = await getDb().delete(seoSettings).where(eq(seoSettings.id, id)).returning();
    return result.length > 0;
  }

  // Contacts
  async getContacts(): Promise<Contact[]> {
    try {
      const result = await getDb().select().from(contacts).orderBy(desc(contacts.createdAt));
      return result;
    } catch (error) {
      console.error("Error fetching contacts:", error);
      return [];
    }
  }

  async getContact(id: string): Promise<Contact | undefined> {
    try {
      const result = await getDb().select().from(contacts).where(eq(contacts.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching contact:", error);
      return undefined;
    }
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const result = await getDb().insert(contacts).values(contact).returning();
    return result[0];
  }

  async updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact | undefined> {
    const result = await getDb().update(contacts)
      .set({ ...contact, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    return result[0];
  }

  async deleteContact(id: string): Promise<boolean> {
    const result = await getDb().delete(contacts).where(eq(contacts.id, id)).returning();
    return result.length > 0;
  }

  // CTA Settings
  async getCtaSettings(): Promise<CtaSetting[]> {
    try {
      const result = await getDb().select().from(ctaSettings);
      return result;
    } catch (error) {
      console.error("Error fetching CTA settings:", error);
      return [];
    }
  }

  async getActiveCtaSetting(): Promise<CtaSetting> {
    try {
      const result = await getDb().select().from(ctaSettings).where(eq(ctaSettings.isActive, true)).limit(1);
      if (result.length > 0) {
        return result[0];
      }
    } catch (error) {
      console.error("Error fetching active CTA setting:", error);
    }
    
    // Return default CTA setting if none found or error
    return {
      id: 'default-cta',
      titleFr: 'Contactez-nous ou demandez un devis personnalisé.',
      titleEn: 'Connect with us or request a personalized quote.',
      subtitleFr: 'Nous sommes là pour répondre à vos questions et vous aider à démarrer.',
      subtitleEn: 'We\'re here to answer your questions and help you get started.',
      button1TextFr: 'Prendre un rdv',
      button1TextEn: 'Book a Call',
      button1UrlFr: '#contact',
      button1UrlEn: '#contact',
      button2TextFr: 'Devis rapide',
      button2TextEn: 'Quick Quote',
      button2UrlFr: '#quote',
      button2UrlEn: '#quote',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async createCtaSetting(setting: InsertCtaSetting): Promise<CtaSetting> {
    const result = await getDb().insert(ctaSettings).values(setting).returning();
    return result[0];
  }

  async updateCtaSetting(id: string, setting: Partial<InsertCtaSetting>): Promise<CtaSetting | undefined> {
    const result = await getDb().update(ctaSettings)
      .set({ ...setting, updatedAt: new Date() })
      .where(eq(ctaSettings.id, id))
      .returning();
    return result[0];
  }

  async deleteCtaSetting(id: string): Promise<boolean> {
    const result = await getDb().delete(ctaSettings).where(eq(ctaSettings.id, id)).returning();
    return result.length > 0;
  }

  // Legal Documents
  async getLegalDocuments(): Promise<LegalDocument[]> {
    const defaultDocuments = [
        {
          id: "legal-notice",
          type: "mentions-legales",
          titleEn: "Legal Notice",
          titleFr: "Mentions Légales",
          contentEn: "<h1>Legal Notice</h1><p>Legal notice content...</p>",
          contentFr: "<h1>Mentions Légales</h1><p>Contenu des mentions légales...</p>",
          isActive: true,
          updatedAt: new Date()
        },
        {
          id: "privacy-policy",
          type: "politique-confidentialite",
          titleEn: "Privacy Policy",
          titleFr: "Politique de confidentialité",
          contentEn: "<h1>Privacy Policy</h1><p>Privacy policy content...</p>",
          contentFr: "<h1>Politique de confidentialité</h1><p>Contenu de la politique de confidentialité...</p>",
          isActive: true,
          updatedAt: new Date()
        },
        {
          id: "cookie-policy",
          type: "politique-cookies",
          titleEn: "Cookie Policy",
          titleFr: "Politique de cookies",
          contentEn: "<h1>Cookie Policy</h1><p>Cookie policy content...</p>",
          contentFr: "<h1>Politique de cookies</h1><p>Contenu de la politique de cookies...</p>",
          isActive: true,
          updatedAt: new Date()
        },
        {
          id: "terms-of-sale",
          type: "conditions-generales-vente",
          titleEn: "Terms of Sale",
          titleFr: "Conditions Générales de Vente",
          contentEn: "<h1>Terms of Sale</h1><p>Terms of sale content...</p>",
          contentFr: "<h1>Conditions Générales de Vente</h1><p>Contenu des CGV...</p>",
          isActive: true,
          updatedAt: new Date()
        },
        {
          id: "terms-of-use",
          type: "conditions-generales-utilisation",
          titleEn: "Terms of Use",
          titleFr: "Conditions Générales d'Utilisation",
          contentEn: "<h1>Terms of Use</h1><p>Terms of use content...</p>",
          contentFr: "<h1>Conditions Générales d'Utilisation</h1><p>Contenu des CGU...</p>",
          isActive: true,
          updatedAt: new Date()
        }
      ];

    const database = getDb();
    if (!database) {
      return defaultDocuments;
    }
    
    try {
      const result = await database.select().from(legalDocuments).orderBy(asc(legalDocuments.type));
      return result;
    } catch (error) {
      console.error("Error fetching legal documents:", error);
      console.log("Returning default legal documents due to database error");
      // Return default documents on database error
      return defaultDocuments;
    }
  }

  async getLegalDocument(id: string): Promise<LegalDocument | undefined> {
    const database = getDb();
    if (!database) {
      const defaultDocs = await this.getLegalDocuments();
      return defaultDocs.find(doc => doc.id === id);
    }
    
    try {
      const result = await database.select().from(legalDocuments).where(eq(legalDocuments.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching legal document:", error);
      return undefined;
    }
  }

  async createLegalDocument(document: InsertLegalDocument): Promise<LegalDocument> {
    const database = getDb();
    if (!database) {
      throw new Error("Database unavailable");
    }
    
    try {
      // Let the database generate the UUID automatically
      const result = await database.insert(legalDocuments).values(document).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating legal document:", error);
      throw error;
    }
  }

  async updateLegalDocument(id: string, document: Partial<InsertLegalDocument>): Promise<LegalDocument | undefined> {
    const database = getDb();
    if (!database) {
      throw new Error("Database unavailable");
    }
    
    try {
      const result = await database.update(legalDocuments)
        .set({ ...document, updatedAt: new Date() })
        .where(eq(legalDocuments.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating legal document:", error);
      return undefined;
    }
  }

  async deleteLegalDocument(id: string): Promise<boolean> {
    const database = getDb();
    if (!database) {
      throw new Error("Database unavailable");
    }
    
    try {
      const result = await database.delete(legalDocuments).where(eq(legalDocuments.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting legal document:", error);
      return false;
    }
  }

  // Deployment History
  async getDeploymentHistory(): Promise<DeploymentHistory[]> {
    try {
      const result = await getDb().select().from(deploymentHistory).orderBy(desc(deploymentHistory.createdAt));
      return result;
    } catch (error) {
      console.error("Error fetching deployment history:", error);
      return [];
    }
  }

  async getDeploymentHistoryEntry(id: string): Promise<DeploymentHistory | undefined> {
    try {
      const result = await getDb().select().from(deploymentHistory).where(eq(deploymentHistory.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching deployment history entry:", error);
      return undefined;
    }
  }

  async createDeploymentHistoryEntry(entry: InsertDeploymentHistory): Promise<DeploymentHistory> {
    const result = await getDb().insert(deploymentHistory).values(entry).returning();
    return result[0];
  }

  async updateDeploymentHistoryEntry(id: string, entry: Partial<InsertDeploymentHistory>): Promise<DeploymentHistory | undefined> {
    const result = await getDb().update(deploymentHistory)
      .set({ ...entry, updatedAt: new Date() })
      .where(eq(deploymentHistory.id, id))
      .returning();
    return result[0];
  }

  // File storage methods for analytics (backup when database unavailable)
  private async createOrUpdateAnalyticsSessionFile(session: InsertVideoAnalyticsSession): Promise<VideoAnalyticsSession> {
    const sessionsPath = path.join(process.cwd(), 'server', 'analytics-sessions.json');
    
    try {
      let sessions: VideoAnalyticsSession[] = [];
      if (fs.existsSync(sessionsPath)) {
        const data = fs.readFileSync(sessionsPath, 'utf8');
        sessions = JSON.parse(data);
      }

      const existingIndex = sessions.findIndex(s => s.sessionId === session.sessionId);
      
      if (existingIndex >= 0) {
        // Update existing session
        sessions[existingIndex] = {
          ...sessions[existingIndex],
          lastActivity: new Date(),
          totalSessions: sessions[existingIndex].totalSessions + 1
        };
      } else {
        // Create new session
        const newSession: VideoAnalyticsSession = {
          id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          sessionId: session.sessionId,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent || null,
          country: session.country || null,
          continent: session.continent || null,
          city: session.city || null,
          language: session.language,
          isUniqueVisitor: session.isUniqueVisitor ?? true,
          isExcluded: session.isExcluded ?? false,
          firstVisit: new Date(),
          lastActivity: new Date(),
          totalSessions: 1,
          createdAt: new Date()
        };
        sessions.push(newSession);
      }

      fs.writeFileSync(sessionsPath, JSON.stringify(sessions, null, 2));
      return sessions[existingIndex >= 0 ? existingIndex : sessions.length - 1];
    } catch (error) {
      console.error('Error managing analytics session file:', error);
      throw error;
    }
  }

  private async recordVideoViewFile(view: InsertVideoAnalyticsView): Promise<VideoAnalyticsView> {
    const viewsPath = path.join(process.cwd(), 'server', 'analytics-views.json');
    
    try {
      let views: VideoAnalyticsView[] = [];
      if (fs.existsSync(viewsPath)) {
        const data = fs.readFileSync(viewsPath, 'utf8');
        views = JSON.parse(data);
      }

      const newView: VideoAnalyticsView = {
        id: `view-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sessionId: view.sessionId,
        videoId: view.videoId,
        videoType: view.videoType,
        videoTitle: view.videoTitle || null,
        videoDuration: view.videoDuration || null,
        watchTime: view.watchTime ?? 0,
        watchPercentage: view.watchPercentage ?? 0,
        maxWatchTime: view.maxWatchTime ?? 0,
        isCompleted: view.isCompleted ?? false,
        language: view.language,
        startedAt: new Date(),
        lastWatchedAt: new Date(),
        viewCount: view.viewCount ?? 1,
        createdAt: new Date()
      };

      views.push(newView);
      fs.writeFileSync(viewsPath, JSON.stringify(views, null, 2));
      return newView;
    } catch (error) {
      console.error('Error recording video view to file:', error);
      throw error;
    }
  }

  private async updateVideoViewFile(viewId: string, updates: Partial<InsertVideoAnalyticsView>): Promise<VideoAnalyticsView | undefined> {
    const viewsPath = path.join(process.cwd(), 'server', 'analytics-views.json');
    
    try {
      if (!fs.existsSync(viewsPath)) return undefined;
      
      let views: VideoAnalyticsView[] = [];
      const data = fs.readFileSync(viewsPath, 'utf8');
      views = JSON.parse(data);

      const viewIndex = views.findIndex(v => v.id === viewId);
      if (viewIndex >= 0) {
        views[viewIndex] = {
          ...views[viewIndex],
          ...updates,
          lastWatchedAt: new Date(),
        };
        
        fs.writeFileSync(viewsPath, JSON.stringify(views, null, 2));
        return views[viewIndex];
      }
      
      return undefined;
    } catch (error) {
      console.error('Error updating video view in file:', error);
      return undefined;
    }
  }

  private async getAnalyticsSessionFromFile(sessionId: string): Promise<VideoAnalyticsSession | undefined> {
    const sessionsPath = path.join(process.cwd(), 'server', 'analytics-sessions.json');
    
    try {
      if (!fs.existsSync(sessionsPath)) return undefined;
      
      let sessions: VideoAnalyticsSession[] = [];
      const data = fs.readFileSync(sessionsPath, 'utf8');
      sessions = JSON.parse(data);
      
      return sessions.find(s => s.sessionId === sessionId);
    } catch (error) {
      console.error('Error getting analytics session from file:', error);
      return undefined;
    }
  }

  private async createVideoViewFile(view: InsertVideoAnalyticsView): Promise<VideoAnalyticsView> {
    return this.recordVideoViewFile(view);
  }

  // Video Analytics - Sessions
  async createOrUpdateAnalyticsSession(session: InsertVideoAnalyticsSession): Promise<VideoAnalyticsSession> {
    const database = getDb();
    
    // Always use file storage for analytics since tables don't exist
    console.log('📊 Creating/updating analytics session using file storage approach');
    return this.createOrUpdateAnalyticsSessionFile(session);
  }

  async getAnalyticsSession(sessionId: string): Promise<VideoAnalyticsSession | undefined> {
    const database = getDb();
    
    // Always use file storage for analytics since tables don't exist
    console.log('📊 Getting analytics session using file storage approach');
    return this.getAnalyticsSessionFromFile(sessionId);
  }

  async getAnalyticsSessions(filters: {
    dateFrom?: string;
    dateTo?: string;
    excludeAdmin?: boolean;
    country?: string;
    language?: string;
  } = {}): Promise<VideoAnalyticsSession[]> {
    const database = getDb();
    
    // File storage backup approach for analytics
    if (!database) {
      return this.getAnalyticsSessionsFromFile(filters);
    }

    try {
      let query = database.select().from(videoAnalyticsSessions);

      // Apply filters
      if (filters.excludeAdmin) {
        query = query.where(eq(videoAnalyticsSessions.isExcluded, false));
      }
      if (filters.country) {
        query = query.where(eq(videoAnalyticsSessions.country, filters.country));
      }
      if (filters.language) {
        query = query.where(eq(videoAnalyticsSessions.language, filters.language));
      }

      return await query.orderBy(desc(videoAnalyticsSessions.createdAt));
    } catch (error) {
      console.error("Error fetching analytics sessions:", error);
      console.log('📁 Falling back to file storage for analytics sessions');
      return this.getAnalyticsSessionsFromFile(filters);
    }
  }

  // Video Analytics - Views
  async recordVideoView(view: InsertVideoAnalyticsView): Promise<VideoAnalyticsView> {
    const database = getDb();
    
    // Always use file storage for analytics since tables don't exist
    console.log('📊 Recording video view using file storage approach');
    return this.recordVideoViewFile(view);
  }

  async updateVideoView(id: string, view: Partial<InsertVideoAnalyticsView>): Promise<VideoAnalyticsView | undefined> {
    const database = getDb();
    
    // Always use file storage for analytics since tables don't exist
    console.log('📊 Updating video view using file storage approach');
    return this.updateVideoViewFile(id, view);
  }

  async getVideoViews(filters: {
    videoId?: string;
    videoType?: string;
    dateFrom?: string;
    dateTo?: string;
    language?: string;
  } = {}): Promise<VideoAnalyticsView[]> {
    const database = getDb();
    
    // File storage backup approach for analytics
    if (!database) {
      return this.getVideoViewsFromFile(filters);
    }

    try {
      let query = database.select().from(videoAnalyticsViews);

      if (filters.videoId) {
        query = query.where(eq(videoAnalyticsViews.videoId, filters.videoId));
      }
      if (filters.videoType) {
        query = query.where(eq(videoAnalyticsViews.videoType, filters.videoType));
      }
      if (filters.language) {
        query = query.where(eq(videoAnalyticsViews.language, filters.language));
      }

      return await query.orderBy(desc(videoAnalyticsViews.createdAt));
    } catch (error) {
      console.error("Error fetching video views:", error);
      console.log('📁 Falling back to file storage for video views');
      return this.getVideoViewsFromFile(filters);
    }
  }

  // Video Analytics - Statistics & Aggregations
  async getVideoStats(filters: {
    videoId?: string;
    videoType?: string;
    dateFrom?: string;
    dateTo?: string;
    language?: string;
  } = {}): Promise<VideoAnalyticsStats[]> {
    const database = getDb();
    if (!database) return [];

    try {
      let query = database.select().from(videoAnalyticsStats);

      if (filters.videoId) {
        query = query.where(eq(videoAnalyticsStats.videoId, filters.videoId));
      }
      if (filters.videoType) {
        query = query.where(eq(videoAnalyticsStats.videoType, filters.videoType));
      }
      if (filters.language) {
        query = query.where(eq(videoAnalyticsStats.language, filters.language));
      }

      return await query.orderBy(desc(videoAnalyticsStats.date));
    } catch (error) {
      console.error("Error fetching video stats:", error);
      return [];
    }
  }

  async updateVideoStats(videoId: string, videoType: string, language: string, date: string): Promise<void> {
    const database = getDb();
    if (!database) return;

    try {
      // Get all views for this video/date combination
      const views = await database.select()
        .from(videoAnalyticsViews)
        .where(eq(videoAnalyticsViews.videoId, videoId));

      if (views.length === 0) return;

      // Calculate aggregated statistics
      const totalViews = views.length;
      const uniqueViews = new Set(views.map(v => v.sessionId)).size;
      const totalWatchTime = views.reduce((sum, v) => sum + (v.watchTime || 0), 0);
      const averageWatchTime = totalWatchTime / totalViews;
      const completedViews = views.filter(v => v.isCompleted).length;
      const completionRate = (completedViews / totalViews) * 100;
      const averageWatchPercentage = views.reduce((sum, v) => sum + (v.watchPercentage || 0), 0) / totalViews;

      // Check if stats entry exists
      const existingStats = await database.select()
        .from(videoAnalyticsStats)
        .where(eq(videoAnalyticsStats.videoId, videoId))
        .limit(1);

      if (existingStats.length > 0) {
        // Update existing stats
        await database.update(videoAnalyticsStats)
          .set({
            totalViews,
            uniqueViews,
            totalWatchTime,
            averageWatchTime,
            averageWatchPercentage,
            completionRate,
            updatedAt: new Date()
          })
          .where(eq(videoAnalyticsStats.id, existingStats[0].id));
      } else {
        // Create new stats entry
        await database.insert(videoAnalyticsStats).values({
          videoId,
          videoType,
          language,
          date,
          totalViews,
          uniqueViews,
          totalWatchTime,
          averageWatchTime,
          averageWatchPercentage,
          completionRate,
          topCountries: []
        });
      }
    } catch (error) {
      console.error("Error updating video stats:", error);
    }
  }

  async getTopVideos(limit: number = 10, dateFrom?: string, dateTo?: string): Promise<{
    videoId: string;
    videoType: string;
    totalViews: number;
    uniqueViews: number;
    averageWatchTime: number;
    completionRate: number;
  }[]> {
    const database = getDb();
    
    // File storage backup approach for analytics
    if (!database) {
      return this.getTopVideosFromFile(limit, dateFrom, dateTo);
    }

    try {
      const stats = await database.select().from(videoAnalyticsStats)
        .orderBy(desc(videoAnalyticsStats.totalViews))
        .limit(limit);

      return stats.map(stat => ({
        videoId: stat.videoId,
        videoType: stat.videoType,
        totalViews: Number(stat.totalViews),
        uniqueViews: Number(stat.uniqueViews),
        averageWatchTime: stat.averageWatchTime,
        completionRate: stat.completionRate
      }));
    } catch (error) {
      console.error("Error fetching top videos:", error);
      console.log('📁 Falling back to file storage for top videos');
      return this.getTopVideosFromFile(limit, dateFrom, dateTo);
    }
  }

  // Video Analytics - Settings & Management
  async getAnalyticsSettings(): Promise<VideoAnalyticsSettings | undefined> {
    const database = getDb();
    
    if (database) {
      try {
        const result = await database.select().from(videoAnalyticsSettings).limit(1);
        if (result.length === 0) {
          // Create default settings
          const defaultSettings = await database.insert(videoAnalyticsSettings).values({
            excludedIps: [],
            completionThreshold: 90,
            trackingEnabled: true,
            dataRetentionDays: 365
          }).returning();
          return defaultSettings[0];
        }
        return result[0];
      } catch (error) {
        console.error("Error fetching analytics settings from database:", error);
      }
    }

    // Fall back to file storage
    try {
      const settingsPath = path.join(process.cwd(), 'server', 'analytics-settings.json');
      if (fs.existsSync(settingsPath)) {
        const settingsData = fs.readFileSync(settingsPath, 'utf8');
        const settings = JSON.parse(settingsData);
        return settings;
      } else {
        // Create default settings file
        const defaultSettings = {
          id: 'default',
          excludedIps: [],
          completionThreshold: 90,
          trackingEnabled: true,
          dataRetentionDays: 365,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
        console.log('📊 Created default analytics settings file');
        return defaultSettings;
      }
    } catch (error) {
      console.error("Error with analytics settings file storage:", error);
      // Return default settings if file operations fail
      return {
        id: 'default',
        excludedIps: [],
        completionThreshold: 90,
        trackingEnabled: true,
        dataRetentionDays: 365,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }

  async updateAnalyticsSettings(settings: Partial<InsertVideoAnalyticsSettings>): Promise<VideoAnalyticsSettings> {
    const database = getDb();
    
    if (database) {
      try {
        const existing = await this.getAnalyticsSettings();
        if (!existing) {
          throw new Error("No analytics settings found");
        }

        const result = await database.update(videoAnalyticsSettings)
          .set({ ...settings, updatedAt: new Date() })
          .where(eq(videoAnalyticsSettings.id, existing.id))
          .returning();
        return result[0];
      } catch (error) {
        console.error("Error updating analytics settings in database:", error);
      }
    }

    // Fall back to file storage
    try {
      const existing = await this.getAnalyticsSettings();
      if (!existing) {
        // Create new settings if none exist
        const newSettings = {
          id: 'default',
          excludedIps: settings.excludedIps || [],
          completionThreshold: settings.completionThreshold || 90,
          trackingEnabled: settings.trackingEnabled !== undefined ? settings.trackingEnabled : true,
          dataRetentionDays: settings.dataRetentionDays || 365,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const settingsPath = path.join(process.cwd(), 'server', 'analytics-settings.json');
        fs.writeFileSync(settingsPath, JSON.stringify(newSettings, null, 2));
        console.log('📊 Created new analytics settings in file storage');
        return newSettings as VideoAnalyticsSettings;
      }

      const updatedSettings = {
        ...existing,
        ...settings,
        updatedAt: new Date()
      };

      const settingsPath = path.join(process.cwd(), 'server', 'analytics-settings.json');
      fs.writeFileSync(settingsPath, JSON.stringify(updatedSettings, null, 2));
      console.log('📊 Updated analytics settings in file storage');
      return updatedSettings as VideoAnalyticsSettings;
    } catch (error) {
      console.error("Error updating analytics settings in file storage:", error);
      throw error;
    }
  }

  async resetAnalytics(resetType: 'all' | 'views' | 'sessions'): Promise<boolean> {
    const database = getDb();
    
    // Always use file storage for analytics since tables don't exist
    console.log('📊 Resetting analytics using file storage approach');
    return this.resetAnalyticsFiles(resetType);
  }

  async getAnalyticsSummary(dateFrom?: string, dateTo?: string): Promise<{
    totalViews: number;
    uniqueVisitors: number;
    totalWatchTime: number;
    averageSessionDuration: number;
    topCountries: { country: string; views: number; }[];
    languageBreakdown: { language: string; views: number; }[];
    videoPerformance: { videoId: string; title: string; views: number; completionRate: number; }[];
  }> {
    const database = getDb();
    
    // File storage backup approach for analytics
    if (!database) {
      return this.getAnalyticsSummaryFromFile(dateFrom, dateTo);
    }

    try {
      // Get all views and sessions
      const views = await database.select().from(videoAnalyticsViews);
      const sessions = await database.select().from(videoAnalyticsSessions);

      // Calculate summary statistics
      const totalViews = views.length;
      const uniqueVisitors = new Set(views.map(v => v.sessionId)).size;
      const totalWatchTime = views.reduce((sum, v) => sum + (v.watchTime || 0), 0);

      // Calculate average session duration
      const sessionDurations = sessions.map(s => {
        const start = new Date(s.firstVisit).getTime();
        const end = new Date(s.lastActivity).getTime();
        return (end - start) / 1000; // Convert to seconds
      });
      const averageSessionDuration = sessionDurations.length > 0 
        ? sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length 
        : 0;

      // Top countries
      const countryStats = new Map<string, number>();
      sessions.forEach(s => {
        if (s.country && !s.isExcluded) {
          countryStats.set(s.country, (countryStats.get(s.country) || 0) + 1);
        }
      });
      const topCountries = Array.from(countryStats.entries())
        .map(([country, views]) => ({ country, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

      // Language breakdown
      const languageStats = new Map<string, number>();
      views.forEach(v => {
        languageStats.set(v.language, (languageStats.get(v.language) || 0) + 1);
      });
      const languageBreakdown = Array.from(languageStats.entries())
        .map(([language, views]) => ({ language, views }));

      // Video performance
      const videoStats = new Map<string, { views: number; completed: number; title?: string }>();
      views.forEach(v => {
        const key = v.videoId;
        const existing = videoStats.get(key) || { views: 0, completed: 0, title: v.videoTitle || v.videoId };
        existing.views++;
        if (v.isCompleted) existing.completed++;
        videoStats.set(key, existing);
      });

      const videoPerformance = Array.from(videoStats.entries())
        .map(([videoId, stats]) => ({
          videoId,
          title: stats.title || videoId,
          views: stats.views,
          completionRate: stats.views > 0 ? (stats.completed / stats.views) * 100 : 0
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      return {
        totalViews,
        uniqueVisitors,
        totalWatchTime,
        averageSessionDuration,
        topCountries,
        languageBreakdown,
        videoPerformance
      };
    } catch (error) {
      console.error("Error generating analytics summary:", error);
      console.log('📁 Falling back to file storage for analytics summary');
      return this.getAnalyticsSummaryFromFile(dateFrom, dateTo);
    }
  }

  private async getVideoViewsFromFile(filters: {
    videoId?: string;
    videoType?: string;
    dateFrom?: string;
    dateTo?: string;
    language?: string;
  } = {}): Promise<VideoAnalyticsView[]> {
    const viewsPath = path.join(process.cwd(), 'server', 'analytics-views.json');
    
    try {
      if (!fs.existsSync(viewsPath)) return [];
      
      let views: VideoAnalyticsView[] = [];
      const data = fs.readFileSync(viewsPath, 'utf8');
      views = JSON.parse(data);

      // Apply filters
      let filteredViews = views;
      
      if (filters.videoId) {
        filteredViews = filteredViews.filter(v => v.videoId === filters.videoId);
      }
      
      if (filters.videoType) {
        filteredViews = filteredViews.filter(v => v.videoType === filters.videoType);
      }
      
      if (filters.language) {
        filteredViews = filteredViews.filter(v => v.language === filters.language);
      }
      
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        filteredViews = filteredViews.filter(v => new Date(v.createdAt) >= fromDate);
      }
      
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        filteredViews = filteredViews.filter(v => new Date(v.createdAt) <= toDate);
      }

      // Sort by created date descending
      return filteredViews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error reading video views from file:', error);
      return [];
    }
  }

  private async getAnalyticsSessionsFromFile(filters: {
    dateFrom?: string;
    dateTo?: string;
    excludeAdmin?: boolean;
    country?: string;
    language?: string;
  } = {}): Promise<VideoAnalyticsSession[]> {
    const sessionsPath = path.join(process.cwd(), 'server', 'analytics-sessions.json');
    
    try {
      if (!fs.existsSync(sessionsPath)) return [];
      
      let sessions: VideoAnalyticsSession[] = [];
      const data = fs.readFileSync(sessionsPath, 'utf8');
      sessions = JSON.parse(data);

      // Apply filters
      let filteredSessions = sessions;
      
      if (filters.excludeAdmin) {
        filteredSessions = filteredSessions.filter(s => !s.isExcluded);
      }
      
      if (filters.country) {
        filteredSessions = filteredSessions.filter(s => s.country === filters.country);
      }
      
      if (filters.language) {
        filteredSessions = filteredSessions.filter(s => s.language === filters.language);
      }
      
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        filteredSessions = filteredSessions.filter(s => new Date(s.createdAt) >= fromDate);
      }
      
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        filteredSessions = filteredSessions.filter(s => new Date(s.createdAt) <= toDate);
      }

      // Sort by created date descending
      return filteredSessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error reading analytics sessions from file:', error);
      return [];
    }
  }

  private async getAnalyticsSummaryFromFile(dateFrom?: string, dateTo?: string): Promise<{
    totalViews: number;
    uniqueVisitors: number;
    totalWatchTime: number;
    averageSessionDuration: number;
    topCountries: { country: string; views: number; }[];
    languageBreakdown: { language: string; views: number; }[];
    videoPerformance: { videoId: string; title: string; views: number; completionRate: number; }[];
  }> {
    try {
      const views = await this.getVideoViewsFromFile({ dateFrom, dateTo });
      const sessions = await this.getAnalyticsSessionsFromFile({ dateFrom, dateTo });

      // Calculate summary statistics
      const totalViews = views.length;
      const uniqueVisitors = new Set(views.map(v => v.sessionId)).size;
      const totalWatchTime = views.reduce((sum, v) => sum + (v.watchTime || 0), 0);

      // Calculate average session duration
      const sessionDurations = sessions.map(s => {
        const start = new Date(s.createdAt).getTime();
        const end = new Date(s.lastActivity).getTime();
        return Math.max(0, (end - start) / 1000); // Convert to seconds
      });
      const averageSessionDuration = sessionDurations.length > 0 
        ? sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length 
        : 0;

      // Top countries
      const countryStats = new Map<string, number>();
      sessions.forEach(s => {
        if (s.country && !s.isAdminSession) {
          countryStats.set(s.country, (countryStats.get(s.country) || 0) + 1);
        }
      });
      const topCountries = Array.from(countryStats.entries())
        .map(([country, views]) => ({ country, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

      // Language breakdown
      const languageStats = new Map<string, number>();
      views.forEach(v => {
        languageStats.set(v.language, (languageStats.get(v.language) || 0) + 1);
      });
      const languageBreakdown = Array.from(languageStats.entries())
        .map(([language, views]) => ({ language, views }));

      // Video performance
      const videoStats = new Map<string, { views: number; completed: number; title?: string }>();
      views.forEach(v => {
        const key = v.videoId;
        const existing = videoStats.get(key) || { views: 0, completed: 0, title: v.videoTitle || v.videoId };
        existing.views++;
        if (v.isCompleted) existing.completed++;
        videoStats.set(key, existing);
      });

      const videoPerformance = Array.from(videoStats.entries())
        .map(([videoId, stats]) => ({
          videoId,
          title: stats.title || videoId,
          views: stats.views,
          completionRate: stats.views > 0 ? (stats.completed / stats.views) * 100 : 0
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      return {
        totalViews,
        uniqueVisitors,
        totalWatchTime,
        averageSessionDuration,
        topCountries,
        languageBreakdown,
        videoPerformance
      };
    } catch (error) {
      console.error('Error generating analytics summary from file:', error);
      return {
        totalViews: 0,
        uniqueVisitors: 0,
        totalWatchTime: 0,
        averageSessionDuration: 0,
        topCountries: [],
        languageBreakdown: [],
        videoPerformance: []
      };
    }
  }

  private async getTopVideosFromFile(limit: number = 10, dateFrom?: string, dateTo?: string): Promise<{
    videoId: string;
    videoType: string;
    totalViews: number;
    uniqueViews: number;
    averageWatchTime: number;
    completionRate: number;
  }[]> {
    try {
      const views = await this.getVideoViewsFromFile({ dateFrom, dateTo });

      // Group by video ID
      const videoStats = new Map<string, {
        videoType: string;
        views: VideoAnalyticsView[];
        sessions: Set<string>;
      }>();

      views.forEach(view => {
        const key = view.videoId;
        if (!videoStats.has(key)) {
          videoStats.set(key, {
            videoType: view.videoType,
            views: [],
            sessions: new Set()
          });
        }
        const stats = videoStats.get(key)!;
        stats.views.push(view);
        stats.sessions.add(view.sessionId);
      });

      // Calculate metrics for each video
      const topVideos = Array.from(videoStats.entries()).map(([videoId, stats]) => {
        const totalViews = stats.views.length;
        const uniqueViews = stats.sessions.size;
        const totalWatchTime = stats.views.reduce((sum, v) => sum + (v.watchTime || 0), 0);
        const averageWatchTime = totalViews > 0 ? totalWatchTime / totalViews : 0;
        const completedViews = stats.views.filter(v => v.isCompleted).length;
        const completionRate = totalViews > 0 ? (completedViews / totalViews) * 100 : 0;

        return {
          videoId,
          videoType: stats.videoType,
          totalViews,
          uniqueViews,
          averageWatchTime,
          completionRate
        };
      });

      // Sort by total views descending and limit
      return topVideos
        .sort((a, b) => b.totalViews - a.totalViews)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting top videos from file:', error);
      return [];
    }
  }

  private async resetAnalyticsFiles(resetType: 'all' | 'views' | 'sessions'): Promise<boolean> {
    try {
      const viewsPath = path.join(process.cwd(), 'server', 'analytics-views.json');
      const sessionsPath = path.join(process.cwd(), 'server', 'analytics-sessions.json');

      if (resetType === 'all' || resetType === 'views') {
        fs.writeFileSync(viewsPath, JSON.stringify([], null, 2));
        console.log('📊 Reset analytics views file');
      }
      
      if (resetType === 'all' || resetType === 'sessions') {
        fs.writeFileSync(sessionsPath, JSON.stringify([], null, 2));
        console.log('📊 Reset analytics sessions file');
      }

      // Update last reset date in settings
      const settings = await this.getAnalyticsSettings();
      if (settings) {
        await this.updateAnalyticsSettings({ lastResetDate: new Date() });
      }

      return true;
    } catch (error) {
      console.error('Error resetting analytics files:', error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
