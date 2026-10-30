import { useSyncExternalStore } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { explain } from "./errors";
import { clearGame, failGame, refresh, watchGame } from "./store";

// Guests are anonymous Supabase users. Accounts sign in with a username and password, or with
// Discord. A password username is stored as a hidden email at players.fraudopoly.invalid, so
// "Confirm email" must be off; a Discord account gets its username from the server.

const EMAIL_DOMAIN = "players.fraudopoly.invalid";

/** Set while away at Discord, so coming back lands on the Account page */
const RETURN_KEY = "fraudopoly.discord-return";

export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
export const MIN_PASSWORD_LENGTH = 6;

export interface Account {
  /** "off": no Supabase settings. "error": the guest sign-in failed. */
  status: "off" | "checking" | "guest" | "signed-in" | "error";
  username: string | null;
  error: string | null;
  /** The Discord account this one is connected to, by its Discord name */
  discord: string | null;
  /** What happened on the way back from Discord, when it went wrong */
  notice: string | null;
  /** The Discord account already belongs to another Fraudopoly account */
  discordTaken: boolean;
}

let account: Account = {
  status: supabase ? "checking" : "off",
  username: null,
  error: null,
  discord: null,
  notice: null,
  discordTaken: false,
};
let userId: string | null = null;
// Holds the game's reload until the guest's names have moved into the new account
let holdRefresh = false;
let startingGuest = false;
const listeners = new Set<() => void>();

