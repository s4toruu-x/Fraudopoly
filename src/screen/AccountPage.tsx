import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/game/format";
import { fetchProfile } from "@/game/leaderboard";
import { useGame } from "@/game/store";
import { cn } from "@/lib/utils";
import { NameCard } from "./NameCard";
import { ShareIcon, Stat, rank } from "./Profile";
import { ProfileCardDialog } from "./ProfileCard";
import {
  MIN_PASSWORD_LENGTH,
  USERNAME_PATTERN,
  connectDiscord,
  continueWithDiscord,
  dismissNotice,
  signIn,
  signInWithDiscord,
  signOut,
  signUp,
  useAccount,
} from "@/game/account";

export function AccountPage() {
  const account = useAccount();
  const game = useGame();
  // A guest with nothing yet can just sign in; one with progress connects Discord to keep it
  const hasProgress =
    (game.player?.pulls ?? 0) > 0 ||
    (game.player?.fraudbucks ?? 0) > 0 ||
    game.entries.some((entry) => entry.count > 0);

  return (
    <section
      aria-labelledby="account-title"
      className={cn("flex flex-col gap-4", account.status === "signed-in" ? "max-w-2xl" : "max-w-md")}
    >
      <h2 id="account-title" className="text-xl font-semibold">
        Account
      </h2>

      {account.status === "off" && (
        <p className="text-muted-foreground">
          The game's server isn't set up on this copy. See the README.
        </p>
      )}
      {account.status === "checking" && <p className="text-muted-foreground">Connecting…</p>}
      {account.notice && (
        <DiscordNotice message={account.notice} taken={account.discordTaken} guest={account.status === "guest"} />
      )}
      {account.status === "error" && (
        <>
          <p role="alert" className="text-danger">
            {account.error}
          </p>
          <SignInForm guest={false} />
        </>
      )}
      {account.status === "guest" && (
        <>
          <p className="text-muted-foreground">
            Playing as guest. Your names are kept on the server for this browser. Create an account
            to keep them, play on other devices and trade.
          </p>
          <div className="flex flex-col gap-2">
            <DiscordButton onClick={() => continueWithDiscord(hasProgress)}>Continue with Discord</DiscordButton>
            <p className="text-xs text-muted-foreground">
              {hasProgress
                ? "Makes your account from Discord. Everything you have as a guest comes with you."
                : "Signs in with Discord, or makes your account from it if you don't have one yet."}
            </p>
          </div>
          <div className="or-divider">or with a username</div>
          <SignInForm guest />
          <p className="text-sm text-muted-foreground">
            Your account came from Discord? <DiscordLink>Sign in with Discord</DiscordLink>
          </p>
        </>
      )}
      {account.status === "signed-in" && <SignedIn username={account.username} discord={account.discord} />}
    </section>
  );
}

function SignInForm({ guest }: { guest: boolean }) {
  const [creating, setCreating] = useState(guest);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const name = username.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(name)) {
      setError("Usernames are 3 to 20 letters, numbers or underscores.");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Passwords need at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    setBusy(true);
    setError(null);
    setError(creating ? await signUp(name, password) : await signIn(name, password));
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="panel flex flex-col gap-4 p-5">
      <div role="group" aria-label="Create an account or sign in" className="tabs">
        <button type="button" aria-pressed={creating} onClick={() => setCreating(true)}>
          Create account
        </button>
        <button type="button" aria-pressed={!creating} onClick={() => setCreating(false)}>
          Sign in
        </button>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        Username
        <input
          className="field"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        Password
        <input
          className="field"
          type="password"
          autoComplete={creating ? "new-password" : "current-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>

      <p className="text-xs text-muted-foreground">
        {creating
          ? `There's no password reset, so keep your password safe.${guest ? " Your names as a guest move into the new account." : ""}`
          : guest
            ? "Signing in to an existing account leaves this guest's names behind."
            : ""}
      </p>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <Button type="submit" disabled={busy}>
        {busy ? (creating ? "Creating account…" : "Signing in…") : creating ? "Create account" : "Sign in"}
      </Button>
    </form>
  );
}

