import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware.js";
import {
  listPages,
  getPage,
  publicPage,
  saveDraft,
  publishPage,
  unpublishPage,
  restoreRevision,
  createPage,
  deletePage,
  renamePage,
  updatePageSeo,
} from "./queries/cms.js";
import { firebaseConfigured } from "./lib/firebase.js";
import { getDb } from "./queries/connection.js";

const blocksSchema = z.array(
  z.object({
    id: z.string(),
    type: z.string(),
    props: z.record(z.string(), z.unknown()),
  }),
);

export const cmsRouter = createRouter({
  // javno: objavljena stranica po slug-u
  publicPage: publicQuery
    .input(z.object({ slug: z.string().min(1) }))
    .query(({ input }) => publicPage(input.slug)),

  // Samo administratori
  list: adminQuery.query(() => listPages()),

  get: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .query(({ input }) => getPage(input.id)),

  saveDraft: adminQuery
    .input(z.object({ id: z.number().int().positive(), blocks: blocksSchema }))
    .mutation(async ({ input }) => {
      await saveDraft(input.id, input.blocks);
    }),

  publish: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await publishPage(input.id);
    }),

  unpublish: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await unpublishPage(input.id);
    }),

  restoreRevision: adminQuery
    .input(
      z.object({
        id: z.number().int().positive(),
        version: z.number().int().positive(),
      }),
    )
    .mutation(({ input }) => restoreRevision(input.id, input.version)),

  createPage: adminQuery
    .input(
      z.object({
        title: z.string().min(1).max(255),
        slug: z
          .string()
          .min(1)
          .max(255)
          .regex(/^[a-z0-9-]+$/),
      }),
    )
    .mutation(({ input }) => createPage(input.title, input.slug)),

  deletePage: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await deletePage(input.id);
    }),

  renamePage: adminQuery
    .input(
      z.object({
        id: z.number().int().positive(),
        title: z.string().min(1).max(255),
      }),
    )
    .mutation(async ({ input }) => {
      await renamePage(input.id, input.title);
    }),

  updateSeo: adminQuery
    .input(
      z.object({
        id: z.number().int().positive(),
        seoTitle: z.string().max(255).nullable(),
        seoDescription: z.string().max(500).nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      await updatePageSeo(input.id, input.seoTitle, input.seoDescription);
    }),
});

export const themeRouter = createRouter({
  // javno: svi overridei (aktivna tema cita svoje tokene)
  getAll: publicQuery.query(async () => {
    if (!firebaseConfigured()) return {};
    const rows = await getDb().collection("theme_overrides").get();
    return Object.fromEntries(
      rows.docs.map((d) => [d.id, d.data().tokens as Record<string, string>]),
    );
  }),

  set: adminQuery
    .input(
      z.object({
        themeKey: z.string().min(1).max(64),
        token: z.string().min(1).max(64),
        value: z.string().max(128),
      }),
    )
    .mutation(async ({ input }) => {
      const ref = getDb().collection("theme_overrides").doc(input.themeKey);
      await getDb().runTransaction(async (tx) => {
        const old = await tx.get(ref);
        const tokens = {
          ...(old.data()?.tokens ?? {}),
          [input.token]: input.value,
        };
        tx.set(ref, {
          themeKey: input.themeKey,
          tokens,
          updatedAt: new Date(),
        });
      });
    }),

  reset: adminQuery
    .input(z.object({ themeKey: z.string().min(1).max(64) }))
    .mutation(async ({ input }) => {
      await getDb().collection("theme_overrides").doc(input.themeKey).delete();
    }),
});
