import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { 
  users, heroVideos, galleryItems, faqs, seoSettings, contacts, legalDocuments, deploymentHistory,
  type User, type InsertUser,
  type HeroVideo, type InsertHeroVideo,
  type GalleryItem, type InsertGalleryItem,
  type Faq, type InsertFaq,
  type SeoSetting, type InsertSeoSetting,
  type Contact, type InsertContact,
  type LegalDocument, type InsertLegalDocument,
  type DeploymentHistory, type InsertDeploymentHistory
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
    
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is required");
    }

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
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is required");
    }

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
  getLegalDocumentByType(type: string): Promise<LegalDocument | undefined>;
  createLegalDocument(document: InsertLegalDocument): Promise<LegalDocument>;
  updateLegalDocument(id: string, document: Partial<InsertLegalDocument>): Promise<LegalDocument | undefined>;
  deleteLegalDocument(id: string): Promise<boolean>;

  // Deployment History
  getDeploymentHistory(): Promise<DeploymentHistory[]>;
  getDeploymentHistoryEntry(id: string): Promise<DeploymentHistory | undefined>;
  createDeploymentHistoryEntry(entry: InsertDeploymentHistory): Promise<DeploymentHistory>;
  updateDeploymentHistoryEntry(id: string, entry: Partial<InsertDeploymentHistory>): Promise<DeploymentHistory | undefined>;
}

function getDb() {
  if (!db) {
    // In production, try to reinitialize database if not connected
    if (process.env.NODE_ENV === 'production') {
      console.log("🔄 Database not connected, attempting to reconnect...");
      initializeDatabase().catch(err => console.error("Database reconnection failed:", err.message));
    }
    throw new Error("Database not initialized - please check database connection");
  }
  return db;
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
    return await getDb().select().from(heroVideos).orderBy(asc(heroVideos.orderIndex));
  }

  async getHeroVideo(id: string): Promise<HeroVideo | undefined> {
    const result = await getDb().select().from(heroVideos).where(eq(heroVideos.id, id)).limit(1);
    return result[0];
  }

  async createHeroVideo(video: InsertHeroVideo): Promise<HeroVideo> {
    const result = await getDb().insert(heroVideos).values(video).returning();
    return result[0];
  }

  async updateHeroVideo(id: string, video: Partial<InsertHeroVideo>): Promise<HeroVideo | undefined> {
    const result = await getDb().update(heroVideos)
      .set({ ...video, updatedAt: new Date() })
      .where(eq(heroVideos.id, id))
      .returning();
    return result[0];
  }

  async deleteHeroVideo(id: string): Promise<boolean> {
    const result = await getDb().delete(heroVideos).where(eq(heroVideos.id, id)).returning();
    return result.length > 0;
  }

  // Gallery Items
  async getGalleryItems(): Promise<GalleryItem[]> {
    return await getDb().select().from(galleryItems).orderBy(asc(galleryItems.orderIndex));
  }

  async getGalleryItem(id: string): Promise<GalleryItem | undefined> {
    const result = await getDb().select().from(galleryItems).where(eq(galleryItems.id, id)).limit(1);
    return result[0];
  }

  async createGalleryItem(item: InsertGalleryItem): Promise<GalleryItem> {
    const result = await getDb().insert(galleryItems).values(item).returning();
    return result[0];
  }

  async updateGalleryItem(id: string, item: Partial<InsertGalleryItem>): Promise<GalleryItem | undefined> {
    const result = await getDb().update(galleryItems)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(galleryItems.id, id))
      .returning();
    return result[0];
  }

  async deleteGalleryItem(id: string): Promise<boolean> {
    const result = await getDb().delete(galleryItems).where(eq(galleryItems.id, id)).returning();
    return result.length > 0;
  }

  // FAQs
  async getFaqs(): Promise<Faq[]> {
    return await getDb().select().from(faqs).orderBy(asc(faqs.section), asc(faqs.orderIndex));
  }

  async getFaq(id: string): Promise<Faq | undefined> {
    const result = await getDb().select().from(faqs).where(eq(faqs.id, id)).limit(1);
    return result[0];
  }

  async createFaq(faq: InsertFaq): Promise<Faq> {
    const result = await getDb().insert(faqs).values(faq).returning();
    return result[0];
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

  // SEO Settings
  async getSeoSettings(): Promise<SeoSetting[]> {
    return await getDb().select().from(seoSettings);
  }

  async getSeoSetting(id: string): Promise<SeoSetting | undefined> {
    const result = await getDb().select().from(seoSettings).where(eq(seoSettings.id, id)).limit(1);
    return result[0];
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
    return await getDb().select().from(contacts).orderBy(desc(contacts.createdAt));
  }

  async getContact(id: string): Promise<Contact | undefined> {
    const result = await getDb().select().from(contacts).where(eq(contacts.id, id)).limit(1);
    return result[0];
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

  // Legal Documents
  async getLegalDocuments(): Promise<LegalDocument[]> {
    return await getDb().select().from(legalDocuments).orderBy(asc(legalDocuments.type));
  }

  async getLegalDocument(id: string): Promise<LegalDocument | undefined> {
    const result = await getDb().select().from(legalDocuments).where(eq(legalDocuments.id, id)).limit(1);
    return result[0];
  }

  async getLegalDocumentByType(type: string): Promise<LegalDocument | undefined> {
    const result = await getDb().select().from(legalDocuments).where(eq(legalDocuments.type, type)).limit(1);
    return result[0];
  }

  async createLegalDocument(document: InsertLegalDocument): Promise<LegalDocument> {
    const result = await getDb().insert(legalDocuments).values(document).returning();
    return result[0];
  }

  async updateLegalDocument(id: string, document: Partial<InsertLegalDocument>): Promise<LegalDocument | undefined> {
    const result = await getDb().update(legalDocuments)
      .set({ ...document, updatedAt: new Date() })
      .where(eq(legalDocuments.id, id))
      .returning();
    return result[0];
  }

  async deleteLegalDocument(id: string): Promise<boolean> {
    const result = await getDb().delete(legalDocuments).where(eq(legalDocuments.id, id)).returning();
    return result.length > 0;
  }

  // Deployment History
  async getDeploymentHistory(): Promise<DeploymentHistory[]> {
    return await getDb().select().from(deploymentHistory).orderBy(desc(deploymentHistory.startTime));
  }

  async getDeploymentHistoryEntry(id: string): Promise<DeploymentHistory | undefined> {
    const result = await getDb().select().from(deploymentHistory).where(eq(deploymentHistory.id, id)).limit(1);
    return result[0];
  }

  async createDeploymentHistoryEntry(entry: InsertDeploymentHistory): Promise<DeploymentHistory> {
    const result = await getDb().insert(deploymentHistory).values(entry).returning();
    return result[0];
  }

  async updateDeploymentHistoryEntry(id: string, entry: Partial<InsertDeploymentHistory>): Promise<DeploymentHistory | undefined> {
    const result = await getDb().update(deploymentHistory)
      .set(entry)
      .where(eq(deploymentHistory.id, id))
      .returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
