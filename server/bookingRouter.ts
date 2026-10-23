import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware.js";
import { TRPCError } from "@trpc/server";
import {
  adminListBookings,
  bookedDatesForUnit,
  cancelBooking,
  createBooking,
  quoteBooking,
  bookingByCode,
  allBookedRanges,
} from "./queries/bookings.js";

const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "ISO datum (yyyy-MM-dd)");

export const bookingRouter = createRouter({
  /** zauzeti datumi za kalendar jedinice */
  bookedDates: publicQuery
    .input(z.object({ unitId: z.number().int().positive() }))
    .query(({ input }) => bookedDatesForUnit(input.unitId)),

  /** izracun cijene + provjera dostupnosti */
  quote: publicQuery
    .input(
      z.object({
        unitId: z.number().int().positive(),
        checkIn: dateStr,
        checkOut: dateStr,
        guests: z.number().int().min(1).max(20),
      }),
    )
    .query(({ input }) =>
      quoteBooking(input.unitId, input.checkIn, input.checkOut, input.guests),
    ),

  /** kreiranje rezervacije (overlap zasticen transakcijom) */
  create: publicQuery
    .input(
      z.object({
        unitId: z.number().int().positive(),
        checkIn: dateStr,
        checkOut: dateStr,
        guests: z.number().int().min(1).max(20),
        guestName: z.string().min(2).max(255),
        guestEmail: z.string().email().max(320),
        guestPhone: z.string().max(64).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await createBooking(input);
      if (result.ok === false) {
        throw new TRPCError({
          code: "CONFLICT",
          message: result.reason ?? "invalid",
        });
      }
      return result;
    }),

  /** svi potvrdjeni rasponi — za pretragu */
  allRanges: publicQuery.query(() => allBookedRanges()),

  byCode: publicQuery
    .input(z.object({ code: z.string().min(4).max(32) }))
    .query(async ({ input }) => {
      const b = await bookingByCode(input.code);
      if (!b) return null;
      return { ...b, totalPrice: Number(b.totalPrice) };
    }),

  // ---------- admin ----------
  adminList: adminQuery.query(() => adminListBookings()),

  cancel: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const r = await cancelBooking(input.id);
      if (!r.ok)
        throw new TRPCError({
          code: r.reason === "not-found" ? "NOT_FOUND" : "PRECONDITION_FAILED",
          message:
            r.reason === "not-found"
              ? "Rezervacija ne postoji"
              : "Rezervacija je vec otkazana",
        });
    }),
});
