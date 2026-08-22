import { DEFAULT_PASSPHRASE } from "@/data/program";

const STORAGE_KEY = "training.pass";
const COOKIE = "training_pass";

export function configuredPassphrase() {
  return (
    process.env.NEXT_PUBLIC_ACCESS_PASSPHRASE?.trim() || DEFAULT_PASSPHRASE
  );
}

export function normalizePassphrase(value: string) {
  return value.trim().toLowerCase();
}

export function passphraseMatches(value: string) {
  return normalizePassphrase(value) === normalizePassphrase(configuredPassphrase());
}

export function persistUnlock(passphrase: string) {
  const value = normalizePassphrase(passphrase);
  window.localStorage.setItem(STORAGE_KEY, value);
  document.cookie = `${COOKIE}=1; path=/; max-age=31536000; samesite=lax`;
}

export function readStoredPassphrase() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

export function isUnlocked() {
  const stored = readStoredPassphrase();
  return stored ? passphraseMatches(stored) : false;
}

export function lock() {
  window.localStorage.removeItem(STORAGE_KEY);
  document.cookie = `${COOKIE}=; path=/; max-age=0`;
}

export async function athleteIdFromPassphrase(passphrase: string) {
  const salt = process.env.NEXT_PUBLIC_ATHLETE_SALT || "vidar-training-v1";
  const bytes = new TextEncoder().encode(
    `${normalizePassphrase(passphrase)}::${salt}`,
  );
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function unlockHref() {
  return `/go/${encodeURIComponent(configuredPassphrase())}`;
}
