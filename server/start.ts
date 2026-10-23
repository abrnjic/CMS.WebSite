import { serve } from "@hono/node-server";
import app from "./boot.js";
import { serveStaticFiles } from "./lib/vite.js";
serveStaticFiles(app);
serve({ fetch: app.fetch, port: Number(process.env.PORT || 3000) });
