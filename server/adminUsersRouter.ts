import { z } from "zod";

import { createRouter, authedQuery, adminQuery } from "./middleware";
import { Errors } from "@contracts/errors";
import { getDb } from "./queries/connection";

import {
  claimAdminInvite,
  createAdminInvite,
  listAdminInvites,
  listUsers,
} from "./queries/invites";

export const adminUsersRouter = createRouter({
  // admin: popis registriranih korisnika
  listUsers: adminQuery.query(() => listUsers()),

  // admin: popis pozivnica
  listInvites: adminQuery.query(() => listAdminInvites()),

  // admin: nova pozivnica za email adresu
  createInvite: adminQuery
    .input(z.object({ email: z.string().email().max(320) }))
    .mutation(({ input }) => createAdminInvite(input.email)),

  // admin: promjena uloge korisnika (prijenos vlasnistva nad instancom)
  // zastite: ne smijes mijenjati vlastitu ulogu; zadnji admin ne smije izgubiti ulogu
  setRole: adminQuery
    .input(
      z.object({
        userId: z.number().int().positive(),
        role: z.enum(["user", "admin"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) {
        throw Errors.forbidden("Ne mozete mijenjati ulogu vlastitog racuna.");
      }
      await getDb().runTransaction(async (tx) => {
        const db = getDb();
        const lock = db.collection("_locks").doc("admin-roles");
        await tx.get(lock);
        const target = db.collection("users").doc(String(input.userId));
        const user = await tx.get(target);
        if (!user.exists) throw Errors.forbidden("Korisnik ne postoji.");
        const admins = await tx.get(
          db.collection("users").where("role", "==", "admin"),
        );
        if (
          input.role === "user" &&
          user.data()?.role === "admin" &&
          admins.size <= 1
        )
          throw Errors.forbidden("Zadnji administrator mora ostati.");
        tx.set(lock, { updatedAt: new Date() });
        tx.update(target, { role: input.role, updatedAt: new Date() });
      });
      return { ok: true };
    }),

  // prijavljeni korisnik: preuzimanje admin uloge jednokratnim kodom
  claimInvite: authedQuery
    .input(z.object({ code: z.string().min(8).max(64) }))
    .mutation(async ({ ctx, input }) => {
      const invite = await claimAdminInvite(input.code, ctx.user.id);
      if (!invite) {
        throw Errors.forbidden(
          "Pozivnica nije valjana ili je vec iskoristena.",
        );
      }
      return { email: invite.email };
    }),
});
