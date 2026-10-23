import { serve } from "@hono/node-server";
import app from "./boot";
import { serveStaticFiles } from "./lib/vite";
serveStaticFiles(app);
serve({ fetch: app.fetch, port: Number(process.env.PORT || 3000) });
