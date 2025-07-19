// Import production patch FIRST to fix import.meta.dirname issue
import "./production-patch";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveProductionStatic } from "./production-static";

const app = express();

// SEO and internationalization headers middleware
app.use((req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Cache headers for different content types
  if (req.path.includes('/api/')) {
    // API responses: short cache for dynamic content
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  } else if (req.path.includes('/assets/') || req.path.includes('.js') || req.path.includes('.css')) {
    // Static assets: long cache
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    // HTML pages: moderate cache with revalidation
    res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
  }
  
  // Root URL specific headers for language detection
  if (req.path === '/') {
    res.setHeader('Vary', 'Accept-Language, Cookie');
    res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate'); // 5min cache for root
  }
  
  // Language-specific URL headers
  if (req.path.startsWith('/fr-FR/') || req.path.startsWith('/en-US/')) {
    res.setHeader('Content-Language', req.path.startsWith('/fr-FR/') ? 'fr-FR' : 'en-US');
    res.setHeader('Vary', 'Accept-Language');
  }
  
  next();
});

app.use(express.json({ limit: '10gb' }));
app.use(express.urlencoded({ extended: false, limit: '10gb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(`${new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit", 
        second: "2-digit",
        hour12: true,
      })} [express] ${logLine}`);
    }
  });

  next();
});

(async () => {
  try {
    console.log(`🚀 Starting MEMOPYK server in ${process.env.NODE_ENV || 'development'} mode...`);
    console.log(`📍 Working directory: ${process.cwd()}`);
    console.log(`🌐 Environment variables: NODE_ENV=${process.env.NODE_ENV}, PORT=${process.env.PORT}, PUBLIC_DIR=${process.env.PUBLIC_DIR}`);
    
    let server;
    try {
      server = await registerRoutes(app);
      console.log(`✅ Routes registered successfully`);
    } catch (routeError) {
      console.error("⚠️ Route registration failed, starting basic server:", routeError.message);
      // Create basic HTTP server if route registration fails
      const { createServer } = await import("http");
      server = createServer(app);
    }

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      console.error(`Error ${status}: ${message}`);
      res.status(status).json({ message });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (process.env.NODE_ENV === "development") {
      // Dynamically import vite functions only in development
      const { setupVite } = await import("./vite");
      await setupVite(app, server);
    } else {
      // Use production-safe static serving
      serveProductionStatic(app);
    }

    // Use PORT environment variable for Coolify or fallback to 3000 for production, 5000 for development
    const port = process.env.PORT ? parseInt(process.env.PORT) : (process.env.NODE_ENV === "production" ? 3000 : 5000);
    
    server.listen(port, "0.0.0.0", () => {
      console.log(`✅ MEMOPYK server running successfully on port ${port}`);
      console.log(`${new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit", 
        hour12: true,
      })} [express] serving on port ${port}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('⚠️ Server startup error:', error);
    console.log('🔧 Attempting emergency fallback server...');
    
    // Emergency fallback - start basic Express server
    const port = process.env.PORT ? parseInt(process.env.PORT) : (process.env.NODE_ENV === "production" ? 3000 : 5000);
    
    app.get('/health', (req, res) => {
      res.status(200).json({ 
        status: 'emergency', 
        message: 'Fallback server running - check logs for startup error',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    });
    
    app.get('/api/health', (req, res) => {
      res.status(200).json({ 
        status: 'emergency', 
        message: 'API endpoints unavailable - server in emergency mode',
        timestamp: new Date().toISOString()
      });
    });
    
    app.listen(port, "0.0.0.0", () => {
      console.log(`🚨 Emergency MEMOPYK server running on port ${port}`);
      console.log(`📍 Health check: http://localhost:${port}/health`);
      console.log(`📍 API health check: http://localhost:${port}/api/health`);
    });
  }
})();
