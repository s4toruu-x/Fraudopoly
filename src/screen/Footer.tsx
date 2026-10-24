import { useAccount } from "@/game/account";
import { HREF } from "@/lib/route";

export function Footer() {
  const account = useAccount();

  return (
    <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
      <span>
        {account.status === "signed-in"
          ? `Signed in as ${account.username}.`
          : account.status === "guest"
            ? "Playing as a guest."
            : ""}
      </span>
      <a href={HREF.how} className="hover:text-foreground">
        How it works
      </a>
    </footer>
  );
}
