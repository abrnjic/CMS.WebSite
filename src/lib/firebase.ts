import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// Public web app identifiers; server credentials are configured only on Vercel.
export const firebaseApp = initializeApp({
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    "AIzaSyBPyB32MB8EaBuzgceG4MIFq2rI522LIz0",
  authDomain: "cmswebsites.firebaseapp.com",
  projectId: "cmswebsites",
  storageBucket: "cmswebsites.firebasestorage.app",
  messagingSenderId: "312577257986",
  appId: "1:312577257986:web:4ea7051ed40846b140ad1b",
});
export const auth = getAuth(firebaseApp);
