import {
  Timestamp,
  type DocumentData,
  type Transaction,
} from "firebase-admin/firestore";
import { firestore } from "../lib/firebase";
import type { Tables } from "@db/schema";
export const getDb = firestore;
export function decode<T>(value: unknown): T {
  if (value instanceof Timestamp) return value.toDate() as T;
  if (Array.isArray(value)) return value.map((v) => decode(v)) as T;
  if (value && typeof value === "object" && !(value instanceof Date))
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, decode(v)]),
    ) as T;
  return value as T;
}
export async function rows<K extends keyof Tables>(
  table: K,
  field?: string,
  value?: unknown,
): Promise<Tables[K][]> {
  const collection = getDb().collection(table);
  const snapshot = await (
    field ? collection.where(field, "==", value) : collection
  ).get();
  return snapshot.docs.map((d) => decode<Tables[K]>(d.data()));
}
export async function row<K extends keyof Tables>(
  table: K,
  id: number,
): Promise<Tables[K] | null> {
  const d = await getDb().collection(table).doc(String(id)).get();
  return d.exists ? decode<Tables[K]>(d.data()) : null;
}
export async function nextId(table: string, tx?: Transaction): Promise<number> {
  const ref = getDb().collection("_counters").doc(table);
  const run = async (t: Transaction) => {
    const d = await t.get(ref);
    const id = Number(d.data()?.value || 0) + 1;
    t.set(ref, { value: id });
    return id;
  };
  return tx ? run(tx) : getDb().runTransaction(run);
}
export async function insert<K extends keyof Tables>(
  table: K,
  data: Omit<Tables[K], "id">,
): Promise<number> {
  const id = await nextId(table);
  await getDb()
    .collection(table)
    .doc(String(id))
    .create({ ...data, id });
  return id;
}
export async function update<K extends keyof Tables>(
  table: K,
  id: number,
  data: Partial<Tables[K]>,
) {
  await getDb()
    .collection(table)
    .doc(String(id))
    .update(data as DocumentData);
}
export async function remove(table: keyof Tables, id: number) {
  await getDb().collection(table).doc(String(id)).delete();
}
