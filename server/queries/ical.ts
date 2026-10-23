import { randomBytes } from "node:crypto";
import { getDb, rows, row, insert, update, decode } from "./connection";
import type { IcalFeed, Booking, Unit } from "@db/schema";
export type IcsEvent = {
  uid: string;
  start: string;
  end: string;
  summary?: string;
};

function unfold(text: string): string[] {
  const raw = text.split(/\r\n|\r|\n/);
  const lines: string[] = [];
  for (const line of raw) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  }
  return lines;
}

function toIsoDate(v: string): string | null {
  const m = v.trim().match(/^(\d{4})(\d{2})(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

export function parseICS(text: string): IcsEvent[] {
  const events: IcsEvent[] = [];
  let cur: {
    uid?: string;
    start?: string;
    end?: string;
    summary?: string;
  } | null = null;
  for (const line of unfold(text)) {
    const up = line.toUpperCase();
    if (up === "BEGIN:VEVENT") {
      cur = {};
      continue;
    }
    if (up === "END:VEVENT") {
      if (cur?.uid && cur.start) {
        // bez DTEND pretpostavi jednu noc
        let end = cur.end;
        if (!end) {
          const d = new Date(`${cur.start}T00:00:00Z`);
          d.setUTCDate(d.getUTCDate() + 1);
          end = d.toISOString().slice(0, 10);
        }
        if (end > cur.start)
          events.push({
            uid: cur.uid,
            start: cur.start,
            end,
            summary: cur.summary,
          });
      }
      cur = null;
      continue;
    }
    if (!cur) continue;
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const head = line.slice(0, colon);
    const name = head.split(";")[0].toUpperCase();
    const value = line.slice(colon + 1);
    if (name === "UID") cur.uid = value.trim().slice(0, 490);
    else if (name === "DTSTART") cur.start = toIsoDate(value) ?? undefined;
    else if (name === "DTEND") cur.end = toIsoDate(value) ?? undefined;
    else if (name === "SUMMARY") cur.summary = value.trim().slice(0, 200);
  }
  // dedupe po UID-u
  const seen = new Map<string, IcsEvent>();
  for (const e of events) seen.set(e.uid, e);
  return [...seen.values()];
}

const icsDate = (iso: string) => iso.replace(/-/g, "");

export async function generateICS(unitId: number): Promise<string | null> {
  const u = await row("units", unitId);
  if (!u) return null;
  const bs = (await rows("bookings", "unitId", unitId)).filter(
    (b) => b.status === "confirmed",
  );
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Adriatic Stays//Booking Calendar//HR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  for (const b of bs)
    lines.push(
      "BEGIN:VEVENT",
      `UID:booking-${b.code}@adriatic-stays`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${icsDate(b.checkIn)}`,
      `DTEND;VALUE=DATE:${icsDate(b.checkOut)}`,
      "SUMMARY:Zauzeto",
      "STATUS:CONFIRMED",
      "END:VEVENT",
    );
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
export async function feedsForUnit(unitId: number) {
  return rows("ical_feeds", "unitId", unitId);
}
export async function addFeed(unitId: number, label: string, url: string) {
  if (!(await row("units", unitId)))
    return { ok: false as const, reason: "no-unit" as const };
  const cleanUrl = url.replace(/^webcal:\/\//i, "https://");
  if (new URL(cleanUrl).protocol !== "https:")
    throw new Error("Koristite HTTPS adresu kalendara.");
  return {
    ok: true as const,
    id: await insert("ical_feeds", {
      unitId,
      label,
      url: cleanUrl,
      lastSyncAt: null,
      lastError: null,
      createdAt: new Date(),
    }),
  };
}
export async function removeFeed(feedId: number) {
  const db = getDb();
  await db.runTransaction(async (tx) => {
    const ref = db.collection("ical_feeds").doc(String(feedId));
    const feed = await tx.get(ref);
    if (!feed.exists) return;
    const unitRef = db.collection("units").doc(String(feed.data()!.unitId));
    const u = await tx.get(unitRef);
    const bs = await tx.get(
      db.collection("bookings").where("feedId", "==", feedId),
    );
    if (u.exists)
      tx.update(unitRef, {
        calendarVersion: Number(u.data()?.calendarVersion || 0) + 1,
      });
    for (const b of bs.docs) tx.update(b.ref, { status: "cancelled" });
    tx.delete(ref);
  });
}
export type SyncResult = {
  added: number;
  updated: number;
  cancelled: number;
  total: number;
};
export async function syncFeed(feed: IcalFeed): Promise<SyncResult> {
  const db = getDb();
  let text: string;
  try {
    const url = new URL(feed.url);
    if (url.protocol !== "https:")
      throw new Error("Samo HTTPS kalendari su dozvoljeni.");
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      redirect: "error",
      headers: { Accept: "text/calendar" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const reader = res.body?.getReader();
    if (!reader) throw new Error("Prazan kalendar");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > 2000000) {
        await reader.cancel();
        throw new Error("Kalendar je prevelik");
      }
      chunks.push(part.value);
    }
    text = Buffer.concat(chunks).toString("utf8");
    if (!text.includes("BEGIN:VCALENDAR"))
      throw new Error("Neispravan kalendar");
  } catch (e) {
    await update("ical_feeds", feed.id, {
      lastError: e instanceof Error ? e.message : "Greska dohvaćanja",
    });
    throw e;
  }
  const events = parseICS(text);
  if (events.length > 350)
    throw new Error("Kalendar ima vise od 350 dogadjaja.");
  return db.runTransaction(async (tx) => {
    const feedRef = db.collection("ical_feeds").doc(String(feed.id));
    if (!(await tx.get(feedRef)).exists) throw new Error("Feed je uklonjen");
    const unitRef = db.collection("units").doc(String(feed.unitId));
    const unitSnap = await tx.get(unitRef);
    if (!unitSnap.exists) throw new Error("Jedinica ne postoji");
    const u = decode<Unit>(unitSnap.data());
    const snap = await tx.get(
      db.collection("bookings").where("feedId", "==", feed.id),
    );
    const existing = snap.docs.map((d) => ({
      ref: d.ref,
      b: decode<Booking>(d.data()),
    }));
    const counter = db.collection("_counters").doc("bookings");
    const countSnap = await tx.get(counter);
    let counterValue = Number(countSnap.data()?.value || 0);
    const result: SyncResult = {
      added: 0,
      updated: 0,
      cancelled: 0,
      total: events.length,
    };
    for (const e of events) {
      const old = existing.find((x) => x.b.externalUid === e.uid);
      const nights = Math.round(
        (Date.parse(e.end) - Date.parse(e.start)) / 86400000,
      );
      if (!old) {
        const id = ++counterValue;
        tx.create(db.collection("bookings").doc(String(id)), {
          id,
          code: `EXT-${randomBytes(12).toString("hex")}`,
          unitId: u.id,
          propertyId: u.propertyId,
          guestName: e.summary || feed.label,
          guestEmail: `ical-${feed.id}@sync.local`,
          guestPhone: null,
          checkIn: e.start,
          checkOut: e.end,
          guests: 1,
          nights,
          totalPrice: "0",
          currency: u.currency,
          status: "confirmed",
          source: "external",
          externalUid: e.uid,
          feedId: feed.id,
          createdAt: new Date(),
        });
        result.added++;
      } else if (
        old.b.checkIn !== e.start ||
        old.b.checkOut !== e.end ||
        old.b.status !== "confirmed"
      ) {
        tx.update(old.ref, {
          checkIn: e.start,
          checkOut: e.end,
          nights,
          status: "confirmed",
        });
        result.updated++;
      }
    }
    for (const { b, ref } of existing)
      if (
        b.status === "confirmed" &&
        !events.some((e) => e.uid === b.externalUid)
      ) {
        tx.update(ref, { status: "cancelled" });
        result.cancelled++;
      }
    tx.set(counter, { value: counterValue });
    tx.update(unitRef, { calendarVersion: (u.calendarVersion || 0) + 1 });
    tx.update(feedRef, { lastSyncAt: new Date(), lastError: null });
    return result;
  });
}
export async function syncUnitFeeds(unitId: number) {
  const results = [];
  for (const feed of await feedsForUnit(unitId)) {
    try {
      results.push({
        feedId: feed.id,
        label: feed.label,
        ok: true as const,
        stats: await syncFeed(feed),
      });
    } catch (e) {
      results.push({
        feedId: feed.id,
        label: feed.label,
        ok: false as const,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
  return results;
}
