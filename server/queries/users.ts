import type { InsertUser, User } from "@db/schema";
import { rows, getDb, nextId, decode } from "./connection";
export async function findUserByUnionId(uid: string) {
  return (await rows("users", "unionId", uid))[0];
}
export async function upsertUser(data: InsertUser) {
  return getDb().runTransaction(async (tx) => {
    const db = getDb();
    const key = db.collection("_user_ids").doc(data.unionId);
    const lookup = await tx.get(key);
    const now = new Date();
    const isOwner =
      !!process.env.OWNER_EMAIL &&
      data.email?.toLowerCase() === process.env.OWNER_EMAIL.toLowerCase();
    if (lookup.exists) {
      const ref = db.collection("users").doc(String(lookup.data()!.id));
      const snap = await tx.get(ref);
      const old = decode<User>(snap.data());
      const updated = {
        ...old,
        name: data.name ?? null,
        email: data.email ?? null,
        avatar: data.avatar ?? null,
        updatedAt: now,
        lastSignInAt: now,
        ...(isOwner ? { role: "admin" as const } : {}),
      };
      tx.set(ref, updated);
      return updated;
    }
    const id = await nextId("users", tx);
    const user: User = {
      id,
      unionId: data.unionId,
      name: data.name ?? null,
      email: data.email ?? null,
      avatar: data.avatar ?? null,
      role: isOwner ? "admin" : "user",
      createdAt: now,
      updatedAt: now,
      lastSignInAt: now,
    };
    tx.create(db.collection("users").doc(String(id)), user);
    tx.create(key, { id });
    return user;
  });
}
