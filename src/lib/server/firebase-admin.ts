import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

function serviceAccount(): ServiceAccount {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (inline) {
    return JSON.parse(inline) as ServiceAccount;
  }
  const filePath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    resolve(process.cwd(), ".secrets/firebase-admin.json");
  if (!existsSync(filePath)) {
    throw new Error("Firebase Admin credentials are not configured");
  }
  return JSON.parse(readFileSync(filePath, "utf8")) as ServiceAccount;
}

export function adminDb() {
  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount()),
      projectId: "vidar-training",
    });
  }
  return getFirestore();
}
