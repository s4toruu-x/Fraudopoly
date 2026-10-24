import { useSyncExternalStore } from "react";

// Pages live in the URL hash, so any static host works and the back button moves between them.

export type Route = "pull" | "encyclopedia" | "trades" | "leaderboard" | "account" | "how";

export const HREF: Record<Route, string> = {
  pull: "#/",
  encyclopedia: "#/encyclopedia",
  trades: "#/trades",
  leaderboard: "#/leaderboard",
  account: "#/account",
  how: "#/how-it-works",
};

function current(): Route {
  const found = (Object.keys(HREF) as Route[]).find((route) => HREF[route] === location.hash);
  return found ?? "pull";
}

function subscribe(listener: () => void) {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
}

export function useRoute(): Route {
  return useSyncExternalStore(subscribe, current);
}
