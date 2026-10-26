import { supabase } from "@/lib/supabase";
import type { Category } from "./content";
import { explain } from "./errors";
import { refresh } from "./store";

// Auctions, all run by the server (supabase/migrations: get_auctions,
// create_auction, bid, cancel_auction). Ended ones settle when anyone looks.

/** An auction starts at this many times the fraud's price (auction_rules() on the server) */
export const START_MULTIPLIER = 3;
/** How long an auction can run, in hours */
export const AUCTION_HOURS = [1, 6, 24];

export interface Auction {
  id: number;
  position: number;
  name: string;
  rarity: number;
  category: Category;
  price: number;
  seller: string;
  startPrice: number;
  topBid: number | null;
  /** Null until someone bids */
  topBidder: string | null;
  bids: number;
  /** The least the next bid can be */
  minBid: number;
  endsAt: number;
  status: "live" | "sold" | "unsold" | "cancelled" | "failed";
  isMine: boolean;
  leading: boolean;
}

export interface Auctions {
  live: Auction[];
  ended: Auction[];
  minRaisePercent: number;
}

type Result<T> = { data: T } | { error: string };

function toAuction(a: Record<string, unknown>): Auction {
  return {
    id: a.id as number,
    position: a.position as number,
    name: a.name as string,
    rarity: a.rarity as number,
    category: a.category as Category,
    price: a.price as number,
    seller: a.seller as string,
    startPrice: a.start_price as number,
    topBid: (a.top_bid as number | null) ?? null,
    topBidder: (a.top_bidder as string | null) ?? null,
    bids: a.bids as number,
    minBid: a.min_bid as number,
    endsAt: a.ends_at as number,
    status: a.status as Auction["status"],
    isMine: a.is_mine as boolean,
    leading: (a.leading as boolean | null) ?? false,
  };
}

export async function fetchAuctions(): Promise<Result<Auctions>> {
  if (!supabase) return { error: "The game has no server." };
  const { data, error } = await supabase.rpc("get_auctions");
  if (error) return { error: explain(error.message) };
  return {
    data: {
      live: (data.live as Record<string, unknown>[]).map(toAuction),
      ended: (data.ended as Record<string, unknown>[]).map(toAuction),
      minRaisePercent: (data.rules?.min_raise_percent as number | undefined) ?? 5,
    },
  };
}

/** The game reloads after each of these: they move frauds and Fraudbucks. Returns why the server refused, if it did. */
async function act(fn: string, args: Record<string, unknown>): Promise<{ error: string } | null> {
  if (!supabase) return { error: "The game has no server." };
  const { error } = await supabase.rpc(fn, args);
  if (error) return { error: explain(error.message) };
  await refresh();
  return null;
}

export const createAuction = (cardId: string, hours: number) => act("create_auction", { card: cardId, hours });
export const placeBid = (auctionId: number, amount: number) => act("bid", { auction: auctionId, amount });
export const cancelAuction = (auctionId: number) => act("cancel_auction", { auction: auctionId });
