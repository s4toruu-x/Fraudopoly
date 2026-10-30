import { useAccount } from "@/game/account";
import { HREF } from "@/lib/route";
import { AboutDev } from "./AboutDev";

export function Footer() {
  const account = useAccount();

  return (
    <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
      <span>
        {account.status === "signed-in"
          ? account.username
            ? `Signed in as ${account.username}.`
            : "Signed in."
          : account.status === "guest"
            ? "Playing as a guest."
            : ""}
      </span>
      <div className="flex items-center gap-3">
        <a href={HREF.how} className="hover:text-foreground">
          How it works
        </a>
        {/* On a phone it's in the menu */}
        <AboutDev className="hidden sm:inline-flex" />
      </div>
    </footer>
  );
}
