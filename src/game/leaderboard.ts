import { supabase } from "@/lib/supabase";
import { explain } from "./errors";

export interface Place {
  rank: number;
  player: string;
  names: number;
  value: number;
  isMe: boolean;
}

export interface Leaderboard {
  top: Place[];
  /** Null for guests and players with no names */
  me: Place | null;
}

function toPlace(p: Record<string, unknown>): Place {
  return {
    rank: p.rank as number,
    player: p.player as string,
    names: p.names as number,
    value: p.value as number,
    isMe: p.is_me as boolean,
  };
}

export async function fetchLeaderboard(): Promise<{ data: Leaderboard } | { error: string }> {
  if (!supabase) return { error: "The game has no server." };
  const { data, error } = await supabase.rpc("get_leaderboard");
  if (error) return { error: explain(error.message) };
  const me = data.me as Record<string, unknown> | null;
  return { data: { top: (data.top as Record<string, unknown>[]).map(toPlace), me: me ? toPlace(me) : null } };
}