function SignedIn({ username, discord }: { username: string | null; discord: string | null }) {
  const game = useGame();
  const [showCard, setShowCard] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [discordError, setDiscordError] = useState<string | null>(null);
  // Ranks come from the server; the rest is already in the game state
  const [ranks, setRanks] = useState<{ worth: number | null; netWorth: number | null } | null>(null);

  useEffect(() => {
    if (!username) return;
    let current = true;
    void fetchProfile(username).then((answer) => {
      if (current && "data" in answer && answer.data) {
        setRanks({ worth: answer.data.collectionRank, netWorth: answer.data.fraudbucksRank });
      }
    });
    return () => {
      current = false;
    };
  }, [username]);

  const owned = game.entries.filter((entry) => entry.count > 0);
  const worth = owned.reduce((sum, entry) => sum + (entry.price ?? 0), 0);
  const fraudbucks = game.player?.fraudbucks ?? 0;
  const favorite = owned.find((entry) => entry.position === game.favorite) ?? null;
  const progress = game.entries.length ? owned.length / game.entries.length : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className={cn("profile-hero", `r-${favorite?.rarity ?? 0}`, favorite && "has-favorite")}>
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="w-20 shrink-0 sm:w-24">
            <NameCard
              name={favorite?.name ?? null}
              rarity={favorite?.rarity ?? 0}
              owned={!!favorite}
              className={cn(!favorite && "[&_.stars]:hidden")}
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Signed in
            </span>
            <h3 className="truncate text-2xl font-bold sm:text-3xl">{username ?? "…"}</h3>
            <p className="truncate text-sm text-muted-foreground">
              {favorite ? (
                <>
                  Favorite · <span className="font-semibold text-foreground">{favorite.name}</span>
                </>
              ) : (
                "No favorite yet. Pick one from a fraud's details."
              )}
            </p>
          </div>
          {username && (
            <button
              type="button"
              aria-label="Share card"
              onClick={() => setShowCard(true)}
              className="share-button primary shrink-0 self-start px-2.5! sm:px-3.5!"
            >
              <ShareIcon />
              <span className="hidden sm:inline">Share card</span>
            </button>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2 sm:gap-2.5">
        <Stat label="Frauds" value={`${owned.length}`} note={`of ${game.entries.length}`}>
          <div className="progress" aria-hidden>
            <span style={{ width: `${progress * 100}%` }} />
          </div>
        </Stat>
        <Stat label="Worth" value={formatMoney(worth)} note={ranks ? rank(ranks.worth) : "…"} money />
        <Stat label="Net worth" value={formatMoney(worth + fraudbucks)} note={ranks ? rank(ranks.netWorth) : "…"} money />
      </dl>

      <section aria-labelledby="sign-in-title" className="flex flex-col gap-2">
        <h3 id="sign-in-title" className="text-sm font-semibold text-muted-foreground">
          Sign-in
        </h3>
        <div className="action-list">
          <div className="action-item">
            <div className="action-row">
              <span aria-hidden className="action-icon tone-green">
                <svg viewBox="0 0 16 16" className="size-4">
                  <path d="M8 8a2.8 2.8 0 100-5.6A2.8 2.8 0 008 8zM2.8 13.6c.6-2.4 2.7-3.8 5.2-3.8s4.6 1.4 5.2 3.8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold">{username ?? "…"}</span>
                <span className="truncate text-xs text-muted-foreground">Your username · names are kept on the server</span>
              </span>
            </div>
          </div>
          <div className={cn("action-item", discordError && "has-error")}>
            {discord ? (
              <div className="action-row">
                <span aria-hidden className="action-icon tone-discord">
                  <DiscordLogo />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-semibold">Discord</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Connected as <span className="text-foreground">{discord}</span>
                  </span>
                </span>
                <span className="connected-badge">Connected</span>
              </div>
            ) : (
              <button
                type="button"
                disabled={connecting}
                className="action-row"
                onClick={async () => {
                  setConnecting(true);
                  setDiscordError(null);
                  const refused = await connectDiscord();
                  // On success the browser is already on its way to Discord
                  if (refused) {
                    setDiscordError(refused);
                    setConnecting(false);
                  }
                }}
              >
                <span aria-hidden className="action-icon tone-discord">
                  <DiscordLogo />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-semibold">Discord</span>
                  <span className="action-note truncate text-xs text-muted-foreground">
                    {discordError ?? "Connect it to sign in with Discord too"}
                  </span>
                </span>
                <span className="action-aside text-sm font-semibold">{connecting ? "Opening…" : "Connect"}</span>
              </button>
            )}
          </div>
          <div className="action-item">
            <button
              type="button"
              disabled={signingOut}
              className="action-row"
              onClick={async () => {
                setSigningOut(true);
                await signOut();
                setSigningOut(false);
              }}
            >
              <span aria-hidden className="action-icon tone-rose">
                <svg viewBox="0 0 16 16" className="size-4">
                  <path d="M6 2.8H3.8a1 1 0 00-1 1v8.4a1 1 0 001 1H6M10.5 5l3 3-3 3M13.3 8H6.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold">{signingOut ? "Signing out…" : "Sign out"}</span>
                <span className="truncate text-xs text-muted-foreground">You'll play as a new guest</span>
              </span>
            </button>
          </div>
        </div>
      </section>

      {showCard && username && <ProfileCardDialog username={username} onClose={() => setShowCard(false)} />}
    </div>
  );
}

function DiscordLogo() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5 shrink-0">
      <path
        fill="currentColor"
        d="M20.32 4.37a19.8 19.8 0 0 0-4.89-1.52.07.07 0 0 0-.08.04c-.21.38-.44.87-.61 1.25a18.3 18.3 0 0 0-5.49 0 12.6 12.6 0 0 0-.62-1.25.08.08 0 0 0-.08-.04 19.7 19.7 0 0 0-4.88 1.52.07.07 0 0 0-.03.03C.53 9.05-.32 13.58.1 18.06a.08.08 0 0 0 .03.06 19.9 19.9 0 0 0 5.99 3.03.08.08 0 0 0 .09-.03c.46-.63.87-1.3 1.22-1.99a.08.08 0 0 0-.04-.1 13.1 13.1 0 0 1-1.87-.9.08.08 0 0 1-.01-.12c.13-.1.25-.2.37-.3a.07.07 0 0 1 .08-.01c3.93 1.8 8.18 1.8 12.06 0a.07.07 0 0 1 .08.01c.12.1.25.2.37.3a.08.08 0 0 1 0 .12c-.6.35-1.22.65-1.87.9a.08.08 0 0 0-.04.1c.36.7.77 1.36 1.22 1.99a.08.08 0 0 0 .09.03 19.8 19.8 0 0 0 6-3.03.08.08 0 0 0 .03-.06c.5-5.18-.84-9.67-3.55-13.66a.06.06 0 0 0-.03-.03ZM8.02 15.33c-1.18 0-2.16-1.09-2.16-2.42s.96-2.42 2.16-2.42c1.21 0 2.18 1.1 2.16 2.42 0 1.33-.96 2.42-2.16 2.42Zm7.97 0c-1.18 0-2.15-1.09-2.15-2.42s.95-2.42 2.15-2.42c1.21 0 2.18 1.1 2.16 2.42 0 1.33-.95 2.42-2.16 2.42Z"
      />
    </svg>
  );
}

