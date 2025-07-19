import sharp from 'sharp';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

export class ImageProcessor {
  private static readonly STORAGE_DIR = path.join(process.cwd(), 'tmp', 'static-images');

  private static async downloadImage(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  static async generateStaticImage(
    originalImageUrl: string,
    galleryItemId: string,
    position: { x: number; y: number; scale: number },
    force?: boolean
  ): Promise<string> {
    console.log(`🎯 Generating static image for item ${galleryItemId} (${force ? 'FORCED' : 'normal'})`);
    console.log(`🖼️ Processing static image for gallery item ${galleryItemId}`);
    console.log(`🎯 Position: x=${position.x}, y=${position.y}, scale=${position.scale}`);

    try {
      // Step 1: Download the image from originalImageUrl into a Buffer
      const imageBuffer = await this.downloadImage(originalImageUrl);
      
      // Step 2: Read metadata to get originalWidth and originalHeight
      const metadata = await sharp(imageBuffer).metadata();
      const originalWidth = metadata.width ?? 0;
      const originalHeight = metadata.height ?? 0;
      
      if (!originalWidth || !originalHeight) {
        throw new Error('Invalid image metadata: missing width or height');
      }
      
      console.log(`📏 Original image: ${originalWidth}x${originalHeight}`);

      // SIMPLE CLEAN ALGORITHM
      // Image position (x, y) = where top-left of scaled image appears in 600x400 frame
      // Scale = zoom factor (1.0 = 100%, 0.5 = 50%, 2.0 = 200%)
      
      const frameWidth = 600;
      const frameHeight = 400;
      
      // What part of the original image is visible?
      // Frame shows area from (-position.x, -position.y) to (-position.x + frameWidth, -position.y + frameHeight) 
      // in scaled image coordinates. Convert to original image coordinates:
      const cropLeft = Math.round(-position.x / position.scale);
      const cropTop = Math.round(-position.y / position.scale);
      const cropWidth = Math.round(frameWidth / position.scale);
      const cropHeight = Math.round(frameHeight / position.scale);
      
      // Ensure crop is within image bounds
      const finalCropX = Math.max(0, Math.min(cropLeft, originalWidth));
      const finalCropY = Math.max(0, Math.min(cropTop, originalHeight));
      const finalCropWidth = Math.min(cropWidth, originalWidth - finalCropX);
      const finalCropHeight = Math.min(cropHeight, originalHeight - finalCropY);
      
      console.log(`🎯 Position: (${position.x}, ${position.y}), scale: ${position.scale}`);
      console.log(`🎯 Crop: x=${finalCropX}, y=${finalCropY}, w=${finalCropWidth}, h=${finalCropHeight}`);

      // Extract and resize
      const processedBuffer = await sharp(imageBuffer)
        .extract({ 
          left: finalCropX, 
          top: finalCropY, 
          width: finalCropWidth, 
          height: finalCropHeight 
        })
        .resize(600, 400, { 
          fit: 'fill',
          kernel: sharp.kernel.lanczos3,
          withoutEnlargement: false
        })
        .jpeg({ 
          quality: 100,
          progressive: false,
          mozjpeg: false,
          chromaSubsampling: '4:4:4'
        })
        .toBuffer();

      console.log(`✅ Image processed successfully`);

      // Step 7: Save to exact filename and upload
      const filename = `static_image_${galleryItemId}.jpg`;
      
      // Ensure storage directory exists
      await fs.mkdir(this.STORAGE_DIR, { recursive: true });
      const localPath = path.join(this.STORAGE_DIR, filename);
      
      // Clean up: remove old file if it exists to prevent accumulation
      try {
        await fs.unlink(localPath);
      } catch (error) {
        // File doesn't exist, which is fine
      }
      
      // Step 8: Overwrite the exact filename
      await fs.writeFile(localPath, processedBuffer);
      console.log(`💾 Saved locally: ${localPath}`);

      // Step 9: Upload to Supabase (overwriting any previous file)
      const uploadUrl = `http://supabase.memopyk.org:8001/object/memopyk-gallery/${filename}`;
      const publicUrl = `http://supabase.memopyk.org:8001/object/public/memopyk-gallery/${filename}`;
      
      try {
        // Try POST first (for new files)
        const postResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'image/jpeg',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
          },
          body: processedBuffer
        });

        if (postResponse.ok) {
          console.log(`📤 Static image uploaded via POST: ${publicUrl}`);
          return publicUrl;
        }

        console.log(`🔄 POST failed, trying PUT for ${filename}`);
        
        // Fallback to PUT (overwrites existing files)
        const putResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'image/jpeg',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
          },
          body: processedBuffer
        });

        if (putResponse.ok) {
          console.log(`📤 Static image uploaded via PUT: ${publicUrl}`);
          return publicUrl;
        }

        let errorText = '';
        try {
          errorText = await putResponse.text();
        } catch (e) {
          errorText = 'Unable to read error response';
        }
        console.error(`❌ Upload error: ${putResponse.status} - ${errorText}`);
        console.error(`❌ Request URL: ${uploadUrl}`);
        console.error(`❌ Request headers:`, putResponse.headers);
        throw new Error(`Upload failed: ${putResponse.status} - ${errorText}`);
      } catch (error) {
        console.error('Error uploading static image:', error);
        throw error;
      }

    } catch (error) {
      console.error('Error generating static image:', error);
      throw error;
    }
  }
}

export const imageProcessor = new ImageProcessor();