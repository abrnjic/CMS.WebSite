import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery, adminQuery } from "./middleware.js";
import {
  listProperties,
  propertyBySlug,
  adminListProperties,
  propertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  createUnit,
  updateUnit,
  deleteUnit,
} from "./queries/properties.js";

const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "ISO datum (YYYY-MM-DD)");

const priceRuleSchema = z.object({
  from: dateStr,
  to: dateStr,
  pricePerNight: z.number().positive(),
  label: z.string().max(255).optional(),
});

const propertyInput = z.object({
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/, "slug: mala slova, brojevi, crtice"),
  name: z.string().min(1).max(255),
  type: z.enum(["apartment", "house", "villa"]),
  tagline: z.string().min(1).max(500),
  description: z.string().min(1),
  city: z.string().min(1).max(255),
  region: z.string().min(1).max(255),
  address: z.string().min(1).max(500),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().min(0),
  amenities: z.array(z.string().max(64)),
  images: z.array(z.string().max(255)),
  featured: z.boolean(),
  distanceToSea: z.number().int().min(0),
});

const unitInput = z.object({
  name: z.string().min(1).max(255),
  maxGuests: z.number().int().min(1).max(50),
  bedrooms: z.number().int().min(0).max(20),
  beds: z.number().int().min(1).max(30),
  bathrooms: z.number().int().min(0).max(20),
  sizeM2: z.number().int().min(5).max(5000),
  basePrice: z.number().positive().max(100000),
  minNights: z.number().int().min(1).max(90),
  cleaningFee: z.number().min(0).max(10000),
  touristTax: z.number().min(0).max(100),
  priceRules: z.array(priceRuleSchema),
  images: z.array(z.string().max(255)),
});

export const propertiesRouter = createRouter({
  // ---------- javno ----------
  list: publicQuery.query(() => listProperties()),

  bySlug: publicQuery
    .input(z.object({ slug: z.string().min(1) }))
    .query(({ input }) => propertyBySlug(input.slug)),

  // ---------- admin ----------
  adminList: adminQuery.query(() => adminListProperties()),

  adminGet: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .query(({ input }) => propertyById(input.id)),

  create: adminQuery.input(propertyInput).mutation(async ({ input }) => {
    const r = await createProperty(input);
    if (!r.ok) throw new TRPCError({ code: "CONFLICT", message: "slug-taken" });
    return r.id;
  }),

  update: adminQuery
    .input(z.object({ id: z.number().int().positive(), data: propertyInput }))
    .mutation(async ({ input }) => {
      const r = await updateProperty(input.id, input.data);
      if (!r.ok)
        throw new TRPCError({ code: "CONFLICT", message: "slug-taken" });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const r = await deleteProperty(input.id);
      if (!r.ok)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Objekt ima rezervacije — prvo ih otkazite u bazi.",
        });
    }),

  createUnit: adminQuery
    .input(
      z.object({ propertyId: z.number().int().positive(), data: unitInput }),
    )
    .mutation(({ input }) => createUnit(input.propertyId, input.data)),

  updateUnit: adminQuery
    .input(
      z.object({
        id: z.number().int().positive(),
        propertyId: z.number().int().positive(),
        data: unitInput,
      }),
    )
    .mutation(async ({ input }) => {
      await updateUnit(input.id, input.propertyId, input.data);
    }),

  deleteUnit: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const r = await deleteUnit(input.id);
      if (!r.ok)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Jedinica ima rezervacije — brisanje nije moguce.",
        });
    }),
});
