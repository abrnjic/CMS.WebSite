import { createHash } from "node:crypto";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery, adminQuery } from "./middleware.js";
import { getDb, decode } from "./queries/connection.js";

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  status: "new" | "handled";
  createdAt: Date;
}

export const contactRouter = createRouter({
  submit: publicQuery
    .input(
      z.object({
        name: z.string().trim().min(2).max(255),
        email: z.string().trim().email().max(320),
        message: z.string().trim().min(10).max(5000),
        website: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      if (input.website) return { ok: true };
      const db = getDb();
      const email = input.email.toLowerCase();
      const limit = db
        .collection("contact_limits")
        .doc(createHash("sha256").update(email).digest("hex"));
      const ref = db.collection("inquiries").doc();
      await db.runTransaction(async (tx) => {
        const previous = await tx.get(limit);
        const now = Date.now();
        if (now - Number(previous.data()?.lastSentAt ?? 0) < 60_000)
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Pričekajte minutu prije slanja novog upita.",
          });
        tx.set(limit, { lastSentAt: now });
        tx.create(ref, {
          id: ref.id,
          name: input.name,
          email,
          message: input.message,
          status: "new",
          createdAt: new Date(now),
        });
      });
      return { ok: true };
    }),
  list: adminQuery.query(async () => {
    const snapshot = await getDb()
      .collection("inquiries")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();
    return snapshot.docs.map((d) => decode<Inquiry>(d.data()));
  }),
  setStatus: adminQuery
    .input(
      z.object({
        id: z.string().regex(/^[A-Za-z0-9]{20}$/),
        status: z.enum(["new", "handled"]),
      }),
    )
    .mutation(async ({ input }) => {
      const ref = getDb().collection("inquiries").doc(input.id);
      await getDb().runTransaction(async (tx) => {
        if (!(await tx.get(ref)).exists)
          throw new TRPCError({ code: "NOT_FOUND" });
        tx.update(ref, { status: input.status });
      });
      return { ok: true };
    }),
});
