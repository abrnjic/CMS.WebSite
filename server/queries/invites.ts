import { randomBytes } from "node:crypto";
import { getDb, rows, insert, decode } from "./connection.js";
import type { AdminInvite, User } from "../../db/schema.js";
export function newInviteCode() {
  return randomBytes(24).toString("base64url");
}
export async function createAdminInvite(email: string) {
  const code = newInviteCode();
  const id = await insert("admin_invites", {
    email: email.trim().toLowerCase(),
    code,
    usedBy: null,
    usedAt: null,
    createdAt: new Date(),
  });
  return { id, code };
}
export async function listAdminInvites() {
  return (await rows("admin_invites")).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}
export async function listUsers() {
  return (await rows("users")).sort(
    (a, b) => b.lastSignInAt.getTime() - a.lastSignInAt.getTime(),
  );
}
export async function claimAdminInvite(code: string, userId: number) {
  return getDb().runTransaction(async (tx) => {
    const result = await tx.get(
      getDb().collection("admin_invites").where("code", "==", code),
    );
    const doc = result.docs[0];
    if (!doc) return null;
    const invite = decode<AdminInvite>(doc.data());
    if (invite.usedAt) return null;
    const userRef = getDb().collection("users").doc(String(userId));
    const snap = await tx.get(userRef);
    const user = decode<User>(snap.data());
    if (!user || user.email?.toLowerCase() !== invite.email) return null;
    tx.update(userRef, { role: "admin", updatedAt: new Date() });
    tx.update(doc.ref, { usedAt: new Date(), usedBy: userId });
    return invite;
  });
}
