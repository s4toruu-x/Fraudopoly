import { supabase } from "@/lib/supabase";
import { explain } from "./errors";

export interface Place {
  rank: number;
  player: string;
  names: number;
  /** The sum of their names' prices, in Fraudbucks */
  value: number;
  fraudbucks: number;
  /** Fraudbucks plus what their frauds are worth; the Fraudbucks board ranks by this */
  netWorth: number;
  isMe: boolean;
}

export interface Board {
  top: Place[];
  /** Null for guests and players not on this board */
  me: Place | null;
}

export interface Leaderboards {
  collection: Board;
  fraudbucks: Board;
}

export interface Profile {
  username: string;
  names: number;
  value: number;
  fraudbucks: number;
  netWorth: number;
  collectionRank: number | null;
  fraudbucksRank: number | null;
  isMe: boolean;
  /** Positions of the names they own, with when they got each */
  owned: Map<number, number | null>;
  /** Positions of the names they wish for */
  wishlist: Set<number>;
}

type Result<T> = { data: T } | { error: string };

function toPlace(p: Record<string, unknown>): Place {
  return {
    rank: p.rank as number,
    player: p.player as string,
    names: p.names as number,
    value: p.value as number,
    fraudbucks: (p.fraudbucks as number | undefined) ?? 0,
    // Older servers rank by the balance alone
    netWorth: (p.net_worth as number | undefined) ?? (p.fraudbucks as number | undefined) ?? 0,
    isMe: p.is_me as boolean,
  };
}

function toBoard(b: Record<string, unknown>): Board {
  const me = b.me as Record<string, unknown> | null;
  return { top: (b.top as Record<string, unknown>[]).map(toPlace), me: me ? toPlace(me) : null };
}

export async function fetchLeaderboards(): Promise<Result<Leaderboards>> {
  if (!supabase) return { error: "The game has no server." };
  const { data, error } = await supabase.rpc("get_leaderboard");
  if (error) return { error: explain(error.message) };
  // Older servers only rank collections
  if (!data.collection) return { data: { collection: toBoard(data), fraudbucks: { top: [], me: null } } };
  return { data: { collection: toBoard(data.collection), fraudbucks: toBoard(data.fraudbucks) } };
}

/** Null data when there's no account by that name */
export async function fetchProfile(username: string): Promise<Result<Profile | null>> {
  if (!supabase) return { error: "The game has no server." };
  const { data, error } = await supabase.rpc("get_profile", { name: username });
  if (error) return { error: explain(error.message) };
  if (!data) return { data: null };
  const p = data.player as Record<string, unknown>;
  return {
    data: {
      username: p.username as string,
      names: p.names as number,
      value: p.value as number,
      fraudbucks: p.fraudbucks as number,
      netWorth: (p.net_worth as number | undefined) ?? (p.fraudbucks as number) + (p.value as number),
      collectionRank: (p.collection_rank as number | null) ?? null,
      fraudbucksRank: (p.fraudbucks_rank as number | null) ?? null,
      isMe: p.is_me as boolean,
      owned: new Map(
        (data.owned as Record<string, unknown>[]).map((o) => [o.position as number, (o.found_at as number | null) ?? null]),
      ),
      wishlist: new Set((data.wishlist as number[] | undefined) ?? []),
    },
  };
}
