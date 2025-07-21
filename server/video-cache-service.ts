import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { createHash } from 'crypto';

export interface VideoCacheResult {
  success: boolean;
  localPath?: string;
  error?: string;
  existingFile?: boolean;
  skipped?: boolean;
}

export class VideoCacheService {
  private cacheDir: string;

  constructor() {
    this.cacheDir = path.join(process.cwd(), 'server', 'cached-videos');
    this.ensureCacheDirectory();
  }

  private ensureCacheDirectory(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
      console.log(`📁 Created video cache directory: ${this.cacheDir}`);
    }
  }

  /**
   * Generate a consistent filename from URL
   */
  private generateCacheFilename(url: string): string {
    // Extract original filename if possible
    const urlParts = url.split('/');
    const originalFilename = urlParts[urlParts.length - 1];
    
    // Create hash of URL for uniqueness
    const urlHash = createHash('md5').update(url).digest('hex').substring(0, 8);
    
    // If we have a proper filename with extension, use it
    if (originalFilename && originalFilename.includes('.')) {
      const extension = originalFilename.split('.').pop();
      const nameWithoutExt = originalFilename.replace(/\.[^/.]+$/, "");
      return `${nameWithoutExt}_${urlHash}.${extension}`;
    }
    
    // Fallback to hash with mp4 extension
    return `video_${urlHash}.mp4`;
  }

  /**
   * Check if video already exists in cache
   */
  private checkExistingCache(filename: string): boolean {
    const filePath = path.join(this.cacheDir, filename);
    return fs.existsSync(filePath);
  }

  /**
   * Download video from URL and cache locally
   */
  async cacheVideo(url: string, existingFilename?: string): Promise<VideoCacheResult> {
    try {
      console.log(`🎬 CACHE: Starting download for ${url}`);
      
      // Generate filename
      const filename = existingFilename || this.generateCacheFilename(url);
      const localPath = path.join(this.cacheDir, filename);
      
      // Check if already cached
      if (this.checkExistingCache(filename)) {
        console.log(`💾 CACHE: Video already exists - ${filename}`);
        return {
          success: true,
          localPath: filename,
          existingFile: true
        };
      }

      // Download video
      console.log(`⬇️ CACHE: Downloading ${url} -> ${filename}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Get total size for progress tracking
      const totalSize = parseInt(response.headers.get('content-length') || '0');
      console.log(`📦 CACHE: Download size: ${Math.round(totalSize / 1024 / 1024)}MB`);

      // Stream to file
      const fileStream = fs.createWriteStream(localPath);
      let downloadedSize = 0;
      let lastProgress = 0;

      return new Promise<VideoCacheResult>((resolve, reject) => {
        response.body?.on('data', (chunk: Buffer) => {
          downloadedSize += chunk.length;
          const progress = Math.round((downloadedSize / totalSize) * 100);
          
          // Log progress every 25%
          if (progress >= lastProgress + 25) {
            console.log(`📈 CACHE: Downloaded ${progress}% (${Math.round(downloadedSize / 1024 / 1024)}MB)`);
            lastProgress = progress;
          }
        });

        response.body?.pipe(fileStream);

        fileStream.on('finish', () => {
          console.log(`✅ CACHE: Successfully cached ${filename}`);
          resolve({
            success: true,
            localPath: filename
          });
        });

        fileStream.on('error', (error) => {
          console.error(`❌ CACHE: File write error for ${filename}:`, error);
          // Clean up partial file
          if (fs.existsSync(localPath)) {
            fs.unlinkSync(localPath);
          }
          reject({
            success: false,
            error: `File write error: ${error.message}`
          });
        });

        response.body?.on('error', (error) => {
          console.error(`❌ CACHE: Download error for ${url}:`, error);
          reject({
            success: false,
            error: `Download error: ${error.message}`
          });
        });
      });

    } catch (error) {
      console.error(`❌ CACHE: Failed to cache video from ${url}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get local video path for serving
   */
  getLocalVideoPath(filename: string): string | null {
    if (!filename) return null;
    
    const localPath = path.join(this.cacheDir, filename);
    if (fs.existsSync(localPath)) {
      return localPath;
    }
    return null;
  }

  /**
   * Serve cached video with range support
   */
  serveCachedVideo(filename: string, range?: string): { stream?: fs.ReadStream; headers?: any; status?: number } {
    const localPath = this.getLocalVideoPath(filename);
    
    if (!localPath) {
      return { status: 404 };
    }

    const stat = fs.statSync(localPath);
    const fileSize = stat.size;

    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;

      const stream = fs.createReadStream(localPath, { start, end });
      
      return {
        stream,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'video/mp4',
          'Cache-Control': 'public, max-age=31536000'
        },
        status: 206
      };
    } else {
      // Full file
      const stream = fs.createReadStream(localPath);
      
      return {
        stream,
        headers: {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4',
          'Cache-Control': 'public, max-age=31536000'
        },
        status: 200
      };
    }
  }

  /**
   * Delete cached video file
   */
  deleteCachedVideo(filename: string): boolean {
    if (!filename) return false;
    
    const localPath = path.join(this.cacheDir, filename);
    if (fs.existsSync(localPath)) {
      try {
        fs.unlinkSync(localPath);
        console.log(`🗑️ CACHE: Deleted cached video ${filename}`);
        return true;
      } catch (error) {
        console.error(`❌ CACHE: Failed to delete ${filename}:`, error);
        return false;
      }
    }
    return false;
  }

  /**
   * Get cache directory info
   */
  getCacheInfo(): { totalFiles: number; totalSize: number; files: string[] } {
    if (!fs.existsSync(this.cacheDir)) {
      return { totalFiles: 0, totalSize: 0, files: [] };
    }

    const files = fs.readdirSync(this.cacheDir).filter(file => 
      file.endsWith('.mp4') || file.endsWith('.mov') || file.endsWith('.avi')
    );

    let totalSize = 0;
    for (const file of files) {
      const filePath = path.join(this.cacheDir, file);
      if (fs.existsSync(filePath)) {
        totalSize += fs.statSync(filePath).size;
      }
    }

    return {
      totalFiles: files.length,
      totalSize,
      files
    };
  }
}

// Export singleton instance
export const videoCacheService = new VideoCacheService();