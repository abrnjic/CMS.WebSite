import { getDb, rows, row, update } from "./connection";
import type { Property, Unit } from "@db/schema";
/** decimal/JSON stupci → brojevi; oblik prilagodjen frontend tipovima */
export function mapUnit(u: Unit) {
  return {
    id: u.id,
    propertyId: u.propertyId,
    name: u.name,
    maxGuests: u.maxGuests,
    bedrooms: u.bedrooms,
    beds: u.beds,
    bathrooms: u.bathrooms,
    sizeM2: u.sizeM2,
    basePrice: Number(u.basePrice),
    currency: u.currency,
    minNights: u.minNights,
    cleaningFee: Number(u.cleaningFee),
    touristTax: Number(u.touristTax),
    priceRules: u.priceRules,
    images: u.images,
  };
}

export function mapProperty(p: Property, us: Unit[]) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    type: p.type,
    tagline: p.tagline,
    description: p.description,
    city: p.city,
    region: p.region,
    address: p.address,
    lat: p.lat,
    lng: p.lng,
    rating: Number(p.rating),
    reviewCount: p.reviewCount,
    amenities: p.amenities,
    images: p.images,
    featured: p.featured,
    distanceToSea: p.distanceToSea,
    units: us.map(mapUnit),
  };
}

export type PropertyInput = {
  slug: string;
  name: string;
  type: "apartment" | "house" | "villa";
  tagline: string;
  description: string;
  city: string;
  region: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  amenities: string[];
  images: string[];
  featured: boolean;
  distanceToSea: number;
};

export type UnitInput = {
  name: string;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  sizeM2: number;
  basePrice: number;
  minNights: number;
  cleaningFee: number;
  touristTax: number;
  priceRules: {
    from: string;
    to: string;
    pricePerNight: number;
    label?: string;
  }[];
  images: string[];
};

export async function listProperties() {
  const [ps, us] = await Promise.all([rows("properties"), rows("units")]);
  return ps.map((p) =>
    mapProperty(
      p,
      us.filter((u) => u.propertyId === p.id),
    ),
  );
}
export async function propertyBySlug(slug: string) {
  const [p] = await rows("properties", "slug", slug);
  return p ? propertyById(p.id) : null;
}
export async function propertyById(id: number) {
  const p = await row("properties", id);
  return p ? mapProperty(p, await rows("units", "propertyId", id)) : null;
}
export async function getUnit(id: number) {
  const u = await row("units", id);
  return u ? mapUnit(u) : null;
}
export async function adminListProperties() {
  const [ps, bs] = await Promise.all([listProperties(), rows("bookings")]);
  return ps.map((p) => ({
    ...p,
    bookingCount: bs.filter((b) => b.propertyId === p.id).length,
  }));
}
const propertyRow = (d: PropertyInput) => ({ ...d, rating: String(d.rating) });
const unitRow = (propertyId: number, d: UnitInput) => ({
  ...d,
  propertyId,
  basePrice: String(d.basePrice),
  cleaningFee: String(d.cleaningFee),
  touristTax: String(d.touristTax),
});
export async function createProperty(d: PropertyInput) {
  const id = await getDb().runTransaction(async (tx) => {
    const slug = getDb().collection("_property_slugs").doc(d.slug);
    if ((await tx.get(slug)).exists) return null;
    const { nextId } = await import("./connection");
    const id = await nextId("properties", tx);
    tx.create(getDb().collection("properties").doc(String(id)), {
      ...propertyRow(d),
      id,
      createdAt: new Date(),
    });
    tx.create(slug, { id });
    return id;
  });
  return id === null
    ? { ok: false as const, reason: "slug-taken" as const }
    : { ok: true as const, id };
}
export async function updateProperty(id: number, d: PropertyInput) {
  const ok = await getDb().runTransaction(async (tx) => {
    const ref = getDb().collection("properties").doc(String(id));
    const slug = getDb().collection("_property_slugs").doc(d.slug);
    const [old, taken] = await Promise.all([tx.get(ref), tx.get(slug)]);
    if (!old.exists) throw new Error("Objekt ne postoji");
    if (taken.exists && taken.data()?.id !== id) return false;
    if (old.data()?.slug !== d.slug)
      tx.delete(getDb().collection("_property_slugs").doc(old.data()!.slug));
    tx.set(slug, { id });
    tx.update(ref, propertyRow(d));
    return true;
  });
  return ok
    ? { ok: true as const }
    : { ok: false as const, reason: "slug-taken" as const };
}
export async function deleteProperty(id: number) {
  const db = getDb();
  return db.runTransaction(async (tx) => {
    const ref = db.collection("properties").doc(String(id));
    const p = await tx.get(ref);
    const bs = await tx.get(
      db.collection("bookings").where("propertyId", "==", id),
    );
    if (!bs.empty)
      return { ok: false as const, reason: "has-bookings" as const };
    const us = await tx.get(
      db.collection("units").where("propertyId", "==", id),
    );
    const feeds = await Promise.all(
      us.docs.map((u) =>
        tx.get(db.collection("ical_feeds").where("unitId", "==", u.data().id)),
      ),
    );
    for (const snapshot of feeds)
      for (const f of snapshot.docs) tx.delete(f.ref);
    for (const u of us.docs) tx.delete(u.ref);
    tx.delete(ref);
    if (p.exists)
      tx.delete(db.collection("_property_slugs").doc(p.data()!.slug));
    return { ok: true as const };
  });
}
export async function createUnit(propertyId: number, d: UnitInput) {
  const db = getDb();
  return db.runTransaction(async (tx) => {
    const prop = await tx.get(
      db.collection("properties").doc(String(propertyId)),
    );
    if (!prop.exists) throw new Error("Objekt ne postoji");
    const { nextId } = await import("./connection");
    const id = await nextId("units", tx);
    tx.create(db.collection("units").doc(String(id)), {
      ...unitRow(propertyId, d),
      id,
      currency: "EUR",
      calendarVersion: 0,
    });
    return { id };
  });
}
export async function updateUnit(id: number, propertyId: number, d: UnitInput) {
  const u = await row("units", id);
  if (!u || u.propertyId !== propertyId)
    throw new Error("Jedinica ne pripada objektu");
  await update("units", id, unitRow(propertyId, d));
}
export async function deleteUnit(id: number) {
  const db = getDb();
  return db.runTransaction(async (tx) => {
    const ref = db.collection("units").doc(String(id));
    await tx.get(ref);
    const bs = await tx.get(
      db.collection("bookings").where("unitId", "==", id),
    );
    if (!bs.empty)
      return { ok: false as const, reason: "has-bookings" as const };
    const fs = await tx.get(
      db.collection("ical_feeds").where("unitId", "==", id),
    );
    for (const f of fs.docs) tx.delete(f.ref);
    tx.delete(ref);
    return { ok: true as const };
  });
}
