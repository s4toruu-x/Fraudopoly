import { useSyncExternalStore } from "react";

// Pages live in the URL hash, so any static host works and the back button moves between them.

export type Page = "pull" | "encyclopedia" | "trades" | "leaderboard" | "account" | "how";
export type Route = Page | "profile";

export const HREF: Record<Page, string> = {
  pull: "#/",
  encyclopedia: "#/encyclopedia",
  trades: "#/trades",
  leaderboard: "#/leaderboard",
  account: "#/account",
  how: "#/how-it-works",
};

const PROFILE = "#/player/";

/** A player's profile page */
export function profileHref(username: string): string {
  return PROFILE + encodeURIComponent(username);
}

function current(): Route {
  if (location.hash.startsWith(PROFILE)) return "profile";
  const found = (Object.keys(HREF) as Page[]).find((page) => HREF[page] === location.hash);
  return found ?? "pull";
}

function subscribe(listener: () => void) {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
}

export function useRoute(): Route {
  return useSyncExternalStore(subscribe, current);
}

/** The username in a profile address, or null on other pages */
export function useProfileName(): string | null {
  const hash = useSyncExternalStore(subscribe, () => location.hash);
  if (!hash.startsWith(PROFILE)) return null;
  try {
    return decodeURIComponent(hash.slice(PROFILE.length)) || null;
  } catch {
    return null;
  }
}