/** A Discord-colored button that leaves for Discord; shows why, if it can't */
function DiscordButton({ onClick, children }: { onClick: () => Promise<string | null>; children: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        disabled={busy}
        className="discord-button"
        onClick={async () => {
          setBusy(true);
          setError(null);
          const refused = await onClick();
          // On success the browser is already on its way to Discord
          if (refused) {
            setError(refused);
            setBusy(false);
          }
        }}
      >
        <DiscordLogo />
        {busy ? "Opening Discord…" : children}
      </button>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </>
  );
}

/** Signing in with Discord, as a quiet link under the form */
function DiscordLink({ children }: { children: string }) {
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <button
        type="button"
        className="text-foreground underline underline-offset-2"
        onClick={async () => setError(await signInWithDiscord())}
      >
        {children}
      </button>
      {error && (
        <span role="alert" className="block text-danger">
          {error}
        </span>
      )}
    </>
  );
}

/** Back from Discord with a problem; when the Discord account is someone else's, offers to sign in to it */
function DiscordNotice({ message, taken, guest }: { message: string; taken: boolean; guest: boolean }) {
  return (
    <div role="alert" className="panel flex flex-col gap-3 p-4">
      <p className="text-sm">{message}</p>
      {taken && (
        <>
          <DiscordButton onClick={signInWithDiscord}>Sign in with Discord instead</DiscordButton>
          {guest && <p className="text-xs text-muted-foreground">This guest's names stay behind.</p>}
        </>
      )}
      <button
        type="button"
        className="self-start text-xs text-muted-foreground underline underline-offset-2"
        onClick={dismissNotice}
      >
        Dismiss
      </button>
    </div>
  );
}
