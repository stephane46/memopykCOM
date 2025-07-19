import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for server-side operations
// Convert PostgreSQL URL to self-hosted Supabase API URL
// Note: Currently using HTTP as HTTPS is not configured on exposed ports
let supabaseUrl = process.env.SUPABASE_URL;
if (supabaseUrl?.startsWith('postgresql://')) {
  // Extract host for self-hosted Supabase API
  const url = new URL(supabaseUrl);
  const host = url.hostname; // supabase.memopyk.org
  supabaseUrl = `http://${host}:8001`; // Direct Storage API on port 8001
}

const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Client-side Supabase client (for frontend)
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  throw new Error('Missing SUPABASE_ANON_KEY environment variable.');
}

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Upload file to self-hosted Supabase Storage using direct HTTP calls
export async function uploadFile(
  file: Buffer, 
  fileName: string, 
  bucket: string = 'memopyk-media',
  contentType?: string
): Promise<{ url: string; path: string }> {
  try {
    const storageUrl = supabaseUrl;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!storageUrl || !serviceKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${timestamp}_${sanitizedFileName}`;

    // Upload file using direct HTTP call to self-hosted Storage API
    const uploadResponse = await fetch(`${storageUrl}/object/${bucket}/${filePath}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': contentType || 'application/octet-stream',
        'cache-control': 'max-age=3600'
      },
      body: file
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Upload failed:', uploadResponse.status, errorText);
      throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`);
    }

    // Construct public URL (self-hosted Supabase pattern)
    const publicUrl = `${storageUrl}/object/public/${bucket}/${filePath}`;

    console.log(`✅ File uploaded successfully: ${publicUrl}`);

    return {
      url: publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error('File upload failed:', error);
    throw error;
  }
}

// Delete file from Supabase Storage
export async function deleteFile(filePath: string, bucket: string = 'memopyk-media'): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('File deletion failed:', error);
    return false;
  }
}