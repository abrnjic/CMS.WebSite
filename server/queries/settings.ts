import { firebaseConfigured } from "../lib/firebase.js";
import { getDb } from "./connection.js";
export async function getSiteSettings(): Promise<Record<string, string>> {
  if (!firebaseConfigured()) return {};
  const result = await getDb().collection("site_settings").get();
  return Object.fromEntries(
    result.docs.map((d) => [d.id, String(d.data().value)]),
  );
}
export async function setSiteSetting(key: string, value: string) {
  await getDb().collection("site_settings").doc(key).set({ value });
}
