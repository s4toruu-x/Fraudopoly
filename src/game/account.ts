import { useSyncExternalStore } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { explain } from "./errors";
import { clearGame, failGame, refresh } from "./store";

// Guests are anonymous Supabase users. Accounts sign in with a username and password; each
// username is stored as a hidden email at players.fraudopoly.invalid, so "Confirm email" must be off.

const EMAIL_DOMAIN = "players.fraudopoly.invalid";

export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
export const MIN_PASSWORD_LENGTH = 6;

export interface Account {
  /** "off": no Supabase settings. "error": the guest sign-in failed. */
  status: "off" | "checking" | "guest" | "signed-in" | "error";
  username: string | null;
  error: string | null;
}

let account: Account = { status: supabase ? "checking" : "off", username: null, error: null };
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

function usernameOf(user: User): string {
  return user.email?.split("@")[0] ?? "player";
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
  update({ status: guest ? "guest" : "signed-in", username: guest ? null : usernameOf(session.user), error: null });
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

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export function startAccount(): void {
  if (!supabase) return;
  supabase.auth.onAuthStateChange((_event, session) => {
    // Supabase asks for other calls to wait until this callback has returned
    setTimeout(() => follow(session), 0);
  });
}
