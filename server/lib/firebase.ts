import "dotenv/config";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

export function firebaseConfigured() {
  return !!(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.FIRESTORE_EMULATOR_HOST
  );
}
export function adminApp() {
  const existing = getApps()[0];
  if (existing) return existing;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const projectId = process.env.FIREBASE_PROJECT_ID || "cmswebsites";
  if (!firebaseConfigured())
    throw new Error("Firebase server credentials are not configured.");
  const account = raw ? JSON.parse(raw) : undefined;
  if (account && account.project_id !== projectId)
    throw new Error(
      "Firebase service account project does not match FIREBASE_PROJECT_ID.",
    );
  return initializeApp({
    projectId,
    storageBucket:
      process.env.FIREBASE_STORAGE_BUCKET || "cmswebsites.firebasestorage.app",
    ...(account ? { credential: cert(account) } : {}),
  });
}
export const firebaseAuth = () => getAuth(adminApp());
export const firestore = () => getFirestore(adminApp());
export const firebaseBucket = () => getStorage(adminApp()).bucket();