function update(patch: Partial<Account>) {
  account = { ...account, ...patch };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useAccount(): Account {
  return useSyncExternalStore(subscribe, () => account);
}

function toEmail(username: string): string {
  return `${username}@${EMAIL_DOMAIN}`;
}

/** A password account's username; Discord accounts get theirs from the server */
function usernameOf(user: User): string | null {
  return user.email?.endsWith(`@${EMAIL_DOMAIN}`) ? user.email.split("@")[0] : null;
}

function discordOf(user: User): string | null {
  const identity = user.identities?.find((one) => one.provider === "discord");
  if (!identity) return null;
  const data = identity.identity_data ?? {};
  return (data.custom_claims?.global_name ?? data.full_name ?? data.name ?? "Discord") as string;
}

async function startGuest(): Promise<void> {
  if (!supabase || startingGuest) return;
  startingGuest = true;
  const { error } = await supabase.auth.signInAnonymously();
  startingGuest = false;
  if (error) {
    const message = explain(error.message);
    update({ status: "error", username: null, error: message });
    failGame(message);
  }
}

function follow(session: Session | null) {
  if (!session) {
    userId = null;
    clearGame();
    void startGuest();
    return;
  }
  const guest = session.user.is_anonymous ?? false;
  update({
    status: guest ? "guest" : "signed-in",
    // A Discord name arrives with the game; until then keep it only for the same player
    username: guest ? null : (usernameOf(session.user) ?? (session.user.id === userId ? account.username : null)),
    discord: discordOf(session.user),
    error: null,
  });
  // The sign-in code from Discord has been used; a reload shouldn't try it again
  if (new URLSearchParams(location.search).has("code")) history.replaceState(null, "", location.pathname + location.hash);
  if (session.user.id !== userId) {
    userId = session.user.id;
    if (!holdRefresh) {
      clearGame();
      void refresh();
    }
  }
}

/** A guest's names move in through a one-time code from start_guest_transfer. */
export async function signUp(username: string, password: string): Promise<string | null> {
  if (!supabase) return "Accounts are off.";
  let code: string | null = null;
  if (account.status === "guest") {
    const { data } = await supabase.rpc("start_guest_transfer");
    code = (data as string | null) ?? null;
  }

  // A Discord player may have the name already
  const { data: free } = await supabase.rpc("username_free", { name: username });
  if (free === false) return "That username is taken.";

  holdRefresh = true;
  const { data, error } = await supabase.auth.signUp({
    email: toEmail(username),
    password,
    options: { data: { username } },
  });
  if (error || !data.session) {
    holdRefresh = false;
    // No session means email confirmation is on
    return explain(error?.message ?? "Email not confirmed");
  }
  if (code) await supabase.rpc("claim_guest", { transfer: code });
  holdRefresh = false;
  clearGame();
  await refresh();
  return null;
}

export async function signIn(username: string, password: string): Promise<string | null> {
  if (!supabase) return "Accounts are off.";
  const { error } = await supabase.auth.signInWithPassword({ email: toEmail(username), password });
  return error ? explain(error.message) : null;
}

/** Where Discord sends the player back to: this page, with the Account page to follow */
function comeBackHere(): string {
  try {
    sessionStorage.setItem(RETURN_KEY, "1");
  } catch {
    // Without storage they land on the Pull page instead
  }
  return location.origin + location.pathname;
}

/**
 * Connects Discord to this player: a guest becomes an account with everything kept, and an
 * account can sign in with Discord after. Leaves for Discord; returns why it couldn't, if it couldn't.
 */
export async function connectDiscord(): Promise<string | null> {
  if (!supabase) return "Accounts are off.";
  const { error } = await supabase.auth.linkIdentity({ provider: "discord", options: { redirectTo: comeBackHere() } });
  return error ? explain(error.message) : null;
}

/**
 * The guest's button. With something to lose, connects Discord so it all comes along (and says so
 * if that Discord already has an account). With nothing yet, signs in with Discord: the account it
 * already has, or a new one.
 */
export function continueWithDiscord(hasProgress: boolean): Promise<string | null> {
  return hasProgress ? connectDiscord() : signInWithDiscord();
}

/** Signs in to the account a Discord account belongs to. A guest's names stay with the guest. */
export async function signInWithDiscord(): Promise<string | null> {
  if (!supabase) return "Accounts are off.";
  const { error } = await supabase.auth.signInWithOAuth({ provider: "discord", options: { redirectTo: comeBackHere() } });
  return error ? explain(error.message) : null;
}

/** Whether this browser kept the key for a sign-in it started (supabase-js's own storage names) */
function hasSignInKey(flowId: string | null): boolean {
  const storageKey = (supabase?.auth as unknown as { storageKey?: string } | undefined)?.storageKey;
  if (!storageKey) return true;
  try {
    const key = flowId ? `${storageKey}-flow-${flowId}-code-verifier` : `${storageKey}-code-verifier`;
    return localStorage.getItem(key) !== null;
  } catch {
    return true;
  }
}

export function dismissNotice(): void {
  update({ notice: null, discordTaken: false });
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export function startAccount(): void {
  if (!supabase) return;

  // Back from Discord: go to the Account page, and say what went wrong if something did. Supabase
  // puts an error after ? or #, so look in both
  const query = new URLSearchParams(location.search);
  const fragment = /^#(error|error_code|error_description)=/.test(location.hash)
    ? new URLSearchParams(location.hash.slice(1))
    : null;
  const param = (key: string) => query.get(key) ?? fragment?.get(key) ?? null;
  let back = false;
  try {
    back = sessionStorage.getItem(RETURN_KEY) === "1";
    sessionStorage.removeItem(RETURN_KEY);
  } catch {
    // No storage, no way to tell
  }
  const problem = param("error_description") ?? param("error");
  if (problem) {
    update({
      notice: explain(problem),
      discordTaken: param("error_code") === "identity_already_exists" || /already linked/i.test(problem),
    });
    history.replaceState(null, "", location.pathname);
  }
  if (back || problem) location.hash = "#/account";

  // Back with a sign-in code: if it can't become a session, say why instead of quietly staying a
  // guest. supabase-js skips a code whose key this browser didn't keep, which happens when
  // Supabase sends the player to a different address than the one they left from.
  if (query.has("code")) {
    if (!hasSignInKey(query.get("sb_flow_id"))) {
      update({ notice: `Discord sign-in didn't finish: ${explain("code verifier not found")}`, discordTaken: false });
      history.replaceState(null, "", location.pathname + "#/account");
    }
    void supabase.auth.initialize().then(({ error }) => {
      if (!error) return;
      update({ notice: `Discord sign-in didn't finish: ${explain(error.message)}`, discordTaken: false });
      history.replaceState(null, "", location.pathname);
      location.hash = "#/account";
    });
  }

  // A Discord account's username comes from the server, with the game
  watchGame((game) => {
    const name = game.player?.username ?? null;
    if (account.status === "signed-in" && name && name !== account.username) update({ username: name });
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    // Supabase asks for other calls to wait until this callback has returned
    setTimeout(() => follow(session), 0);
  });
}
