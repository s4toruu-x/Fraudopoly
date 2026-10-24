import { useSyncExternalStore } from "react";

// "auto" follows the system. index.html applies the saved choice before the first paint.

export type Theme = "auto" | "light" | "dark";

const KEY = "fraudopoly.theme";
const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
const listeners = new Set<() => void>();

function read(): Theme {
  try {
    const saved = localStorage.getItem(KEY);
    return saved === "light" || saved === "dark" ? saved : "auto";
  } catch {
    return "auto";
  }
}

let theme = read();

function apply() {
  const dark = theme === "dark" || (theme === "auto" && systemDark.matches);
  document.documentElement.classList.toggle("dark", dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#09090b" : "#f4f4f5");
}

export function setTheme(next: Theme): void {
  theme = next;
  try {
    if (next === "auto") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, next);
  } catch {
    // Storage can be blocked (private mode); the theme still applies, just isn't saved.
  }
  apply();
  listeners.forEach((listener) => listener());
}

export function useTheme(): Theme {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => theme,
  );
}

export function startTheme(): void {
  apply();
  systemDark.addEventListener("change", apply);
}
