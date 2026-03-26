import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(value: number, min = 0, max = 10) {
  return Math.min(max, Math.max(min, value));
}

export function roundScore(value: number) {
  return Math.round(value * 10) / 10;
}

export function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, current) => sum + current, 0) / values.length;
}

export function scoreFromInverse(value: number, max: number) {
  const bounded = clamp(value, 0, max);
  return roundScore(10 - (bounded / max) * 10);
}

export function scoreFromRange(
  value: number,
  bestMin: number,
  bestMax: number,
  absoluteMax: number
) {
  if (value >= bestMin && value <= bestMax) return 10;
  if (value < bestMin) {
    return roundScore(clamp((value / bestMin) * 10));
  }

  const overflow = value - bestMax;
  const span = Math.max(absoluteMax - bestMax, 1);
  return roundScore(clamp(10 - (overflow / span) * 10));
}

export function toSentenceCase(text: string) {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat("es-419", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
}

export function getCurrencyByCountry(country: string) {
  const normalized = country.trim().toLowerCase();

  if (normalized.includes("chile")) return "CLP";
  if (normalized.includes("argentina")) return "ARS";
  if (normalized.includes("colombia")) return "COP";
  if (normalized.includes("per")) return "PEN";
  return "USD";
}

export function formatMoney(value: number, country: string) {
  return new Intl.NumberFormat("es-419", {
    style: "currency",
    currency: getCurrencyByCountry(country),
    maximumFractionDigits: 0
  }).format(value);
}

export function formatDate(dateIso: string) {
  return new Intl.DateTimeFormat("es-419", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(dateIso));
}
