import { CURRENCY, type Category } from "./content";

/** 1250 → "F$1,250" */
export function formatMoney(amount: number): string {
  return `${CURRENCY.symbol}${amount.toLocaleString("en-US")}`;
}

export function formatCategory(category: Category): string {
  return category.name ? `${category.type} · ${category.name}` : category.type;
}

/** 754000 → "12:34", minutes and seconds */
export function formatCountdown(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function formatClock(at: number): string {
  return new Date(at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function formatAgo(at: number, now: number): string {
  const minutes = Math.floor((now - at) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return formatDate(at);
}

/** 0.075 → "7.5%" */
export function formatChance(p: number): string {
  return `${+(p * 100).toFixed(2)}%`;
}

export function formatDate(at: number): string {
  const date = new Date(at);
  return date.toLocaleDateString(undefined, {
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
    month: "short",
    day: "numeric",
  });
}
