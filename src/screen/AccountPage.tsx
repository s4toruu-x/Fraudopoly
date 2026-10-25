import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  MIN_PASSWORD_LENGTH,
  USERNAME_PATTERN,
  signIn,
  signOut,
  signUp,
  useAccount,
} from "@/game/account";

export function AccountPage() {
  const account = useAccount();

  return (
    <section aria-labelledby="account-title" className="flex max-w-md flex-col gap-4">
      <h2 id="account-title" className="text-xl font-semibold">
        Account
      </h2>

      {account.status === "off" && (
        <p className="text-muted-foreground">
          The game's server isn't set up on this copy. See the README.
        </p>
      )}
      {account.status === "checking" && <p className="text-muted-foreground">Connecting…</p>}
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
          <SignInForm guest />
        </>
      )}
      {account.status === "signed-in" && <SignedIn username={account.username} />}
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

function SignedIn({ username }: { username: string | null }) {
  const [busy, setBusy] = useState(false);

  return (
    <div className="panel flex flex-col gap-4 p-5">
      <p>
        Signed in as <span className="font-semibold">{username}</span>. Your names are kept on the
        server.
      </p>
      <Button
        variant="outline"
        disabled={busy}
        className="self-start"
        onClick={async () => {
          setBusy(true);
          await signOut();
          setBusy(false);
        }}
      >
        Sign out
      </Button>
      <p className="text-xs text-muted-foreground">After signing out you play as a new guest.</p>
    </div>
  );
}
