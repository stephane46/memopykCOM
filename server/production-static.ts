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
  
  // Serve static files
  app.use(express.static(staticPath));

  // Fallback to index.html for SPA routing
  app.use("*", (_req, res) => {
    const indexPath = path.join(staticPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Static files not found");
    }
  });

  console.log(`🌐 Static files served from: ${staticPath}`);
}