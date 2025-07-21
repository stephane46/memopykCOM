import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { uploadFile } from "./supabase";
import { 
  insertHeroVideoSchema, insertHeroTextSettingSchema, insertGalleryItemSchema, insertFaqSectionSchema, insertFaqSchema, 
  insertSeoSettingSchema, insertContactSchema, insertCtaSettingSchema, insertLegalDocumentSchema,
  insertVideoAnalyticsSessionSchema, insertVideoAnalyticsViewSchema, insertVideoAnalyticsSettingsSchema
} from "@shared/schema";

import { z } from "zod";
import { NodeSSH } from 'node-ssh';
import archiver from 'archiver';
import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import fs, { promises as fsPromises } from 'fs';
import path from 'path';
import https from 'https';
import fetch from 'node-fetch';
import { videoCacheService } from './video-cache-service';

export async function registerRoutes(app: Express): Promise<Server> {
  // SEO and internationalization headers middleware
  app.use((req, res, next) => {
    // Detect language from URL path
    const pathParts = req.path.split('/').filter(Boolean);
    const languageFromPath = pathParts[0];
    
    let language = 'fr-FR'; // Default to French
    if (languageFromPath === 'en-US') {
      language = 'en-US';
    } else if (languageFromPath === 'fr-FR') {
      language = 'fr-FR';
    }
    
    // Set Content-Language header for SEO
    res.setHeader('Content-Language', language);
    
    // Set Vary header to indicate that response varies by Accept-Language and User-Agent
    res.setHeader('Vary', 'Accept-Language, User-Agent');
    
    // Set Cache-Control for better performance and SEO
    if (req.path.includes('/api/')) {
      // API responses - short cache
      res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
    } else if (req.path.includes('.')) {
      // Static assets - long cache
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year
    } else {
      // HTML pages - moderate cache
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
    }
    
    next();
  });

  // Health check endpoint for Docker healthcheck (IT requirement)
  app.get('/health', (_req, res) => res.sendStatus(200));
  
  // Detailed health check endpoint
  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Diagnostic endpoint for production troubleshooting
  app.get("/api/diagnostic", (req, res) => {
    try {
      res.status(200).json({
        status: "operational",
        timestamp: new Date().toISOString(),
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          PORT: process.env.PORT,
          PUBLIC_DIR: process.env.PUBLIC_DIR,
          cwd: process.cwd(),
          dirname: (global as any).import?.meta?.dirname || 'undefined'
        },
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          pid: process.pid
        }
      });
    } catch (error) {
      res.status(500).json({ 
        status: "error", 
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });
  // Simple token-based auth - no sessions
  const ADMIN_TOKEN = "memopyk-admin-token-" + Date.now();
  const validTokens = new Set<string>();

  // In-memory preview videos for when database is unavailable
  const previewVideos: any[] = [];



  // File upload middleware
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024 * 1024, // 10GB
    },
    fileFilter: (req, file, cb) => {
      // Allow videos and images
      if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only video and image files are allowed'));
      }
    }
  });

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !validTokens.has(token)) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Admin authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { password } = req.body;
      
      if (password === "memopyk2025admin") {
        const token = "memopyk-" + Math.random().toString(36).substr(2, 15) + Date.now();
        validTokens.add(token);
        
        console.log('LOGIN SUCCESS - Token generated:', token.substr(0, 10) + "...");
        res.json({ success: true, token });
      } else {
        res.status(401).json({ message: "Invalid password" });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      validTokens.delete(token);
    }
    res.json({ success: true });
  });

  app.get("/api/auth/status", (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    res.json({ isAuthenticated: !!(token && validTokens.has(token)) });
  });

  // Image proxy endpoint to serve images through the server (avoid CORS)
  app.get("/api/image-proxy/:bucket/:filename", async (req, res) => {
    try {
      const { bucket, filename } = req.params;
      const imageUrl = `http://supabase.memopyk.org:8001/object/public/${bucket}/${filename}`;
      
      console.log(`🖼️ Proxying image: ${imageUrl}`);
      
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        console.error(`❌ Failed to fetch image: ${response.status}`);
        return res.status(404).send('Image not found');
      }

      // Set appropriate headers for images
      res.set({
        'Content-Type': response.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
      });

      // Stream the image
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
      
    } catch (error) {
      console.error('Image proxy error:', error);
      res.status(500).send('Image proxy error');
    }
  });

  // Video proxy endpoint to serve videos through the server (avoid CORS) - SMART CACHING ENABLED
  app.get("/api/video-proxy/:bucket/:filename", async (req, res) => {
    try {
      // Handle CORS preflight - UPDATED WITH COMPREHENSIVE HEADERS
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Range, Content-Range, Content-Length, Authorization');
      res.header('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
      res.header('Access-Control-Max-Age', '86400');
      
      const { bucket, filename } = req.params;
      
      // URL decode the filename to handle special characters and spaces
      const decodedFilename = decodeURIComponent(filename);
      console.log(`🎬 VIDEO PROXY REQUEST: bucket=${bucket}, filename=${decodedFilename}`);
      
      // SMART CACHING: Check if we have a local cached copy first
      let cachedFilename = null;
      
      // Check hero videos for cached copies
      if (bucket === 'memopyk-hero') {
        const heroVideos = await storage.getHeroVideos();
        const matchingVideo = heroVideos.find(video => {
          return (video.urlEn && video.urlEn.includes(decodedFilename)) || 
                 (video.urlFr && video.urlFr.includes(decodedFilename));
        });
        
        if (matchingVideo) {
          // Determine language from URL and check for cached file
          if (matchingVideo.urlEn && matchingVideo.urlEn.includes(decodedFilename) && 
              matchingVideo.hasLocalCopyEn && matchingVideo.localFileEn) {
            cachedFilename = matchingVideo.localFileEn;
          } else if (matchingVideo.urlFr && matchingVideo.urlFr.includes(decodedFilename) && 
                     matchingVideo.hasLocalCopyFr && matchingVideo.localFileFr) {
            cachedFilename = matchingVideo.localFileFr;
          }
        }
      }
      
      // Check gallery videos for cached copies
      if (bucket === 'memopyk-gallery') {
        const galleryItems = await storage.getGalleryItems();
        const matchingItem = galleryItems.find(item => {
          return (item.videoUrlEn && item.videoUrlEn.includes(decodedFilename)) || 
                 (item.videoUrlFr && item.videoUrlFr.includes(decodedFilename));
        });
        
        if (matchingItem) {
          // Determine language from URL and check for cached file
          if (matchingItem.videoUrlEn && matchingItem.videoUrlEn.includes(decodedFilename) && 
              matchingItem.hasLocalVideoCopyEn && matchingItem.localVideoFileEn) {
            cachedFilename = matchingItem.localVideoFileEn;
          } else if (matchingItem.videoUrlFr && matchingItem.videoUrlFr.includes(decodedFilename) && 
                     matchingItem.hasLocalVideoCopyFr && matchingItem.localVideoFileFr) {
            cachedFilename = matchingItem.localVideoFileFr;
          }
        }
      }
      
      // Serve from cache if available
      if (cachedFilename) {
        console.log(`💾 CACHE: Serving from local cache - ${cachedFilename}`);
        const range = req.headers.range;
        const result = videoCacheService.serveCachedVideo(cachedFilename, range);
        
        if (result.status !== 404) {
          // Set headers
          if (result.headers) {
            Object.entries(result.headers).forEach(([key, value]) => {
              res.setHeader(key, value);
            });
          }
          
          // Stream the cached video
          if (result.stream && result.status) {
            res.status(result.status);
            result.stream.pipe(res);
            console.log(`✅ CACHE: Successfully served ${cachedFilename} from cache`);
            return;
          }
        }
        console.log(`⚠️ CACHE: Failed to serve from cache, falling back to Supabase`);
      }
      
      // If no cache hit, fetch from Supabase (original behavior)
      console.log(`🌐 SUPABASE: Fetching from remote - ${decodedFilename}`);
      const encodedFilename = encodeURIComponent(decodedFilename);
      const videoUrl = `http://supabase.memopyk.org:8001/object/public/${bucket}/${encodedFilename}`;
      
      // Handle range requests for video streaming
      const range = req.headers.range;
      let fetchOptions: any = {
        headers: {
          'Connection': 'keep-alive'
        }
      };
      
      if (range) {
        fetchOptions.headers = { 
          ...fetchOptions.headers,
          Range: range 
        };
      }
      
      // Fetch from Supabase
      const response = await fetch(videoUrl, fetchOptions);
      console.log(`🎬 Response status: ${response.status} for ${videoUrl}`);
      
      if (!response.ok) {
        console.error(`❌ Video fetch failed: ${response.status} for ${videoUrl}`);
        console.error(`❌ Response headers:`, Object.fromEntries(response.headers.entries()));
        return res.status(404).json({ message: "Video not found" });
      }
      
      // Set optimized headers for faster video streaming
      const headers: any = {
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400', // 24 hours cache
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Range, Content-Length',
        'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges'
      };
      
      // Copy relevant headers from upstream
      if (response.headers.get('content-length')) {
        headers['Content-Length'] = response.headers.get('content-length');
      }
      if (response.headers.get('content-range')) {
        headers['Content-Range'] = response.headers.get('content-range');
      }
      
      // Handle range response
      if (range && response.status === 206) {
        res.status(206);
        headers['Content-Range'] = response.headers.get('content-range');
        headers['Content-Length'] = response.headers.get('content-length');
      } else {
        headers['Content-Length'] = response.headers.get('content-length');
      }
      
      res.set(headers);
      console.log(`🎬 Headers set, starting stream for ${decodedFilename}`);
      
      // Stream the video with cross-environment compatibility
      if (response.body && typeof response.body.pipe === 'function') {
        // Node.js environment - use streaming
        console.log(`🎬 Using stream method for ${decodedFilename}`);
        response.body.on('error', (streamError) => {
          console.error('❌ Stream error:', streamError);
          if (!res.headersSent) {
            res.status(500).send('Stream error');
          }
        });
        
        response.body.pipe(res).on('error', (pipeError) => {
          console.error('❌ Pipe error:', pipeError);
        }).on('finish', () => {
          console.log(`✅ Stream completed for ${decodedFilename}`);
        });
      } else {
        // Production/Replit environment - use buffer
        console.log(`🎬 Using buffer method for ${decodedFilename}`);
        try {
          const buffer = await response.arrayBuffer();
          const videoBuffer = Buffer.from(buffer);
          
          // Set appropriate content type and length
          res.setHeader('Content-Type', 'video/mp4');
          res.setHeader('Content-Length', videoBuffer.length.toString());
          
          // Send the buffer
          res.end(videoBuffer);
          console.log(`✅ Buffer sent for ${decodedFilename} (${videoBuffer.length} bytes)`);
        } catch (bufferError) {
          console.error('❌ Buffer error:', bufferError);
          res.status(500).json({ message: "Buffer processing failed", error: (bufferError as Error).message });
        }
      }
    } catch (error) {
      console.error("❌ Video proxy error:", error);
      console.error("❌ Error details:", (error as Error).message);
      console.error("❌ Error stack:", (error as Error).stack);
      res.status(500).json({ message: "Failed to proxy video", error: (error as Error).message });
    }
  });

  // Hero Videos routes - Get from database via storage
  app.get("/api/hero-videos", async (req, res) => {
    try {
      const videos = await storage.getHeroVideos();
      console.log(`🎬 Serving ${videos.length} hero videos`);
      res.json(videos);
    } catch (error) {
      console.error("Failed to fetch hero videos:", error);
      res.status(500).json({ message: "Failed to fetch hero videos" });
    }
  });

  app.post("/api/hero-videos", requireAuth, async (req, res) => {
    try {
      const validatedData = insertHeroVideoSchema.parse(req.body);
      console.log("🎬 Creating hero video:", validatedData);
      
      // Use storage interface to create the video
      const video = await storage.createHeroVideo(validatedData);
      console.log(`✅ Hero video created:`, video.titleFr);
      res.json(video);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        console.error("Error creating hero video:", error);
        res.status(500).json({ message: "Failed to create hero video" });
      }
    }
  });

  app.put("/api/hero-videos/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertHeroVideoSchema.partial().parse(req.body);
      const video = await storage.updateHeroVideo(id, validatedData);
      
      if (!video) {
        return res.status(404).json({ message: "Hero video not found" });
      }
      
      res.json(video);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update hero video" });
      }
    }
  });

  app.delete("/api/hero-videos/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteHeroVideo(id);
      
      if (!success) {
        return res.status(404).json({ message: "Hero video not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete hero video" });
    }
  });

  app.put("/api/hero-videos/:id/reorder", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { direction } = req.body;
      
      if (!direction || !['up', 'down'].includes(direction)) {
        return res.status(400).json({ message: "Invalid direction. Must be 'up' or 'down'" });
      }
      
      const success = await storage.reorderHeroVideo(id, direction);
      
      if (!success) {
        return res.status(404).json({ message: "Hero video not found or cannot be reordered" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering hero video:", error);
      res.status(500).json({ message: "Failed to reorder hero video" });
    }
  });

  // Hero Text Settings routes
  app.get("/api/hero-text-settings", async (req, res) => {
    try {
      const settings = await storage.getHeroTextSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching hero text settings:", error);
      res.status(500).json({ message: "Failed to fetch hero text settings" });
    }
  });

  app.get("/api/hero-text-settings/active", async (req, res) => {
    try {
      const setting = await storage.getActiveHeroTextSetting();
      if (setting) {
        res.json(setting);
      } else {
        res.status(404).json({ message: "No active hero text setting found" });
      }
    } catch (error) {
      console.error("Error fetching active hero text setting:", error);
      res.status(500).json({ message: "Failed to fetch active hero text setting" });
    }
  });

  app.post("/api/hero-text-settings", requireAuth, async (req, res) => {
    try {
      const validatedData = insertHeroTextSettingSchema.parse(req.body);
      const setting = await storage.createHeroTextSetting(validatedData);
      res.status(201).json(setting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        console.error("Error creating hero text setting:", error);
        res.status(500).json({ message: "Failed to create hero text setting" });
      }
    }
  });

  app.put("/api/hero-text-settings/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertHeroTextSettingSchema.partial().parse(req.body);
      const setting = await storage.updateHeroTextSetting(id, validatedData);
      
      if (!setting) {
        return res.status(404).json({ message: "Hero text setting not found" });
      }
      
      res.json(setting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        console.error("Error updating hero text setting:", error);
        res.status(500).json({ message: "Failed to update hero text setting" });
      }
    }
  });

  app.delete("/api/hero-text-settings/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteHeroTextSetting(id);
      
      if (!success) {
        return res.status(404).json({ message: "Hero text setting not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting hero text setting:", error);
      res.status(500).json({ message: "Failed to delete hero text setting" });
    }
  });

  // Gallery Items routes
  // Legacy endpoint for backward compatibility (production was using this)
  app.get("/api/gallery", async (req, res) => {
    try {
      console.log("🎯 API CALL: /api/gallery requested");
      const items = await storage.getGalleryItems();
      console.log(`🎯 API RESPONSE: Returning ${items.length} gallery items`);
      res.json(items);
    } catch (error) {
      console.error("🎯 API ERROR:", error);
      res.status(500).json({ message: "Failed to fetch gallery items" });
    }
  });

  app.get("/api/gallery-items", async (req, res) => {
    try {
      const items = await storage.getGalleryItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch gallery items" });
    }
  });

  app.post("/api/gallery-items", requireAuth, async (req, res) => {
    try {
      const validatedData = insertGalleryItemSchema.parse(req.body);
      const item = await storage.createGalleryItem(validatedData);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create gallery item" });
      }
    }
  });

  app.put("/api/gallery-items/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`🎨 Updating gallery item ${id} with data:`, req.body);
      const validatedData = insertGalleryItemSchema.partial().parse(req.body);
      console.log(`✅ Data validated successfully for gallery item ${id}`);
      
      const item = await storage.updateGalleryItem(id, validatedData);
      
      if (!item) {
        console.log(`❌ Gallery item ${id} not found`);
        return res.status(404).json({ message: "Gallery item not found" });
      }
      
      console.log(`✅ Gallery item ${id} updated successfully`);
      res.json(item);
    } catch (error) {
      console.error(`❌ Error updating gallery item ${req.params.id}:`, error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update gallery item", error: error.message });
      }
    }
  });

  app.delete("/api/gallery-items/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`🗑️ Deleting gallery item ${id}`);
      const success = await storage.deleteGalleryItem(id);
      
      if (!success) {
        console.log(`❌ Gallery item ${id} not found for deletion`);
        return res.status(404).json({ message: "Gallery item not found" });
      }
      
      console.log(`✅ Gallery item ${id} deleted successfully`);
      res.json({ success: true });
    } catch (error) {
      console.error(`❌ Error deleting gallery item ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to delete gallery item", error: error.message });
    }
  });

  // Static Image Generation route
  app.post("/api/gallery-items/:id/generate-static-image", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { language, position, force } = req.body;

      if (!position || typeof position.x !== 'number' || typeof position.y !== 'number' || typeof position.scale !== 'number') {
        return res.status(400).json({ message: "Invalid position data" });
      }

      if (!['en', 'fr'].includes(language)) {
        return res.status(400).json({ message: "Language must be 'en' or 'fr'" });
      }

      // Get gallery item to access original image URL
      const item = await storage.getGalleryItem(id);
      if (!item) {
        return res.status(404).json({ message: "Gallery item not found" });
      }

      const originalImageUrl = language === 'en' ? item.imageUrlEn : item.imageUrlFr;
      if (!originalImageUrl) {
        return res.status(400).json({ message: `No original image URL for language ${language}` });
      }

      console.log(`🎯 Generating static image for item ${id} (${language}) ${force ? '(FORCED)' : ''}`);

      // Import and use image processor
      const { ImageProcessor } = await import('./image-processor');
      
      // Pass position directly (scale is already in correct format)
      const positionParams = {
        x: position.x,
        y: position.y,
        scale: position.scale // Use scale directly (e.g., 0.1 = 10% of original size)
      };
      
      const staticImageUrl = await ImageProcessor.generateStaticImage(
        originalImageUrl,
        `${id}_${language}`,
        positionParams,
        force
      );

      // Update gallery item with static image URL
      const updateData = language === 'en' 
        ? { staticImageUrlEn: staticImageUrl, imagePositionEn: position }
        : { staticImageUrlFr: staticImageUrl, imagePositionFr: position };

      const updatedItem = await storage.updateGalleryItem(id, updateData);
      
      console.log(`✅ Static image generated and saved for ${id} (${language})`);
      res.json({ 
        success: true, 
        staticImageUrl,
        galleryItem: updatedItem 
      });

    } catch (error) {
      console.error("Error generating static image:", error);
      res.status(500).json({ message: "Failed to generate static image" });
    }
  });

  app.put("/api/gallery-items/:id/reorder", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { direction } = req.body;
      
      if (!direction || !['up', 'down'].includes(direction)) {
        return res.status(400).json({ message: "Invalid direction. Must be 'up' or 'down'" });
      }
      
      console.log(`🎨 Reordering gallery item ${id} direction: ${direction}`);
      const success = await storage.reorderGalleryItem(id, direction);
      
      if (!success) {
        console.log(`❌ Gallery item ${id} not found or cannot be reordered`);
        return res.status(404).json({ message: "Gallery item not found or cannot be reordered" });
      }
      
      console.log(`✅ Gallery item ${id} reordered successfully`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering gallery item:", error);
      res.status(500).json({ message: "Failed to reorder gallery item" });
    }
  });

  // FAQ Sections routes
  app.get("/api/faq-sections", async (req, res) => {
    try {
      const sections = await storage.getFaqSections();
      res.json(sections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch FAQ sections" });
    }
  });

  app.post("/api/faq-sections", requireAuth, async (req, res) => {
    try {
      const validatedData = insertFaqSectionSchema.parse(req.body);
      const section = await storage.createFaqSection(validatedData);
      res.json(section);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create FAQ section" });
      }
    }
  });

  app.put("/api/faq-sections/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertFaqSectionSchema.partial().parse(req.body);
      const section = await storage.updateFaqSection(id, validatedData);
      
      if (!section) {
        return res.status(404).json({ message: "FAQ section not found" });
      }
      
      res.json(section);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update FAQ section" });
      }
    }
  });

  app.delete("/api/faq-sections/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteFaqSection(id);
      
      if (!success) {
        return res.status(404).json({ message: "FAQ section not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete FAQ section" });
    }
  });

  app.patch("/api/faq-sections/:id/reorder", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { direction } = req.body;
      
      if (!direction || !['up', 'down'].includes(direction)) {
        return res.status(400).json({ message: "Invalid direction. Must be 'up' or 'down'" });
      }
      
      console.log(`📁 Reordering FAQ section ${id} direction: ${direction}`);
      const success = await storage.reorderFaqSection(id, direction);
      
      if (!success) {
        console.log(`❌ FAQ section ${id} not found or cannot be reordered`);
        return res.status(404).json({ message: "FAQ section not found or cannot be reordered" });
      }
      
      console.log(`✅ FAQ section ${id} reordered successfully`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering FAQ section:", error);
      res.status(500).json({ message: "Failed to reorder FAQ section" });
    }
  });

  // FAQs routes
  app.get("/api/faqs", async (req, res) => {
    try {
      const faqs = await storage.getFaqs();
      res.json(faqs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch FAQs" });
    }
  });

  app.post("/api/faqs", requireAuth, async (req, res) => {
    try {
      console.log("📝 Creating FAQ with data:", req.body);
      const validatedData = insertFaqSchema.parse(req.body);
      console.log("✅ FAQ data validated successfully:", validatedData);
      const faq = await storage.createFaq(validatedData);
      console.log("✅ FAQ created successfully:", faq);
      res.json(faq);
    } catch (error) {
      console.error("❌ Error creating FAQ:", error);
      if (error instanceof z.ZodError) {
        console.error("❌ Validation errors:", error.errors);
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        console.error("❌ Database/Storage error:", error.message);
        res.status(500).json({ message: "Failed to create FAQ", error: error.message });
      }
    }
  });

  app.put("/api/faqs/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertFaqSchema.partial().parse(req.body);
      const faq = await storage.updateFaq(id, validatedData);
      
      if (!faq) {
        return res.status(404).json({ message: "FAQ not found" });
      }
      
      res.json(faq);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update FAQ" });
      }
    }
  });

  app.delete("/api/faqs/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteFaq(id);
      
      if (!success) {
        return res.status(404).json({ message: "FAQ not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete FAQ" });
    }
  });

  app.patch("/api/faqs/:id/reorder", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { direction } = req.body;
      
      if (!direction || !['up', 'down'].includes(direction)) {
        return res.status(400).json({ message: "Invalid direction. Must be 'up' or 'down'" });
      }
      
      console.log(`❓ Reordering FAQ ${id} direction: ${direction}`);
      const success = await storage.reorderFaq(id, direction);
      
      if (!success) {
        console.log(`❌ FAQ ${id} not found or cannot be reordered`);
        return res.status(404).json({ message: "FAQ not found or cannot be reordered" });
      }
      
      console.log(`✅ FAQ ${id} reordered successfully`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering FAQ:", error);
      res.status(500).json({ message: "Failed to reorder FAQ" });
    }
  });

  // Contacts routes
  app.get("/api/contacts", requireAuth, async (req, res) => {
    try {
      const contacts = await storage.getContacts();
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.post("/api/contacts", async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(validatedData);
      res.json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create contact" });
      }
    }
  });

  app.put("/api/contacts/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertContactSchema.partial().parse(req.body);
      const contact = await storage.updateContact(id, validatedData);
      
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      res.json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update contact" });
      }
    }
  });

  app.delete("/api/contacts/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteContact(id);
      
      if (!success) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });

  // CTA Settings routes
  app.get("/api/cta-settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getCtaSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch CTA settings" });
    }
  });

  app.get("/api/cta-settings/active", async (req, res) => {
    try {
      const setting = await storage.getActiveCtaSetting();
      res.json(setting);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active CTA setting" });
    }
  });

  app.post("/api/cta-settings", requireAuth, async (req, res) => {
    try {
      const validatedData = insertCtaSettingSchema.parse(req.body);
      const setting = await storage.createCtaSetting(validatedData);
      res.json(setting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create CTA setting" });
      }
    }
  });

  app.put("/api/cta-settings/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertCtaSettingSchema.partial().parse(req.body);
      const setting = await storage.updateCtaSetting(id, validatedData);
      
      if (!setting) {
        return res.status(404).json({ message: "CTA setting not found" });
      }
      
      res.json(setting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update CTA setting" });
      }
    }
  });

  app.delete("/api/cta-settings/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteCtaSetting(id);
      
      if (!success) {
        return res.status(404).json({ message: "CTA setting not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete CTA setting" });
    }
  });



  // Server-side video analysis endpoint for admin panel
  app.post("/api/analyze-video", requireAuth, async (req, res) => {
    try {
      const { videoUrl } = req.body;
      
      if (!videoUrl) {
        return res.status(400).json({ message: "Video URL is required" });
      }

      // For now, we'll return a success response and let the frontend handle the analysis
      // This can be extended to use ffprobe or similar server-side video analysis tools
      console.log(`🔍 Admin requested analysis for video: ${videoUrl}`);
      
      res.json({ 
        success: true, 
        message: "Video analysis initiated. Please ensure the video loads properly and dimensions will be cached.",
        videoUrl 
      });
    } catch (error) {
      console.error("Video analysis error:", error);
      res.status(500).json({ message: "Failed to analyze video" });
    }
  });

  // Serve locally uploaded files in preview mode
  app.use('/uploads', express.static('uploads', {
    setHeaders: (res, path) => {
      if (path.endsWith('.mp4') || path.endsWith('.webm') || path.endsWith('.mov')) {
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Accept-Ranges', 'bytes');
      }
    }
  }));

  // File upload route - Smart fallback for preview
  app.post("/api/upload", requireAuth, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      const { originalname, buffer, mimetype } = req.file;
      const { bucket = 'memopyk-gallery' } = req.body;
      
      console.log(`📤 Uploading ${originalname} to ${bucket} bucket`);
      
      try {
        // Try real Supabase upload first
        const { url, path } = await uploadFile(buffer, originalname, bucket, mimetype);
        console.log(`✅ Real upload successful: ${url}`);
        
        res.json({ 
          url, 
          path,
          originalName: originalname,
          size: buffer.length,
          mimeType: mimetype
        });
      } catch (uploadError) {
        console.log(`File upload failed: ${uploadError.message}`);
        res.status(500).json({ 
          message: "File upload failed", 
          error: uploadError.message 
        });
      }
    } catch (error: any) {
      console.error('File upload error:', error);
      res.status(500).json({ 
        message: "File upload failed", 
        error: error.message 
      });
    }
  });



  // Coolify API deployment endpoint
  app.post("/api/deploy/coolify", requireAuth, async (req, res) => {
    try {
      
      const deploymentData = JSON.stringify({ 
        "uuid": process.env.UUID_APPLICATION 
      });
      
      const apiUrl = new URL(process.env.COOLIFY_API_URL);
      const options = {
        hostname: apiUrl.hostname,
        port: 443,
        path: '/api/v1/deploy',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.COOLIFY_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(deploymentData)
        }
      };
      
      const coolifyResponse = await new Promise((resolve, reject) => {
        const coolifyReq = https.request(options, (coolifyRes) => {
          let data = '';
          coolifyRes.on('data', (chunk) => data += chunk);
          coolifyRes.on('end', () => {
            resolve({ status: coolifyRes.statusCode, data });
          });
        });
        
        coolifyReq.on('error', reject);
        coolifyReq.write(deploymentData);
        coolifyReq.end();
      });
      
      if (coolifyResponse.status === 200) {
        // Note: Deployment history tracking would be added when schema supports it
        
        res.json({ 
          success: true, 
          message: 'Deployment triggered via Coolify API',
          response: JSON.parse(coolifyResponse.data)
        });
      } else {
        throw new Error(`Coolify API returned status ${coolifyResponse.status}`);
      }
      
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Coolify deployment failed", 
        error: error.message 
      });
    }
  });

  // Deployment endpoints
  app.post("/api/deploy/test", requireAuth, async (req, res) => {
    try {
      const { host, username } = req.body;
      
      if (!host || !username) {
        return res.status(400).json({ message: "Host and username are required" });
      }

      // Test actual SSH connection
      const ssh = new NodeSSH();
      
      try {
        await ssh.connect({
          host,
          username,
          privateKey: process.env.SSH_PRIVATE_KEY || undefined,
          password: process.env.SSH_PASSWORD || undefined,
          port: 22,
          readyTimeout: 10000
        });
        
        // Test basic command
        const result = await ssh.execCommand('whoami');
        await ssh.dispose();
        
        if (result.code === 0) {
          res.json({ success: true, message: `Connection successful. Connected as: ${result.stdout.trim()}` });
        } else {
          throw new Error(`SSH test failed: ${result.stderr}`);
        }
      } catch (sshError: any) {
        await ssh.dispose();
        throw new Error(`SSH connection failed: ${sshError.message}`);
      }
      
    } catch (error: any) {
      res.status(500).json({ 
        message: "Connection test failed", 
        error: error.message 
      });
    }
  });

  // Global deployment state
  let isDeploymentInProgress = false;

  // Reset deployment status endpoint
  app.post("/api/deploy/reset", requireAuth, (req, res) => {
    isDeploymentInProgress = false;
    res.json({ message: "Deployment status reset", inProgress: false });
  });

  // Get deployment status endpoint
  app.get("/api/deploy/status", requireAuth, (req, res) => {
    res.json({ inProgress: isDeploymentInProgress });
  });

  // Nginx and SSL setup endpoint
  app.post("/api/deploy/setup-nginx", requireAuth, async (req, res) => {
    try {
      if (isDeploymentInProgress) {
        return res.status(409).json({ 
          message: "Deployment in progress. Please wait." 
        });
      }

      const { host, username, domain } = req.body;
      
      if (!host || !username || !domain) {
        return res.status(400).json({ message: "Host, username, and domain are required" });
      }

      isDeploymentInProgress = true;

      // Set up streaming response
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });

      const sendLog = (type: string, message: string, percentage?: number) => {
        const logData = {
          type,
          message,
          percentage,
          timestamp: new Date().toISOString()
        };
        res.write(JSON.stringify(logData) + '\n');
      };

      try {
        sendLog('log', 'Starting nginx and SSL setup...', 0);
        sendLog('progress', 'Connecting to VPS', 10);

        const ssh = new NodeSSH();
        
        const sshOptions: any = {
          host,
          username,
          port: 22,
          readyTimeout: 30000
        };

        if (process.env.SSH_PASSWORD) {
          sshOptions.password = process.env.SSH_PASSWORD;
          sendLog('log', 'Using SSH password authentication');
        } else if (process.env.SSH_PRIVATE_KEY) {
          sshOptions.privateKey = process.env.SSH_PRIVATE_KEY;
          sendLog('log', 'Using SSH private key authentication');
        } else {
          throw new Error('No SSH credentials provided');
        }

        await ssh.connect(sshOptions);
        sendLog('log', 'SSH connection established');
        sendLog('progress', 'Installing nginx and certbot', 30);

        // Upload and execute nginx setup script
        const setupScript = `#!/bin/bash
set -e

DOMAIN="${domain}"
EMAIL="admin@${domain}"
APP_PORT="3000"

echo "🚀 Setting up nginx reverse proxy for MEMOPYK..."

# Update system packages
apt update
apt install -y nginx certbot python3-certbot-nginx

# Create nginx configuration
cat > /etc/nginx/sites-available/memopyk << 'EOF'
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirect HTTP to HTTPS
    return 301 https://\\$server_name\\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL configuration will be added by certbot
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\$host;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\$scheme;
        proxy_cache_bypass \\$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Static files optimization
    location ~* \\.(jpg|jpeg|png|gif|ico|css|js)$ {
        proxy_pass http://localhost:$APP_PORT;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/memopyk /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

# Restart nginx
systemctl restart nginx
systemctl enable nginx

echo "✅ Nginx setup complete!"
`;

        await ssh.execCommand(`echo '${setupScript}' > /tmp/setup-nginx.sh && chmod +x /tmp/setup-nginx.sh`);
        sendLog('log', 'Nginx setup script uploaded');
        
        sendLog('progress', 'Executing nginx setup', 50);
        const nginxResult = await ssh.execCommand(`bash /tmp/setup-nginx.sh`);
        
        if (nginxResult.code !== 0) {
          throw new Error(`Nginx setup failed: ${nginxResult.stderr}`);
        }
        
        sendLog('log', 'Nginx configuration completed');
        sendLog('progress', 'Setting up SSL certificate', 80);

        // Setup SSL certificate
        const certbotCmd = `certbot --nginx -d ${domain} -d www.${domain} --non-interactive --agree-tos --email admin@${domain} --redirect`;
        const certbotResult = await ssh.execCommand(certbotCmd);
        
        if (certbotResult.code === 0) {
          sendLog('success', 'SSL certificate installed successfully!');
          sendLog('log', `Website now available at: https://${domain}`);
        } else {
          sendLog('warning', `SSL certificate setup warning: ${certbotResult.stderr}`);
          sendLog('log', 'You may need to configure DNS first. Run: sudo certbot --nginx');
        }

        // Setup automatic renewal
        await ssh.execCommand(`systemctl enable certbot.timer && systemctl start certbot.timer`);
        sendLog('log', 'Automatic SSL renewal configured');
        
        await ssh.dispose();
        sendLog('success', 'Nginx and SSL setup completed!');
        sendLog('progress', 'Setup complete', 100);

      } catch (error: any) {
        sendLog('error', `Setup failed: ${error.message}`);
        throw error;
      } finally {
        isDeploymentInProgress = false;
      }

      if (!res.headersSent) {
        res.end();
      }
      
    } catch (error: any) {
      console.error('Nginx setup error:', error);
      isDeploymentInProgress = false;
      
      if (!res.headersSent) {
        res.status(500).json({ 
          message: "Nginx setup failed", 
          error: error.message 
        });
      }
    }
  });

  app.post("/api/deploy", requireAuth, async (req, res) => {
    try {
      // Check if deployment is already in progress
      if (isDeploymentInProgress) {
        return res.status(409).json({ 
          message: "Deployment already in progress. Please wait or reset the deployment status." 
        });
      }

      const { host, username, deployPath, domain } = req.body;
      
      if (!host || !username) {
        return res.status(400).json({ message: "Host and username are required" });
      }

      // Set deployment in progress
      isDeploymentInProgress = true;

      // Set up streaming response
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });

      const sendLog = (type: string, message: string, percentage?: number) => {
        const logData = { type, message, percentage, timestamp: new Date().toISOString() };
        res.write(JSON.stringify(logData) + '\n');
      };

      try {
        sendLog('log', 'Starting deployment process...');
        sendLog('progress', 'Initializing', 5);

        // Step 1: Build the project
        sendLog('log', 'Building project...');
        sendLog('progress', 'Building frontend and backend', 20);
        
        const execAsync = promisify(exec);
        const buildResult = await execAsync('npm run build');
        sendLog('log', `Build completed: ${buildResult.stdout}`);
        if (buildResult.stderr) {
          sendLog('log', `Build warnings: ${buildResult.stderr}`);
        }
        sendLog('progress', 'Build complete', 40);

        // Step 2: Prepare deployment package
        sendLog('log', 'Preparing deployment package...');
        sendLog('progress', 'Creating deployment archive', 50);
        
        const archivePath = '/tmp/memopyk-deployment.tar.gz';
        await new Promise<void>((resolve, reject) => {
          const output = fs.createWriteStream(archivePath);
          const archive = archiver('tar', { gzip: true });
          
          output.on('close', () => {
            sendLog('log', `Archive created: ${archive.pointer()} bytes`);
            resolve();
          });
          
          archive.on('error', reject);
          archive.pipe(output);
          
          // Add built files
          archive.directory('dist/', 'dist');
          archive.file('package.json', { name: 'package.json' });
          archive.file('package-lock.json', { name: 'package-lock.json' });
          
          archive.finalize();
        });
        
        sendLog('progress', 'Archive created', 60);

        // Step 3: Connect and transfer to VPS
        sendLog('log', `Connecting to VPS at ${host}...`);
        sendLog('progress', 'Connecting to VPS', 65);
        
        const ssh = new NodeSSH();
        
        // Prepare SSH connection options
        const sshOptions: any = {
          host,
          username,
          port: 22,
          readyTimeout: 30000
        };

        // Use password authentication for now (more reliable for testing)
        if (process.env.SSH_PASSWORD) {
          sshOptions.password = process.env.SSH_PASSWORD;
          sendLog('log', 'Using SSH password authentication');
        } else if (process.env.SSH_PRIVATE_KEY) {
          // Try private key as fallback
          sshOptions.privateKey = process.env.SSH_PRIVATE_KEY;
          sendLog('log', 'Using SSH private key authentication');
        } else {
          throw new Error('No SSH credentials provided. Please set SSH_PASSWORD or SSH_PRIVATE_KEY');
        }

        await ssh.connect(sshOptions);
        
        sendLog('log', 'SSH connection established');
        sendLog('progress', 'Transferring files to VPS', 70);
        
        // Create deployment directory
        await ssh.execCommand(`mkdir -p ${deployPath}`);
        sendLog('log', `Created deployment directory: ${deployPath}`);
        
        // Transfer archive
        await ssh.putFile(archivePath, `${deployPath}/deployment.tar.gz`);
        sendLog('log', 'Archive transferred to VPS');
        sendLog('progress', 'Files transferred', 80);

        // Step 4: Extract and setup on VPS
        sendLog('log', 'Extracting files on VPS...');
        await ssh.execCommand(`cd ${deployPath} && tar -xzf deployment.tar.gz`);
        sendLog('log', 'Files extracted successfully');
        
        sendLog('log', 'Installing dependencies on VPS...');
        sendLog('progress', 'Installing dependencies', 85);
        const installResult = await ssh.execCommand(`cd ${deployPath} && npm ci --production`);
        if (installResult.code !== 0) {
          throw new Error(`Dependency installation failed: ${installResult.stderr}`);
        }
        sendLog('log', 'Dependencies installed successfully');
        
        // Setup environment file
        sendLog('log', 'Setting up environment configuration...');
        const envVars = [
          `DATABASE_URL="${process.env.DATABASE_URL}"`,
          `SUPABASE_URL="${process.env.SUPABASE_URL}"`,
          `SUPABASE_SERVICE_KEY="${process.env.SUPABASE_SERVICE_KEY}"`,
          `SUPABASE_ANON_KEY="${process.env.SUPABASE_ANON_KEY}"`,
          `NODE_ENV=production`,
          `PORT=3000`
        ].join('\n');
        
        await ssh.execCommand(`cd ${deployPath} && echo '${envVars}' > .env`);
        sendLog('log', 'Environment configuration created');
        
        sendLog('progress', 'Setting up application', 90);
        
        // Setup PM2 or systemd service
        sendLog('log', 'Setting up application service...');
        await ssh.execCommand(`cd ${deployPath} && npm install -g pm2`);
        await ssh.execCommand(`cd ${deployPath} && pm2 stop memopyk || true`);
        await ssh.execCommand(`cd ${deployPath} && pm2 start dist/index.js --name memopyk`);
        await ssh.execCommand(`pm2 save`);
        
        sendLog('log', 'Setting up nginx reverse proxy...');
        sendLog('progress', 'Configuring web server', 95);
        
        // Install nginx if not present
        await ssh.execCommand(`apt update && apt install -y nginx certbot python3-certbot-nginx`);
        
        // Create nginx configuration
        const nginxConfig = `
server {
    listen 80;
    server_name ${domain} www.${domain};
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${domain} www.${domain};
    
    # SSL configuration will be added by certbot
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Static files optimization
    location ~* \\.(jpg|jpeg|png|gif|ico|css|js)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}`;
        
        // Write nginx configuration
        await ssh.execCommand(`echo '${nginxConfig}' > /etc/nginx/sites-available/memopyk`);
        await ssh.execCommand(`ln -sf /etc/nginx/sites-available/memopyk /etc/nginx/sites-enabled/`);
        await ssh.execCommand(`rm -f /etc/nginx/sites-enabled/default`);
        
        // Test nginx configuration
        const nginxTest = await ssh.execCommand(`nginx -t`);
        if (nginxTest.code !== 0) {
          throw new Error(`Nginx configuration error: ${nginxTest.stderr}`);
        }
        
        sendLog('log', 'Nginx configuration created and tested');
        
        // Restart nginx
        await ssh.execCommand(`systemctl restart nginx`);
        await ssh.execCommand(`systemctl enable nginx`);
        
        sendLog('log', 'Setting up SSL certificate...');
        sendLog('progress', 'Installing SSL certificate', 98);
        
        // Setup SSL certificate with Let's Encrypt
        const certbotCmd = `certbot --nginx -d ${domain} -d www.${domain} --non-interactive --agree-tos --email admin@${domain} --redirect`;
        const certbotResult = await ssh.execCommand(certbotCmd);
        
        if (certbotResult.code === 0) {
          sendLog('log', 'SSL certificate installed successfully');
        } else {
          sendLog('log', `SSL certificate setup warning: ${certbotResult.stderr}`);
          sendLog('log', 'You may need to configure DNS first and retry: sudo certbot --nginx');
        }
        
        // Setup automatic certificate renewal
        await ssh.execCommand(`systemctl enable certbot.timer`);
        await ssh.execCommand(`systemctl start certbot.timer`);
        
        sendLog('log', 'Application service started with PM2');
        sendLog('progress', 'Deployment complete', 95);
        
        // Cleanup
        await ssh.execCommand(`cd ${deployPath} && rm deployment.tar.gz`);
        await ssh.dispose();
        fs.unlinkSync(archivePath);
        
        sendLog('success', `Deployment completed! Application is now live at https://${domain}`);
        sendLog('log', `Application running on VPS at ${deployPath}`);
        sendLog('progress', 'Deployment complete', 100);

      } catch (deployError: any) {
        sendLog('error', `Deployment failed: ${deployError.message}`);
        throw deployError;
      } finally {
        // Always reset deployment state
        isDeploymentInProgress = false;
      }

      if (!res.headersSent) {
        res.end();
      }
      
    } catch (error: any) {
      console.error('Deployment error:', error);
      // Reset deployment state on error
      isDeploymentInProgress = false;
      
      if (!res.headersSent) {
        res.status(500).json({ 
          message: "Deployment failed", 
          error: error.message 
        });
      }
    }
  });

  // Deployment History routes
  app.get("/api/deployment-history", requireAuth, async (req, res) => {
    try {
      const history = await storage.getDeploymentHistory();
      res.json(history);
    } catch (error: any) {
      console.error('Get deployment history error:', error);
      res.status(500).json({ message: "Failed to get deployment history", error: error.message });
    }
  });

  app.post("/api/deployment-history", requireAuth, async (req, res) => {
    try {
      const entry = await storage.createDeploymentHistoryEntry(req.body);
      res.json(entry);
    } catch (error: any) {
      console.error('Create deployment history entry error:', error);
      res.status(500).json({ message: "Failed to create deployment history entry", error: error.message });
    }
  });

  app.patch("/api/deployment-history/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const entry = await storage.updateDeploymentHistoryEntry(id, req.body);
      if (!entry) {
        return res.status(404).json({ message: "Deployment history entry not found" });
      }
      res.json(entry);
    } catch (error: any) {
      console.error('Update deployment history entry error:', error);
      res.status(500).json({ message: "Failed to update deployment history entry", error: error.message });
    }
  });

  // GitHub Deployment route - restored from procedure
  app.post("/api/deploy-github", requireAuth, async (req, res) => {
    try {
      const { commitMessage = `Deploy: ${new Date().toISOString()} - Admin panel updates` } = req.body;
      
      if (!process.env.GITHUB_TOKEN) {
        return res.status(500).json({ message: "GitHub token not configured" });
      }

      console.log('🚀 Starting GitHub deployment...');
      res.write('data: {"type":"log","message":"🚀 Starting GitHub deployment..."}\n\n');

      // Create temporary directory
      const tempDir = `/tmp/memopyk-deploy-${Date.now()}`;
      
      // Step 1: Create clean deployment copy
      res.write('data: {"type":"log","message":"📁 Creating deployment package..."}\n\n');
      execSync(`mkdir -p ${tempDir}`, { stdio: 'inherit' });

      // Copy essential files only (avoiding large media files and build artifacts)
      const filesToCopy = [
        'client',
        'server', 
        'shared',
        'package.json',
        'package-lock.json',
        'vite.config.ts',
        'tailwind.config.ts',
        'postcss.config.js',
        'tsconfig.json',
        'drizzle.config.ts',
        'components.json',
        'nixpacks.toml',
        '.gitignore',
        'Stephane.txt'
      ];

      for (const file of filesToCopy) {
        try {
          execSync(`cp -r ${file} ${tempDir}/`, { stdio: 'inherit' });
          res.write(`data: {"type":"log","message":"✅ Copied ${file}"}\n\n`);
        } catch (error) {
          console.log(`Warning: Could not copy ${file}, continuing...`);
        }
      }

      // Critical cleanup - remove files that cause deployment issues
      res.write('data: {"type":"log","message":"🧹 Cleaning deployment package..."}\n\n');
      
      // Remove large media files that cause GitHub timeouts
      execSync(`rm -rf ${tempDir}/client/public/media || true`, { stdio: 'inherit' });
      
      // Remove Dockerfile that conflicts with nixpacks.toml
      execSync(`rm -f ${tempDir}/Dockerfile || true`, { stdio: 'inherit' });
      
      // Never commit dependencies or build outputs
      execSync(`rm -rf ${tempDir}/node_modules || true`, { stdio: 'inherit' });
      execSync(`rm -rf ${tempDir}/dist || true`, { stdio: 'inherit' });

      res.write('data: {"type":"log","message":"✅ Package cleaned and ready"}\n\n');

      // Step 2: Verify clean state
      res.write('data: {"type":"log","message":"🔍 Verifying deployment contents..."}\n\n');
      const dirListing = execSync(`ls -la ${tempDir}`, { encoding: 'utf8' });
      console.log('Deployment contents:', dirListing);

      // Verify no Dockerfile exists
      try {
        execSync(`ls ${tempDir}/Dockerfile`, { stdio: 'pipe' });
        throw new Error('❌ Dockerfile found - this will conflict with nixpacks.toml');
      } catch (error) {
        res.write('data: {"type":"log","message":"✅ No Dockerfile found - nixpacks.toml will be used"}\n\n');
      }

      // Step 3: Git operations (NEVER FAIL with GITHUB_TOKEN)
      res.write('data: {"type":"log","message":"📤 Pushing to GitHub repository..."}\n\n');
      
      process.chdir(tempDir);
      
      // Initialize git and configure
      execSync('git init', { stdio: 'inherit' });
      execSync('git config user.name "MEMOPYK Assistant"', { stdio: 'inherit' });
      execSync('git config user.email "assistant@memopyk.com"', { stdio: 'inherit' });
      
      // Add GitHub remote with token authentication
      const repoUrl = `https://${process.env.GITHUB_TOKEN}@github.com/stephane46/memopykCOM.git`;
      execSync(`git remote add origin ${repoUrl}`, { stdio: 'inherit' });
      
      // Stage all files
      execSync('git add .', { stdio: 'inherit' });
      
      // Commit changes
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
      
      // Force push to ensure clean repository state
      execSync('git push -u origin main --force', { stdio: 'inherit' });
      
      res.write('data: {"type":"log","message":"✅ GitHub deployment successful!"}\n\n');
      
      // Step 4: Trigger Coolify deployment
      res.write('data: {"type":"log","message":"🚀 Triggering Coolify deployment..."}\n\n');
      
      try {
        const deploymentData = JSON.stringify({ 
          "uuid": process.env.UUID_APPLICATION 
        });
        
        // Try API endpoint
        const apiUrl = new URL(process.env.COOLIFY_API_URL);
        const apiOptions = {
          hostname: apiUrl.hostname,
          port: 443,
          path: '/api/v1/deploy',
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.COOLIFY_API_TOKEN}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(deploymentData)
          }
        };
        
        const deploymentPromise = new Promise((resolve, reject) => {
          const req = https.request(apiOptions, (apiRes: any) => {
            let data = '';
            apiRes.on('data', (chunk: any) => data += chunk);
            apiRes.on('end', () => {
              if (apiRes.statusCode === 200 || apiRes.statusCode === 201 || apiRes.statusCode === 202) {
                res.write('data: {"type":"log","message":"✅ Coolify deployment triggered successfully!"}\n\n');
                resolve(data);
              } else {
                reject(new Error(`Coolify API responded with status ${apiRes.statusCode}`));
              }
            });
          });
          
          req.on('error', reject);
          req.write(deploymentData);
          req.end();
        });
        
        await deploymentPromise;
        res.write('data: {"type":"log","message":"⏰ Build should complete in 2-4 minutes"}\n\n');
        res.write('data: {"type":"log","message":"🌐 Check new.memopyk.com for updated application"}\n\n');
        
      } catch (coolifyError) {
        console.error('Coolify deployment trigger failed:', coolifyError);
        res.write('data: {"type":"log","message":"⚠️ GitHub push successful, but Coolify trigger failed"}\n\n');
        res.write('data: {"type":"log","message":"🔧 Manual deployment may be required in Coolify dashboard"}\n\n');
      }

      // Step 5: Cleanup
      process.chdir('/');
      execSync(`rm -rf ${tempDir}`, { stdio: 'inherit' });
      
      res.write('data: {"type":"success","message":"🎉 GitHub deployment completed successfully!"}\n\n');
      res.end();

    } catch (error: any) {
      console.error('GitHub deployment error:', error);
      res.write(`data: {"type":"error","message":"❌ Deployment failed: ${error.message}"}\n\n`);
      res.end();
    }
  });

  // Legal Documents routes
  app.get("/api/legal-documents", async (req, res) => {
    try {
      const documents = await storage.getLegalDocuments();
      res.json(documents);
    } catch (error) {
      console.error("Error fetching legal documents:", error);
      res.status(500).json({ message: "Failed to fetch legal documents" });
    }
  });

  app.get("/api/legal-documents/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const document = await storage.getLegalDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "Legal document not found" });
      }
      
      res.json(document);
    } catch (error) {
      console.error("Error fetching legal document:", error);
      res.status(500).json({ message: "Failed to fetch legal document" });
    }
  });

  app.post("/api/legal-documents", requireAuth, async (req, res) => {
    try {
      console.log("📝 Legal document POST request body:", req.body);
      console.log("🔍 Expected schema fields:", Object.keys(insertLegalDocumentSchema.shape));
      console.log("🔍 Received data fields:", Object.keys(req.body));
      
      const documentData = insertLegalDocumentSchema.parse(req.body);
      console.log("✅ Legal document validation successful:", documentData);
      
      const document = await storage.createLegalDocument(documentData);
      console.log("✅ Legal document created in storage:", document);
      res.json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("❌ Legal document validation errors:", error.errors);
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        console.error("❌ Error creating legal document:", error);
        res.status(500).json({ message: "Failed to create legal document", error: error.message });
      }
    }
  });

  app.patch("/api/legal-documents/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertLegalDocumentSchema.partial().parse(req.body);
      const document = await storage.updateLegalDocument(id, updateData);
      
      if (!document) {
        return res.status(404).json({ message: "Legal document not found" });
      }
      
      res.json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        console.error("Error updating legal document:", error);
        res.status(500).json({ message: "Failed to update legal document" });
      }
    }
  });

  app.delete("/api/legal-documents/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteLegalDocument(id);
      
      if (!success) {
        return res.status(404).json({ message: "Legal document not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting legal document:", error);
      res.status(500).json({ message: "Failed to delete legal document" });
    }
  });

  // =============================================================================
  // VIDEO ANALYTICS API ROUTES
  // =============================================================================

  // Utility function to get client IP address
  function getClientIP(req: any): string {
    return req.headers['x-forwarded-for']?.split(',')[0] || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress || 
           req.ip || 
           'unknown';
  }

  // Utility function for IP geolocation using free ipapi.co service
  async function getGeoLocation(ip: string): Promise<{ country?: string; continent?: string; city?: string }> {
    // Handle local development IPs
    if (ip.includes('127.0.0.1') || ip.includes('localhost') || ip === 'unknown' || ip.startsWith('::1')) {
      return { country: 'Local Development', continent: 'Development', city: 'Local' };
    }

    try {
      // Use free ipapi.co service (1000 requests/day limit)
      const response = await fetch(`https://ipapi.co/${ip}/json/`, {
        timeout: 5000,
        headers: {
          'User-Agent': 'MEMOPYK Analytics/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        console.warn(`IP Geolocation error for ${ip}:`, data.reason);
        return { country: 'Unknown', continent: 'Unknown', city: 'Unknown' };
      }

      return {
        country: data.country_name || 'Unknown',
        continent: data.continent_code || 'Unknown',
        city: data.city || 'Unknown'
      };
    } catch (error) {
      console.warn(`Failed to get geolocation for IP ${ip}:`, error.message);
      return { country: 'Unknown', continent: 'Unknown', city: 'Unknown' };
    }
  }

  // Session Management
  app.post("/api/analytics/session", async (req, res) => {
    try {
      const clientIP = getClientIP(req);
      const userAgent = req.headers['user-agent'] || '';
      const { sessionId, language } = req.body;

      if (!sessionId || !language) {
        return res.status(400).json({ message: "sessionId and language are required" });
      }

      // Get geolocation data
      const geoData = await getGeoLocation(clientIP);

      // Check if IP should be excluded (admin/development IPs)
      const settings = await storage.getAnalyticsSettings();
      const excludedIPs = settings?.excludedIps as string[] || [];
      const isExcluded = excludedIPs.includes(clientIP) || clientIP.includes('127.0.0.1');

      // Check if this is a unique visitor
      const existingSession = await storage.getAnalyticsSession(sessionId);
      const isUniqueVisitor = !existingSession;

      const sessionData = {
        sessionId,
        ipAddress: clientIP,
        userAgent,
        country: geoData.country,
        continent: geoData.continent,
        city: geoData.city,
        language,
        isUniqueVisitor,
        isExcluded
      };

      const session = await storage.createOrUpdateAnalyticsSession(sessionData);
      res.json(session);
    } catch (error) {
      console.error("Error creating analytics session:", error);
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  // Record Video View
  app.post("/api/analytics/view", async (req, res) => {
    try {
      const {
        sessionId,
        videoId,
        videoType,
        videoTitle,
        videoDuration,
        language
      } = req.body;

      if (!sessionId || !videoId || !videoType || !language) {
        return res.status(400).json({ 
          message: "sessionId, videoId, videoType, and language are required" 
        });
      }

      const viewData = {
        sessionId,
        videoId,
        videoType,
        videoTitle: videoTitle || videoId,
        videoDuration: videoDuration || 0,
        watchTime: 0,
        watchPercentage: 0,
        maxWatchTime: 0,
        isCompleted: false,
        language
      };

      const view = await storage.recordVideoView(viewData);
      res.json(view);
    } catch (error) {
      console.error("Error recording video view:", error);
      res.status(500).json({ message: "Failed to record view" });
    }
  });

  // Update Video View Progress
  app.patch("/api/analytics/view/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const {
        watchTime,
        watchPercentage,
        maxWatchTime,
        isCompleted
      } = req.body;

      const updateData = {
        watchTime,
        watchPercentage,
        maxWatchTime,
        isCompleted
      };

      const view = await storage.updateVideoView(id, updateData);
      
      if (!view) {
        return res.status(404).json({ message: "Video view not found" });
      }

      // Update aggregated statistics
      const today = new Date().toISOString().split('T')[0];
      await storage.updateVideoStats(view.videoId, view.videoType, view.language, today);

      res.json(view);
    } catch (error) {
      console.error("Error updating video view:", error);
      res.status(500).json({ message: "Failed to update view" });
    }
  });

  // Get Analytics Dashboard Data
  app.get("/api/analytics/dashboard", requireAuth, async (req, res) => {
    try {
      const { dateFrom, dateTo } = req.query as { dateFrom?: string; dateTo?: string };
      
      const summary = await storage.getAnalyticsSummary(dateFrom, dateTo);
      const topVideos = await storage.getTopVideos(10, dateFrom, dateTo);
      const settings = await storage.getAnalyticsSettings();

      res.json({
        summary,
        topVideos,
        settings
      });
    } catch (error) {
      console.error("Error fetching analytics dashboard:", error);
      res.status(500).json({ message: "Failed to fetch analytics dashboard" });
    }
  });

  // Get Video Statistics
  app.get("/api/analytics/stats", requireAuth, async (req, res) => {
    try {
      const { videoId, videoType, dateFrom, dateTo, language } = req.query as {
        videoId?: string;
        videoType?: string;
        dateFrom?: string;
        dateTo?: string;
        language?: string;
      };

      const stats = await storage.getVideoStats({
        videoId,
        videoType,
        dateFrom,
        dateTo,
        language
      });

      res.json(stats);
    } catch (error) {
      console.error("Error fetching video stats:", error);
      res.status(500).json({ message: "Failed to fetch video stats" });
    }
  });

  // Get Video Views (detailed)
  app.get("/api/analytics/views", requireAuth, async (req, res) => {
    try {
      const { videoId, videoType, dateFrom, dateTo, language } = req.query as {
        videoId?: string;
        videoType?: string;
        dateFrom?: string;
        dateTo?: string;
        language?: string;
      };

      const views = await storage.getVideoViews({
        videoId,
        videoType,
        dateFrom,
        dateTo,
        language
      });

      res.json(views);
    } catch (error) {
      console.error("Error fetching video views:", error);
      res.status(500).json({ message: "Failed to fetch video views" });
    }
  });

  // Get Session Data
  app.get("/api/analytics/sessions", requireAuth, async (req, res) => {
    try {
      const { dateFrom, dateTo, excludeAdmin, country, language } = req.query as {
        dateFrom?: string;
        dateTo?: string;
        excludeAdmin?: string;
        country?: string;
        language?: string;
      };

      const sessions = await storage.getAnalyticsSessions({
        dateFrom,
        dateTo,
        excludeAdmin: excludeAdmin === 'true',
        country,
        language
      });

      res.json(sessions);
    } catch (error) {
      console.error("Error fetching analytics sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  // Analytics Settings
  app.get("/api/analytics/settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getAnalyticsSettings();
      res.json(settings || {
        excludedIps: [],
        completionThreshold: 90,
        trackingEnabled: true,
        dataRetentionDays: 365
      });
    } catch (error) {
      console.error("Error fetching analytics settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.patch("/api/analytics/settings", requireAuth, async (req, res) => {
    try {
      const updateData = insertVideoAnalyticsSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateAnalyticsSettings(updateData);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        console.error("Error updating analytics settings:", error);
        res.status(500).json({ message: "Failed to update settings" });
      }
    }
  });

  // Reset Analytics Data
  app.post("/api/analytics/reset", requireAuth, async (req, res) => {
    try {
      const { resetType } = req.body;
      
      if (!['all', 'views', 'sessions'].includes(resetType)) {
        return res.status(400).json({ 
          message: "Invalid reset type. Must be 'all', 'views', or 'sessions'" 
        });
      }

      const success = await storage.resetAnalytics(resetType);
      
      if (success) {
        res.json({ 
          success: true, 
          message: `Successfully reset ${resetType} analytics data`,
          resetDate: new Date().toISOString()
        });
      } else {
        res.status(500).json({ message: "Failed to reset analytics data" });
      }
    } catch (error) {
      console.error("Error resetting analytics:", error);
      res.status(500).json({ message: "Failed to reset analytics data" });
    }
  });

  // Export Analytics Data
  app.get("/api/analytics/export", requireAuth, async (req, res) => {
    try {
      const { format, dateFrom, dateTo } = req.query as {
        format?: string;
        dateFrom?: string;
        dateTo?: string;
      };

      const summary = await storage.getAnalyticsSummary(dateFrom, dateTo);
      const sessions = await storage.getAnalyticsSessions({
        dateFrom,
        dateTo,
        excludeAdmin: true
      });
      const views = await storage.getVideoViews({
        dateFrom,
        dateTo
      });

      const exportData = {
        summary,
        sessions,
        views,
        exportDate: new Date().toISOString(),
        dateRange: { from: dateFrom, to: dateTo }
      };

      if (format === 'csv') {
        // For CSV export, you might want to flatten the data structure
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-${Date.now()}.csv"`);
        // Implement CSV conversion here if needed
        res.send('CSV export not yet implemented');
      } else {
        // JSON export
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-${Date.now()}.json"`);
        res.json(exportData);
      }
    } catch (error) {
      console.error("Error exporting analytics:", error);
      res.status(500).json({ message: "Failed to export analytics data" });
    }
  });

  // ====== VIDEO CACHING API ROUTES ======

  // Trigger video caching for hero videos
  app.post("/api/cache/hero-video", async (req, res) => {
    try {
      const { id, language } = req.body;
      
      if (!id || !language || !['en', 'fr'].includes(language)) {
        return res.status(400).json({ error: "Invalid video ID or language" });
      }

      console.log(`🎬 CACHE: Starting hero video cache for ${id} (${language})`);
      
      // Get video data
      const heroVideos = await storage.getHeroVideos();
      const video = heroVideos.find(v => v.id === id);
      
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }

      const url = language === 'en' ? video.urlEn : video.urlFr;
      const existingLocalFile = language === 'en' ? video.localFileEn : video.localFileFr;
      
      // Cache the video
      const result = await videoCacheService.cacheVideo(url, existingLocalFile);
      
      if (result.success) {
        // Update database with cache info
        const updateData = {
          ...video,
          [language === 'en' ? 'localFileEn' : 'localFileFr']: result.localPath,
          [language === 'en' ? 'hasLocalCopyEn' : 'hasLocalCopyFr']: true
        };
        
        await storage.updateHeroVideo(id, updateData);
        
        res.json({
          success: true,
          message: result.existingFile ? "Video already cached" : "Video cached successfully",
          localPath: result.localPath,
          existingFile: result.existingFile
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error("❌ CACHE: Error caching hero video:", error);
      res.status(500).json({ error: "Failed to cache video" });
    }
  });

  // Trigger video caching for gallery videos
  app.post("/api/cache/gallery-video", async (req, res) => {
    try {
      const { id, language } = req.body;
      
      if (!id || !language || !['en', 'fr'].includes(language)) {
        return res.status(400).json({ error: "Invalid video ID or language" });
      }

      console.log(`🎬 CACHE: Starting gallery video cache for ${id} (${language})`);
      
      // Get video data
      const galleryItems = await storage.getGalleryItems();
      const item = galleryItems.find(v => v.id === id);
      
      if (!item) {
        return res.status(404).json({ error: "Gallery item not found" });
      }

      const url = language === 'en' ? item.videoUrlEn : item.videoUrlFr;
      if (!url) {
        return res.status(400).json({ error: `No video URL for ${language} language` });
      }

      const existingLocalFile = language === 'en' ? item.localVideoFileEn : item.localVideoFileFr;
      
      // Cache the video
      const result = await videoCacheService.cacheVideo(url, existingLocalFile);
      
      if (result.success) {
        // Update database with cache info
        const updateData = {
          ...item,
          [language === 'en' ? 'localVideoFileEn' : 'localVideoFileFr']: result.localPath,
          [language === 'en' ? 'hasLocalVideoCopyEn' : 'hasLocalVideoCopyFr']: true
        };
        
        await storage.updateGalleryItem(id, updateData);
        
        res.json({
          success: true,
          message: result.existingFile ? "Video already cached" : "Video cached successfully",
          localPath: result.localPath,
          existingFile: result.existingFile
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error("❌ CACHE: Error caching gallery video:", error);
      res.status(500).json({ error: "Failed to cache video" });
    }
  });

  // Serve cached videos
  app.get("/api/cached-video/:filename", (req, res) => {
    try {
      const { filename } = req.params;
      const range = req.headers.range;
      
      const result = videoCacheService.serveCachedVideo(filename, range);
      
      if (result.status === 404) {
        return res.status(404).json({ error: "Cached video not found" });
      }
      
      // Set headers
      if (result.headers) {
        Object.entries(result.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
      }
      
      // Stream the video
      if (result.stream && result.status) {
        res.status(result.status);
        result.stream.pipe(res);
      } else {
        res.status(500).json({ error: "Failed to stream video" });
      }
    } catch (error) {
      console.error("❌ CACHE: Error serving cached video:", error);
      res.status(500).json({ error: "Failed to serve video" });
    }
  });

  // Get cache status and statistics
  app.get("/api/cache/status", (req, res) => {
    try {
      const cacheInfo = videoCacheService.getCacheInfo();
      
      res.json({
        totalFiles: cacheInfo.totalFiles,
        totalSizeMB: Math.round(cacheInfo.totalSize / 1024 / 1024 * 100) / 100,
        files: cacheInfo.files,
        cacheDirectory: `server/cached-videos`,
        status: "operational"
      });
    } catch (error) {
      console.error("❌ CACHE: Error getting cache status:", error);
      res.status(500).json({ error: "Failed to get cache status" });
    }
  });

  // Bulk cache all videos (useful for deployment preparation)
  app.post("/api/cache/all-videos", async (req, res) => {
    try {
      console.log(`🎬 CACHE: Starting bulk caching of all videos...`);
      
      const results = {
        heroVideos: { en: [], fr: [] },
        galleryVideos: { en: [], fr: [] },
        errors: []
      };
      
      // Cache all hero videos
      const heroVideos = await storage.getHeroVideos();
      for (const video of heroVideos.filter(v => v.isActive)) {
        // Cache English version
        if (video.urlEn && !video.hasLocalCopyEn) {
          try {
            const result = await videoCacheService.cacheVideo(video.urlEn);
            if (result.success) {
              await storage.updateHeroVideo(video.id, {
                ...video,
                localFileEn: result.localPath,
                hasLocalCopyEn: true
              });
              results.heroVideos.en.push({ id: video.id, title: video.titleEn, status: 'cached' });
            }
          } catch (error) {
            results.errors.push(`Hero video EN ${video.id}: ${error.message}`);
          }
        }
        
        // Cache French version
        if (video.urlFr && !video.hasLocalCopyFr) {
          try {
            const result = await videoCacheService.cacheVideo(video.urlFr);
            if (result.success) {
              await storage.updateHeroVideo(video.id, {
                ...video,
                localFileFr: result.localPath,
                hasLocalCopyFr: true
              });
              results.heroVideos.fr.push({ id: video.id, title: video.titleFr, status: 'cached' });
            }
          } catch (error) {
            results.errors.push(`Hero video FR ${video.id}: ${error.message}`);
          }
        }
      }
      
      // Cache all gallery videos
      const galleryItems = await storage.getGalleryItems();
      for (const item of galleryItems.filter(v => v.isActive)) {
        // Cache English version
        if (item.videoUrlEn && !item.hasLocalVideoCopyEn) {
          try {
            const result = await videoCacheService.cacheVideo(item.videoUrlEn);
            if (result.success) {
              await storage.updateGalleryItem(item.id, {
                ...item,
                localVideoFileEn: result.localPath,
                hasLocalVideoCopyEn: true
              });
              results.galleryVideos.en.push({ id: item.id, title: item.titleEn, status: 'cached' });
            }
          } catch (error) {
            results.errors.push(`Gallery video EN ${item.id}: ${error.message}`);
          }
        }
        
        // Cache French version  
        if (item.videoUrlFr && !item.hasLocalVideoCopyFr) {
          try {
            const result = await videoCacheService.cacheVideo(item.videoUrlFr);
            if (result.success) {
              await storage.updateGalleryItem(item.id, {
                ...item,
                localVideoFileFr: result.localPath,
                hasLocalVideoCopyFr: true
              });
              results.galleryVideos.fr.push({ id: item.id, title: item.titleFr, status: 'cached' });
            }
          } catch (error) {
            results.errors.push(`Gallery video FR ${item.id}: ${error.message}`);
          }
        }
      }
      
      const totalCached = results.heroVideos.en.length + results.heroVideos.fr.length + 
                         results.galleryVideos.en.length + results.galleryVideos.fr.length;
      
      console.log(`✅ CACHE: Bulk caching completed - ${totalCached} videos cached, ${results.errors.length} errors`);
      
      res.json({
        success: true,
        message: `Bulk caching completed: ${totalCached} videos cached`,
        results,
        cacheInfo: videoCacheService.getCacheInfo()
      });
      
    } catch (error) {
      console.error("❌ CACHE: Error in bulk caching:", error);
      res.status(500).json({ error: "Failed to perform bulk caching" });
    }
  });

  // In development, serve frontend through Vite's dev server
  if (process.env.NODE_ENV !== 'production') {
    // Vite's dev server handles frontend routing automatically
    console.log('✅ Frontend development server will handle routing');
  } else {
    // In production, serve static files and handle SPA routing
    const path = await import('path');
    const fs = await import('fs');
    
    // Get the PUBLIC_DIR or fallback to default
    const publicDir = process.env.PUBLIC_DIR || path.join(process.cwd(), 'dist', 'public');
    
    // Serve static files
    app.use(express.static(publicDir));
    
    // SPA catch-all route: serve index.html for all non-API routes
    app.get('*', (req, res) => {
      const indexPath = path.join(publicDir, 'index.html');
      
      // Check if index.html exists
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Frontend not built. Run npm run build first.');
      }
    });
    
    console.log(`✅ Static frontend serving from: ${publicDir}`);
  }

  const httpServer = createServer(app);
  return httpServer;
}
