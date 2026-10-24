import { supabase } from "@/lib/supabase";
import { explain } from "./errors";
import { refresh } from "./store";

export interface TradeCard {
  id: string;
  name: string;
  rarity: number;
}

export interface Trade {
  id: string;
  status: "pending" | "accepted" | "declined" | "cancelled" | "failed";
  outgoing: boolean;
  createdAt: number;
  other: string;
  /** What the sender gives */
  give: TradeCard[];
  /** What the sender wants from the receiver */
  want: TradeCard[];
}

export type Picked = string[];

type Result<T> = { data: T } | { error: string };

function toCards(list: Record<string, unknown>[]): TradeCard[] {
  return list.map((c) => ({
    id: c.id as string,
    name: c.name as string,
    rarity: c.rarity as number,
  }));
}

function toItems(picked: Picked) {
  return picked.map((card_id) => ({ card_id }));
}

export async function fetchTrades(): Promise<Result<Trade[]>> {
  if (!supabase) return { error: "The game has no server." };
  const { data, error } = await supabase.rpc("get_trades");
  if (error) return { error: explain(error.message) };
  return {
    data: (data as Record<string, unknown>[]).map((t) => ({
      id: t.id as string,
      status: t.status as Trade["status"],
      outgoing: t.outgoing as boolean,
      createdAt: t.created_at as number,
      other: t.other as string,
      give: toCards(t.give as Record<string, unknown>[]),
      want: toCards(t.want as Record<string, unknown>[]),
    })),
  };
}

export async function findPlayer(name: string): Promise<Result<{ username: string; cards: TradeCard[] }>> {
  if (!supabase) return { error: "The game has no server." };
  const { data, error } = await supabase.rpc("find_player", { player_name: name });
  if (error) return { error: explain(error.message) };
  return { data: { username: data.username as string, cards: toCards(data.cards) } };
}

export async function createTrade(to: string, give: Picked, want: Picked): Promise<string | null> {
  if (!supabase) return "The game has no server.";
  const { error } = await supabase.rpc("create_trade", {
    to_name: to,
    give: toItems(give),
    want: toItems(want),
  });
  return error ? explain(error.message) : null;
}

/** Reloads the game after an accept, since the collection changed */
export async function respondTrade(id: string, accept: boolean): Promise<Result<Trade["status"]>> {
  if (!supabase) return { error: "The game has no server." };
  const { data, error } = await supabase.rpc("respond_trade", { trade: id, accept });
  if (error) return { error: explain(error.message) };
  if (data === "accepted") await refresh();
  return { data: data as Trade["status"] };
}

export async function cancelTrade(id: string): Promise<string | null> {
  if (!supabase) return "The game has no server.";
  const { error } = await supabase.rpc("cancel_trade", { trade: id });
  return error ? explain(error.message) : null;
}
