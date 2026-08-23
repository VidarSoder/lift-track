import { TIMEZONE } from "@/data/program";
import type { TimeOfDay, Weekday } from "@/lib/types";

const WEEKDAYS: Weekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export function nowInZone(timeZone = TIMEZONE) {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone }),
  );
}

export function formatDateISO(date = nowInZone()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function weekdayOf(date = nowInZone()): Weekday {
  return WEEKDAYS[date.getDay()];
}

export function formatChartDate(iso: string, timeZone = TIMEZONE) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone,
  }).format(date);
}

export function formatNiceDate(iso: string, timeZone = TIMEZONE) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone,
  }).format(date);
}

export function formatShortWeekday(iso: string, timeZone = TIMEZONE) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    timeZone,
  }).format(date);
}

export function addDaysISO(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

export function weekDates(fromISO = formatDateISO()) {
  const date = new Date(`${fromISO}T12:00:00Z`);
  const day = date.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = addDaysISO(fromISO, mondayOffset);
  return Array.from({ length: 7 }, (_, i) => addDaysISO(monday, i));
}

export function programWeek(startISO: string, todayISO = formatDateISO()) {
  const start = new Date(`${startISO}T12:00:00Z`).getTime();
  const today = new Date(`${todayISO}T12:00:00Z`).getTime();
  const diff = Math.max(0, Math.floor((today - start) / 86_400_000));
  return (Math.floor(diff / 7) % 6) + 1;
}

export function currentTimeOfDay(date = nowInZone()): TimeOfDay {
  const hour = date.getHours();
  if (hour < 11) return "morning";
  if (hour < 16) return "afternoon";
  if (hour < 20) return "evening";
  return "night";
}

export function timeOfDayLabel(value: TimeOfDay) {
  return {
    morning: "Morning",
    afternoon: "Afternoon",
    evening: "Evening",
    night: "Night",
  }[value];
}

export function suggestedWindow(time: TimeOfDay) {
  if (time === "afternoon" || time === "evening") {
    return "This is the best window for heavy work. Body temperature and strength peak here, so keep warm-up honest and then push the compounds.";
  }
  if (time === "morning") {
    return "Morning sessions need a longer warm-up. Do the listed mobility, start the first lift one set lighter than last time, then climb.";
  }
  return "Late sessions are fine if you can still sleep. Drop caffeine, keep rest periods tight, and skip a max-out on the last isolation work.";
}
