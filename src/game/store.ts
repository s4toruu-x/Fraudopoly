import { useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase";
import { explain } from "./errors";
import {
  toEntry,
  toFeedPull,
  toHourPull,
  toPlayer,
  toRules,
  type Entry,
  type FeedPull,
  type HourPull,
  type Player,
  type Rules,
} from "./state";

export interface GameState {
  /** "off": no Supabase settings */
  status: "off" | "loading" | "ready" | "error";
  error: string | null;
  player: Player | null;
  rules: Rules | null;
  entries: Entry[];
  myPulls: FeedPull[];
  claims: FeedPull[];
  pulls: HourPull[];
  /** The position of the player's favorite fraud, shown on their profile card */
  favorite: number | null;
}

let state: GameState = {
  status: supabase ? "loading" : "off",
  error: null,
  player: null,
  rules: null,
  entries: [],
  myPulls: [],
  claims: [],
  pulls: [],
  favorite: null,
};
const listeners = new Set<() => void>();
let refillTimer: ReturnType<typeof setTimeout> | undefined;

function set(patch: Partial<GameState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
  // Refresh right after the hourly refill
  if (patch.player) {
    clearTimeout(refillTimer);
    refillTimer = setTimeout(() => void refresh(), Math.max(0, patch.player.nextRefill - Date.now()) + 1000);
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Follows the game from outside React; returns a way to stop */
export function watchGame(listener: (game: GameState) => void): () => void {
  const wrapped = () => listener(state);
  listeners.add(wrapped);
  return () => listeners.delete(wrapped);
}

export function useGame(): GameState {
  return useSyncExternalStore(subscribe, () => state);
}

export async function refresh(): Promise<void> {
  if (!supabase) return;
  const { data, error } = await supabase.rpc("get_state");
  if (error) {
    set({ status: "error", error: explain(error.message) });
    return;
  }
  set({
    status: "ready",
    error: null,
    player: toPlayer(data.player),
    rules: toRules(data.rules),
    entries: withWishes((data.cards as Record<string, unknown>[]).map(toEntry), data.wishlist),
    pulls: ((data.pulls as Record<string, unknown>[] | undefined) ?? []).map(toHourPull),
    favorite: (data.favorite as number | null | undefined) ?? null,
  });
  await refreshFeed();
}

export async function refreshFeed(): Promise<void> {
  if (!supabase) return;
  const { data, error } = await supabase.rpc("get_feed");
  if (error) return;
  // Older servers send one list of everyone's pulls
  if (Array.isArray(data)) {
    const feed = (data as Record<string, unknown>[]).map(toFeedPull);
    set({ myPulls: feed.filter((pull) => pull.isMe), claims: feed.filter((pull) => pull.claimed) });
  } else {
    set({
      myPulls: (data.mine as Record<string, unknown>[]).map(toFeedPull),
      claims: (data.claims as Record<string, unknown>[]).map(toFeedPull),
    });
  }
}

export function clearGame(): void {
  set({ status: supabase ? "loading" : "off", error: null, player: null, entries: [], myPulls: [], claims: [], pulls: [], favorite: null });
}

export function failGame(message: string): void {
  set({ status: "error", error: message });
}

/** Marks the wished names; older servers send no wishlist */
function withWishes(entries: Entry[], wishlist: unknown): Entry[] {
  const wished = new Set((wishlist as number[] | undefined) ?? []);
  return entries.map((entry) => ({ ...entry, wished: wished.has(entry.position) }));
}

export const actions = {
  pull: async (): Promise<{ error: string } | null> => {
    if (!supabase) return { error: "The game has no server." };
    const { data, error } = await supabase.rpc("pull");
    if (error) {
      // Resync, e.g. pulls used up on another device
      void refresh();
      return { error: explain(error.message) };
    }
    const card = data.card as Record<string, unknown>;
    // Older servers keep new names and pay duplicates on the pull itself
    const pulled: HourPull = data.pull
      ? toHourPull(data.pull)
      : {
          pullId: -Date.now(),
          position: card.position as number,
          isNew: data.is_new as boolean,
          claimed: true,
          reward: (data.reward as number | undefined) ?? 0,
          claimUntil: 0,
        };
    const known = state.entries.some((entry) => entry.position === pulled.position);
    set({
      entries: data.pull
        ? state.entries
        : state.entries.map((entry) =>
            entry.position === pulled.position && pulled.isNew ? { ...entry, count: 1, foundAt: Date.now() } : entry,
          ),
      player: toPlayer(data.player),
      pulls: [pulled, ...state.pulls],
    });
    void refreshFeed();
    // The card may have been added since the last load
    if (!known) await refresh();
    return null;
  },

  /** Adds a name to the wishlist or takes it off. Returns why the server refused, if it did. */
  wish: async (entry: Entry, wanted: boolean): Promise<{ error: string } | null> => {
    if (!supabase) return { error: "The game has no server." };
    const { data, error } = await supabase.rpc("set_wish", { card: entry.id, wanted });
    if (error) return { error: explain(error.message) };
    set({ entries: withWishes(state.entries, data) });
    return null;
  },

  /** Makes an owned fraud the favorite, or clears it with null. Returns why the server refused, if it did. */
  favorite: async (entry: Entry | null): Promise<{ error: string } | null> => {
    if (!supabase) return { error: "The game has no server." };
    const { data, error } = await supabase.rpc("set_favorite", { card: entry?.id ?? null });
    if (error) return { error: explain(error.message) };
    set({ favorite: (data as number | null) ?? null });
    return null;
  },

  /** Sells an owned fraud for its price. Returns why the server refused, if it did. */
  sell: async (entry: Entry): Promise<{ error: string } | null> => {
    if (!supabase) return { error: "The game has no server." };
    const { data, error } = await supabase.rpc("sell", { card: entry.id });
    if (error) {
      void refresh();
      return { error: explain(error.message) };
    }
    set({
      entries: state.entries.map((other) =>
        other.position === entry.position ? { ...other, count: 0, foundAt: null } : other,
      ),
      player: toPlayer(data.player),
    });
    return null;
  },

  claim: async (pullId: number): Promise<{ error: string } | null> => {
    if (!supabase) return { error: "The game has no server." };
    const { data, error } = await supabase.rpc("claim", { pull: pullId });
    if (error) {
      void refresh();
      return { error: explain(error.message) };
    }
    const card = data.card as Record<string, unknown>;
    // Older servers always add the name
    const added = (data.added as boolean | undefined) ?? true;
    set({
      entries: added
        ? state.entries.map((entry) =>
            entry.position === card.position ? { ...entry, count: 1, foundAt: data.found_at as number, wished: false } : entry,
          )
        : state.entries,
      player: toPlayer(data.player),
      pulls: state.pulls.map((pull) =>
        pull.pullId === pullId ? { ...pull, claimed: true, reward: (data.reward as number | undefined) ?? 0 } : pull,
      ),
    });
    void refreshFeed();
    return null;
  },
};
