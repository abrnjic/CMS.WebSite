import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getSiteSettings, setSiteSetting } from "./queries/settings";

// dozvoljeni kljucevi site postavki (SEO + brending — bitno za prodane kopije)
const SETTINGS_KEYS = [
  "siteName",
  "seoDescription",
  "seoOgImage",
  "contactEmail",
  "contactPhone",
  "contactCity",
  "footerTagline",
] as const;

export const settingsRouter = createRouter({
  // javno: javni sajt cita siteName/defaults za meta tagove
  getAll: publicQuery.query(() => getSiteSettings()),

  set: adminQuery
    .input(
      z.object({
        key: z.enum(SETTINGS_KEYS),
        value: z.string().max(1000),
      }),
    )
    .mutation(async ({ input }) => {
      await setSiteSetting(input.key, input.value);
    }),
});
