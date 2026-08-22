import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

const PROJECT_CONFIG = {
  apiKey: "REDACTED",
  authDomain: "vidar-training.firebaseapp.com",
  projectId: "vidar-training",
  storageBucket: "vidar-training.firebasestorage.app",
  messagingSenderId: "784724666438",
  appId: "1:784724666438:web:019e8541ace88fe3694247",
};

export function firebaseConfigFromEnv() {
  const apiKey =
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY || PROJECT_CONFIG.apiKey;
  const projectId =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || PROJECT_CONFIG.projectId;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || PROJECT_CONFIG.appId;
  if (!apiKey || !projectId || !appId) return null;
  return {
    apiKey,
    authDomain:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
      PROJECT_CONFIG.authDomain,
    projectId,
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      PROJECT_CONFIG.storageBucket,
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
      PROJECT_CONFIG.messagingSenderId,
    appId,
  };
}

export function isFirebaseConfigured() {
  return firebaseConfigFromEnv() !== null;
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function getFirebaseDb() {
  const config = firebaseConfigFromEnv();
  if (!config) return null;
  if (!app) {
    app = getApps()[0] ?? initializeApp(config);
    db = getFirestore(app);
  }
  return db;
}
