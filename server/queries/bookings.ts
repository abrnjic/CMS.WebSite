import { randomBytes } from "node:crypto";
import { getDb, rows, row, nextId, decode } from "./connection.js";
import type { Unit, Booking } from "../../db/schema.js";
const DAY = 24 * 60 * 60 * 1000;

function eachNight(checkIn: string, checkOut: string): string[] {
  const out: string[] = [];
  let t = new Date(checkIn + "T00:00:00Z").getTime();
  const end = new Date(checkOut + "T00:00:00Z").getTime();
  while (t < end) {
    out.push(new Date(t).toISOString().slice(0, 10));
    t += DAY;
  }
  return out;
}

export function nightlyPrice(
  priceRules: { from: string; to: string; pricePerNight: number }[],
  basePrice: number,
  iso: string,
): number {
  const rule = priceRules.find((r) => r.from <= iso && iso <= r.to);
  return rule ? Number(rule.pricePerNight) : basePrice;
}

export interface QuoteResult {
  available: boolean;
  reason?: "booked" | "min-nights" | "past" | "invalid";
  nights?: number;
  accommodation?: number;
  cleaningFee?: number;
  touristTax?: number;
  total?: number;
}

export function calculateQuote(
  unit: Unit,
  checkIn: string,
  checkOut: string,
  guests: number,
): QuoteResult {
  const valid = (iso: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(iso) &&
    !isNaN(Date.parse(iso)) &&
    new Date(iso).toISOString().slice(0, 10) === iso;
  if (
    !valid(checkIn) ||
    !valid(checkOut) ||
    checkOut <= checkIn ||
    !Number.isInteger(guests) ||
    guests < 1 ||
    guests > unit.maxGuests
  )
    return { available: false, reason: "invalid" };
  if (checkIn < new Date().toISOString().slice(0, 10))
    return { available: false, reason: "past" };
  const count = (Date.parse(checkOut) - Date.parse(checkIn)) / DAY;
  if (count > 365) return { available: false, reason: "invalid" };
  if (count < unit.minNights) return { available: false, reason: "min-nights" };
  const accommodation =
    Math.round(
      eachNight(checkIn, checkOut).reduce(
        (sum, d) =>
          sum + nightlyPrice(unit.priceRules, Number(unit.basePrice), d),
        0,
      ) * 100,
    ) / 100;
  const cleaningFee = Number(unit.cleaningFee);
  const touristTax =
    Math.round(guests * count * Number(unit.touristTax) * 100) / 100;
  return {
    available: true,
    nights: count,
    accommodation,
    cleaningFee,
    touristTax,
    total: Math.round((accommodation + cleaningFee + touristTax) * 100) / 100,
  };
}
const overlaps = (b: Booking, start: string, end: string) =>
  b.status === "confirmed" && b.checkIn < end && b.checkOut > start;
export async function quoteBooking(
  unitId: number,
  checkIn: string,
  checkOut: string,
  guests: number,
): Promise<QuoteResult> {
  const u = await row("units", unitId);
  if (!u) return { available: false, reason: "invalid" };
  const quote = calculateQuote(u, checkIn, checkOut, guests);
  if (!quote.available) return quote;
  if (
    (await rows("bookings", "unitId", unitId)).some((b) =>
      overlaps(b, checkIn, checkOut),
    )
  )
    return { available: false, reason: "booked" };
  return quote;
}
export async function bookedDatesForUnit(unitId: number): Promise<string[]> {
  const dates = new Set<string>();
  for (const b of await rows("bookings", "unitId", unitId)) {
    if (b.status === "confirmed")
      for (const d of eachNight(b.checkIn, b.checkOut)) dates.add(d);
  }
  return [...dates];
}
export interface CreateBookingInput {
  unitId: number;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
}
export type CreateBookingResult =
  | { ok: true; code: string; total: number; nights: number }
  | { ok: false; reason: QuoteResult["reason"] };
export async function createBooking(
  input: CreateBookingInput,
): Promise<CreateBookingResult> {
  const db = getDb();
  const code = `AS-${randomBytes(12).toString("hex").toUpperCase()}`;
  return db.runTransaction(async (tx) => {
    const unitRef = db.collection("units").doc(String(input.unitId));
    const snap = await tx.get(unitRef);
    if (!snap.exists) return { ok: false, reason: "invalid" };
    const u = decode<Unit>(snap.data());
    const quote = calculateQuote(
      u,
      input.checkIn,
      input.checkOut,
      input.guests,
    );
    if (!quote.available) return { ok: false, reason: quote.reason };
    const existing = await tx.get(
      db.collection("bookings").where("unitId", "==", input.unitId),
    );
    if (
      existing.docs.some((d) =>
        overlaps(decode<Booking>(d.data()), input.checkIn, input.checkOut),
      )
    )
      return { ok: false, reason: "booked" };
    const id = await nextId("bookings", tx);
    // Every calendar writer touches the unit, so concurrent booking/sync retries see fresh availability.
    tx.update(unitRef, { calendarVersion: (u.calendarVersion || 0) + 1 });
    tx.create(db.collection("bookings").doc(String(id)), {
      id,
      code,
      unitId: u.id,
      propertyId: u.propertyId,
      guestName: input.guestName,
      guestEmail: input.guestEmail,
      guestPhone: input.guestPhone ?? null,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      guests: input.guests,
      nights: quote.nights!,
      totalPrice: String(quote.total!),
      currency: u.currency,
      status: "confirmed",
      source: "direct",
      externalUid: null,
      feedId: null,
      createdAt: new Date(),
    });
    return { ok: true, code, total: quote.total!, nights: quote.nights! };
  });
}
export async function allBookedRanges() {
  return (await rows("bookings"))
    .filter((b) => b.status === "confirmed")
    .map(({ unitId, checkIn, checkOut }) => ({ unitId, checkIn, checkOut }));
}
export async function bookingByCode(code: string) {
  return (await rows("bookings", "code", code))[0] ?? null;
}
export async function adminListBookings() {
  const [bs, us, ps] = await Promise.all([
    rows("bookings"),
    rows("units"),
    rows("properties"),
  ]);
  return bs
    .sort((a, b) => b.checkIn.localeCompare(a.checkIn))
    .map((b) => ({
      ...b,
      totalPrice: Number(b.totalPrice),
      unitName:
        us.find((u) => u.id === b.unitId)?.name ?? "(obrisana jedinica)",
      propertyName:
        ps.find((p) => p.id === b.propertyId)?.name ?? "(obrisan objekt)",
    }));
}
export async function cancelBooking(id: number) {
  return getDb().runTransaction(async (tx) => {
    const ref = getDb().collection("bookings").doc(String(id));
    const snap = await tx.get(ref);
    if (!snap.exists)
      return { ok: false as const, reason: "not-found" as const };
    const b = decode<Booking>(snap.data());
    if (b.status === "cancelled")
      return { ok: false as const, reason: "already-cancelled" as const };
    const unitRef = getDb().collection("units").doc(String(b.unitId));
    const u = await tx.get(unitRef);
    if (u.exists)
      tx.update(unitRef, {
        calendarVersion: Number(u.data()?.calendarVersion || 0) + 1,
      });
    tx.update(ref, { status: "cancelled" });
    return { ok: true as const };
  });
}
