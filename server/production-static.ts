import express, { type Express } from "express";
import fs from "fs";
import path from "path";

/**
 * Production-safe static file serving that handles import.meta.dirname being undefined
 */
export function serveProductionStatic(app: Express) {
  // Handle the case where import.meta.dirname is undefined in production builds
  const getStaticPath = () => {
    // Try multiple possible locations for static files
    const possiblePaths = [
      process.env.PUBLIC_DIR, // From environment variable (set in docker-compose)
      process.env.STATIC_DIR, // Legacy environment variable
      path.resolve(process.cwd(), "public"), // From current working directory
      path.resolve(process.cwd(), "dist", "public"), // From dist/public
      "/usr/src/app/public", // Docker container path
      "/usr/src/app/dist/public", // Docker dist path
    ].filter(Boolean);

    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        console.log(`✅ Found static files at: ${testPath}`);
        return testPath;
      }
    }

    // If no static directory found, create a minimal fallback
    const fallbackPath = path.resolve(process.cwd(), "public");
    console.log(`⚠️  No static files found, creating fallback at: ${fallbackPath}`);
    
    if (!fs.existsSync(fallbackPath)) {
      fs.mkdirSync(fallbackPath, { recursive: true });
      // Create a minimal index.html
      fs.writeFileSync(
        path.join(fallbackPath, "index.html"),
        `<!DOCTYPE html>
<html>
<head>
    <title>MEMOPYK</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    <div id="root">
        <h1>MEMOPYK Platform</h1>
        <p>Loading...</p>
    </div>
</body>
</html>`
      );
    }
    
    return fallbackPath;
  };

  const staticPath = getStaticPath();
  
  // CRITICAL: Only serve static files for actual static assets, never for API routes
  app.use((req, res, next) => {
    // NEVER serve static files for API routes - let them pass through
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    // Only serve actual static files (assets, css, js, images)
    if (req.path.includes('/assets/') || 
        req.path.endsWith('.js') || 
        req.path.endsWith('.css') || 
        req.path.endsWith('.ico') || 
        req.path.endsWith('.png') || 
        req.path.endsWith('.jpg') || 
        req.path.endsWith('.gif') || 
        req.path.endsWith('.svg')) {
      return express.static(staticPath)(req, res, next);
    }
    
    next();
  });

  // SPA fallback - ABSOLUTE FINAL HANDLER - serve index.html only as last resort
  app.use('*', (req, res, next) => {
    // CRITICAL: API routes should NEVER reach this handler
    if (req.path.startsWith('/api/') || req.originalUrl.startsWith('/api/') || req.baseUrl.startsWith('/api/')) {
      console.log(`🚫 CRITICAL ERROR: API route ${req.path} reached static SPA handler - this should never happen!`);
      return res.status(500).json({ error: 'API route reached static handler', path: req.path, originalUrl: req.originalUrl, baseUrl: req.baseUrl });
    }
    
    // Only serve index.html for GET requests
    if (req.method === 'GET') {
      const indexPath = path.join(staticPath, "index.html");
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
    }
    
    next();
  });

  console.log(`🌐 Static files served from: ${staticPath}`);
}