import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { firebaseConfigured } from "./lib/firebase";
import { listProperties } from "./queries/properties";
import { listPages } from "./queries/cms";
const app = new Hono<{ Bindings: HttpBindings }>();
app.use(bodyLimit({ maxSize: Math.floor(4.4 * 1024 * 1024) }));
app.get("/api/health", (c) =>
  c.json({ ok: true, databaseConfigured: firebaseConfigured() }),
);
app.get("/api/ical/:key", async (c) => {
  const id = Number(c.req.param("key").replace(/\.ics$/i, ""));
  if (!Number.isSafeInteger(id) || id <= 0)
    return c.json({ error: "Bad request" }, 400);
  const { generateICS } = await import("./queries/ical");
  const ics = await generateICS(id);
  return ics
    ? c.text(ics, 200, {
        "Content-Type": "text/calendar; charset=utf-8",
        "Cache-Control": "no-cache",
      })
    : c.json({ error: "Not found" }, 404);
});
app.get("/api/media/*", async (c) => {
  const key = c.req.path.slice("/api/media/".length);
  if (!key.startsWith("media/") || key.includes("..") || key.length > 512)
    return c.json({ error: "Bad request" }, 400);
  const { storage } = await import("./lib/storage");
  try {
    const { url } = await storage.getPresignedUrl({ key });
    return c.redirect(url, 302);
  } catch {
    return c.json({ error: "Not found" }, 404);
  }
});
app.get("/robots.txt", (c) =>
  c.text(
    `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\nDisallow: /login\nDisallow: /postavljanje\nDisallow: /rezervacija\nDisallow: /potvrda\nSitemap: ${new URL(c.req.url).origin}/sitemap.xml\n`,
  ),
);
app.get("/sitemap.xml", async (c) => {
  const origin = new URL(c.req.url).origin;
  const escape = (s: string) =>
    s.replace(
      /[&<>"']/g,
      (ch) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&apos;",
        })[ch]!,
    );
  const [ps, pages] = firebaseConfigured()
    ? await Promise.all([listProperties(), listPages()])
    : [[], []];
  const paths = [
    "/",
    "/smjestaj",
    "/kako-funkcionira",
    ...ps.map((p) => `/smjestaj/${p.slug}`),
    ...pages
      .filter((p) => p.status === "published" && p.slug !== "home")
      .map((p) => `/stranica/${p.slug}`),
  ];
  return c.text(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((p) => `<url><loc>${escape(origin + p)}</loc></url>`).join("")}</urlset>`,
    200,
    { "Content-Type": "application/xml" },
  );
});
app.use("/api/trpc/*", (c) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  }),
);
app.all("/api/*", (c) => c.json({ error: "Not found" }, 404));
export default app;
