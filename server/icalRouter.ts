import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, adminQuery } from "./middleware.js";
import {
  feedsForUnit,
  addFeed,
  removeFeed,
  syncUnitFeeds,
} from "./queries/ical.js";

export const icalRouter = createRouter({
  feeds: adminQuery
    .input(z.object({ unitId: z.number().int().positive() }))
    .query(({ input }) => feedsForUnit(input.unitId)),

  addFeed: adminQuery
    .input(
      z.object({
        unitId: z.number().int().positive(),
        label: z.string().min(1).max(255),
        url: z
          .string()
          .min(10)
          .max(1000)
          .regex(/^(https?|webcal):\/\//, "URL mora biti http(s) ili webcal"),
      }),
    )
    .mutation(async ({ input }) => {
      const r = await addFeed(input.unitId, input.label, input.url);
      if (!r.ok)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Jedinica ne postoji",
        });
      return r.id;
    }),

  removeFeed: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await removeFeed(input.id);
    }),

  syncUnit: adminQuery
    .input(z.object({ unitId: z.number().int().positive() }))
    .mutation(({ input }) => syncUnitFeeds(input.unitId)),
});
