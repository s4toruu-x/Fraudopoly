import { useEffect, useRef, useState } from "react";
import { useAccount } from "@/game/account";
import { CURRENCY } from "@/game/content";
import { formatMoney } from "@/game/format";
import { useGame } from "@/game/store";
import { HREF, type Page, type Route } from "@/lib/route";
import { setTheme, useTheme, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { AboutDev } from "./AboutDev";

const PAGES: { route: Page; label: string }[] = [
  { route: "pull", label: "Pull" },
  { route: "encyclopedia", label: "Encyclopedia" },
  { route: "trades", label: "Trades" },
  { route: "leaderboard", label: "Leaderboard" },
];

const THEMES: { id: Theme; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

export function Header({ route }: { route: Route }) {
  const account = useAccount();
  const game = useGame();
  const [menuOpen, setMenuOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const accountLabel = account.status === "signed-in" ? account.username : "Sign in";
  const pageLabel = PAGES.find((page) => page.route === route)?.label ?? (route === "account" ? "Account" : route === "profile" ? "Profile" : "Menu");

  useEffect(() => {
    setMenuOpen(false);
  }, [route]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setMenuOpen(false);
    const onPointer = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [menuOpen]);

  return (
    <header ref={header} className="relative flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <a href={HREF.pull} className="text-2xl font-bold tracking-tight">
          Fraudopoly
        </a>
        <div className="flex min-w-0 items-center gap-2">
          {game.player && (
            <p title={CURRENCY.name} className="balance">
              {formatMoney(game.player.fraudbucks)}
              <span className="sr-only"> {CURRENCY.name}</span>
            </p>
          )}
          <ThemeSwitch className="hidden sm:inline-flex" />
          {account.status !== "off" && (
            <a
              href={HREF.account}
              aria-current={route === "account" ? "page" : undefined}
              className="nav-link hidden max-w-32 truncate sm:block"
            >
              {accountLabel}
            </a>
          )}
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="menu"
            onClick={() => setMenuOpen(!menuOpen)}
            className="menu-button sm:hidden"
          >
            <span>{pageLabel}</span>
            <svg aria-hidden viewBox="0 0 16 16" className={cn("size-3.5 transition-transform", menuOpen && "rotate-180")}>
              <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <nav aria-label="Pages" className="hidden gap-1 sm:flex">
        {PAGES.map(({ route: page, label }) => (
          <a key={page} href={HREF[page]} aria-current={route === page ? "page" : undefined} className="nav-link">
            {label}
          </a>
        ))}
      </nav>

      {/* Kept mounted so it can animate out; inert while closed */}
      <div id="menu" data-open={menuOpen || undefined} inert={!menuOpen} className="menu sm:hidden">
        <nav aria-label="Pages" className="grid grid-cols-2 gap-2">
          {PAGES.map(({ route: page, label }) => (
            <a key={page} href={HREF[page]} aria-current={route === page ? "page" : undefined} className="menu-page">
              {label}
            </a>
          ))}
        </nav>
        {account.status !== "off" && (
          <>
            <hr className="border-border" />
            <a href={HREF.account} aria-current={route === "account" ? "page" : undefined} className="menu-account">
              <span aria-hidden className="menu-avatar">
                {account.status === "signed-in" ? Array.from(accountLabel ?? "?")[0]?.toUpperCase() : "?"}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold">
                  {account.status === "signed-in" ? accountLabel : "Sign in"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {account.status === "signed-in" ? "Your account" : "or create an account"}
                </span>
              </span>
              <svg aria-hidden viewBox="0 0 16 16" className="size-4 shrink-0 text-muted-foreground">
                <path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </a>
          </>
        )}
        <AboutDev block />
        <ThemeSwitch className="w-full [&>button]:flex-1" />
      </div>
    </header>
  );
}

export function ThemeSwitch({ className }: { className?: string }) {
  const theme = useTheme();

  return (
    <div role="group" aria-label="Theme" className={cn("segmented segmented-sm", className)}>
      {THEMES.map(({ id, label }) => (
        <button key={id} type="button" aria-pressed={theme === id} onClick={() => setTheme(id)}>
          {label}
        </button>
      ))}
    </div>
  );
}
