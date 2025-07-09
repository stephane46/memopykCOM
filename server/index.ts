// Import production patch FIRST to fix import.meta.dirname issue
import "./production-patch";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveProductionStatic } from "./production-static";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
    
    const server = await registerRoutes(app);
    console.log(`✅ Routes registered successfully`);

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
    console.error('❌ Failed to start MEMOPYK server:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
})();
