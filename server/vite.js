const path = require("path");
const fs = require("fs");

function log(message, source = "express") {
  console.log(`[${source}] ${message}`);
}

async function setupVite(app, server) {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });

  app.use(vite.middlewares);

  app.use("*", async (req, res, _next) => {
    // only redirect HTML requests that don't start with /api or /static
    if (req.path.startsWith("/api") || req.path.startsWith("/static")) {
      return _next();
    }

    // serve static files that don't start with /api or /static
    // if they were not matched by vite.middlewares
    const rootDir = process.cwd();
    const staticFile = path.join(rootDir, "client", req.path);
    
    if (staticFile.includes(".") && fs.existsSync(staticFile)) {
      return res.sendFile(staticFile);
    }

    const url = req.originalUrl;

    try {
      let template = fs.readFileSync(
        path.join(process.cwd(), "client", "index.html"),
        "utf-8",
      );

      template = await vite.transformIndexHtml(url, template);

      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      console.log(e.stack);
      res.status(500).end(e.stack);
    }
  });

  return server;
}

function serveStatic(app) {
  app.use(express.static(path.join(process.cwd(), "dist/public")));

  app.use("*", async (req, res, _next) => {
    // only redirect HTML requests that don't start with /api or /static
    if (req.path.startsWith("/api") || req.path.startsWith("/static")) {
      return _next();
    }

    const url = req.originalUrl;

    try {
      const template = fs.readFileSync(
        path.join(process.cwd(), "dist/public", "index.html"),
        "utf-8",
      );

      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      console.log(e.stack);
      res.status(500).end(e.stack);
    }
  });
}

module.exports = {
  log,
  setupVite,
  serveStatic
};