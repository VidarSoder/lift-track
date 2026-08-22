import { createHmac, timingSafeEqual } from "crypto";

export function accessPassphrase() {
  const value = process.env.ACCESS_PASSPHRASE?.trim();
  if (!value) {
    throw new Error("ACCESS_PASSPHRASE is not configured");
  }
  return value;
}

export function athleteSalt() {
  const value = process.env.ATHLETE_SALT?.trim();
  if (!value) {
    throw new Error("ATHLETE_SALT is not configured");
  }
  return value;
}

export function sessionSecret() {
  const value = process.env.SESSION_SECRET?.trim();
  if (!value) {
    throw new Error("SESSION_SECRET is not configured");
  }
  return value;
}

export function normalizePassphrase(value: string) {
  return value.trim().toLowerCase();
}

export function passphraseMatches(value: string) {
  const expected = Buffer.from(normalizePassphrase(accessPassphrase()));
  const received = Buffer.from(normalizePassphrase(value));
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

export function sessionToken() {
  return createHmac("sha256", sessionSecret())
    .update("training-session-v1")
    .digest("hex");
}

export function sessionTokenMatches(value: string | undefined) {
  if (!value) return false;
  const expected = Buffer.from(sessionToken());
  const received = Buffer.from(value);
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

export async function athleteId() {
  const bytes = new TextEncoder().encode(
    `${normalizePassphrase(accessPassphrase())}::${athleteSalt()}`,
  );
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
