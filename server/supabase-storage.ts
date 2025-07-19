import { createClient } from '@supabase/supabase-js';
import { 
  type HeroVideo, type InsertHeroVideo,
  type GalleryItem, type InsertGalleryItem,
  type Faq, type InsertFaq,
  type Contact, type InsertContact
} from "@shared/schema";

// Supabase REST API Storage Implementation
// This works without requiring PostgreSQL port 5432 to be exposed
export class SupabaseStorage {
  private supabase: any;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
    }
    
    // Ensure proper URL format
    const cleanUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`;
    
    this.supabase = createClient(cleanUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.from('hero_videos').select('id').limit(1);
      return !error;
    } catch (err) {
      return false;
    }
  }

  // Hero Videos
  async getHeroVideos(): Promise<HeroVideo[]> {
    const { data, error } = await this.supabase
      .from('hero_videos')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });
    
    if (error) throw new Error(`Failed to fetch hero videos: ${error.message}`);
    return data || [];
  }

  async createHeroVideo(video: InsertHeroVideo): Promise<HeroVideo> {
    const { data, error } = await this.supabase
      .from('hero_videos')
      .insert(video)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create hero video: ${error.message}`);
    return data;
  }

  async updateHeroVideo(id: string, video: Partial<InsertHeroVideo>): Promise<HeroVideo | undefined> {
    const { data, error } = await this.supabase
      .from('hero_videos')
      .update(video)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update hero video: ${error.message}`);
    return data;
  }

  async deleteHeroVideo(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('hero_videos')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  // Gallery Items
  async getGalleryItems(): Promise<GalleryItem[]> {
    const { data, error } = await this.supabase
      .from('gallery_items')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to fetch gallery items: ${error.message}`);
    return data || [];
  }

  async createGalleryItem(item: InsertGalleryItem): Promise<GalleryItem> {
    const { data, error } = await this.supabase
      .from('gallery_items')
      .insert(item)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create gallery item: ${error.message}`);
    return data;
  }

  // FAQs
  async getFaqs(): Promise<Faq[]> {
    const { data, error } = await this.supabase
      .from('faqs')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (error) throw new Error(`Failed to fetch FAQs: ${error.message}`);
    return data || [];
  }

  async createFaq(faq: InsertFaq): Promise<Faq> {
    const { data, error } = await this.supabase
      .from('faqs')
      .insert(faq)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create FAQ: ${error.message}`);
    return data;
  }

  // Contacts
  async getContacts(): Promise<Contact[]> {
    const { data, error } = await this.supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to fetch contacts: ${error.message}`);
    return data || [];
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const { data, error } = await this.supabase
      .from('contacts')
      .insert(contact)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create contact: ${error.message}`);
    return data;
  }
}

// Create and test Supabase storage instance
export async function createSupabaseStorage(): Promise<SupabaseStorage | null> {
  try {
    const storage = new SupabaseStorage();
    const isConnected = await storage.testConnection();
    
    if (isConnected) {
      console.log("✅ Supabase REST API connection successful");
      return storage;
    } else {
      console.log("❌ Supabase REST API connection failed");
      return null;
    }
  } catch (error) {
    console.log("❌ Supabase storage initialization failed:", error.message);
    return null;
  }
}