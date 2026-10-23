import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware.js";
import { getSiteSettings, setSiteSetting } from "./queries/settings.js";
import { getDb } from "./queries/connection.js";
import { firebaseConfigured } from "./lib/firebase.js";
export const setupRouter = createRouter({
  status: publicQuery.query(async () => {
    if (!firebaseConfigured())
      return {
        configured: false,
        hasUsers: false,
        hasContent: false,
        siteName: "",
        completed: false,
      };
    const [u, p, s] = await Promise.all([
      getDb().collection("users").limit(1).get(),
      getDb().collection("properties").limit(1).get(),
      getSiteSettings(),
    ]);
    return {
      configured: true,
      hasUsers: !u.empty,
      hasContent: !p.empty,
      siteName: s.siteName ?? "",
      completed: s.setupCompleted === "1",
    };
  }),
  complete: adminQuery
    .input(z.object({ siteName: z.string().min(1).max(255) }))
    .mutation(async ({ input }) => {
      await setSiteSetting("siteName", input.siteName.trim());
      await setSiteSetting("setupCompleted", "1");
      return { ok: true };
    }),
  seedDemo: adminQuery.mutation(async () => {
    const { runSeed } = await import("../db/seed.js");
    return { seeded: await runSeed() };
  }),
});
