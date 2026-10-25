import type { Category } from "./content";

export interface Rules {
  pullsPerHour: number;
  claimsPerHour: number;
  claimSeconds: number;
  /** 0 on servers without wishlists */
  wishlistLimit: number;
  /** By rarity, Common first */
  chances: number[];
  /** By rarity, Common first */
  duplicateRewards: number[];
}

export interface Player {
  /** Null for a guest */
  username: string | null;
  pulls: number;
  fraudbucks: number;
  pullsLeft: number;
  claimsLeft: number;
  nextRefill: number;
}

export interface HourPull {
  pullId: number;
  position: number;
  /** Not owned when pulled */
  isNew: boolean;
  claimed: boolean;
  /** Fraudbucks the claim paid, or would pay for a name they have */
  reward: number;
  claimUntil: number;
}

export interface Entry {
  position: number;
  id: string;
  name: string;
  rarity: number;
  category: Category;
  /** Null on servers without prices */
  price: number | null;
  /** 1 if owned, else 0 */
  count: number;
  wished: boolean;
  foundAt: number | null;
}

export interface FeedPull {
  id: number;
  /** Who pulled it; null for a guest */
  player: string | null;
  isMe: boolean;
  position: number;
  name: string;
  rarity: number;
  category: Category;
  isNew: boolean;
  claimed: boolean;
  reward: number;
  pulledAt: number;
  claimedAt: number | null;
}

export function toPlayer(p: Record<string, unknown>): Player {
  return {
    username: (p.username as string | null) ?? null,
    pulls: p.pulls as number,
    fraudbucks: (p.fraudbucks as number | undefined) ?? 0,
    pullsLeft: p.pulls_left as number,
    claimsLeft: (p.claims_left as number | undefined) ?? 0,
    nextRefill: p.next_refill as number,
  };
}

export function toHourPull(p: Record<string, unknown>): HourPull {
  return {
    pullId: p.pull_id as number,
    position: p.position as number,
    isNew: p.is_new as boolean,
    claimed: p.claimed as boolean,
    reward: p.reward as number,
    claimUntil: p.claim_until as number,
  };
}

export function toRules(r: Record<string, unknown>): Rules {
  return {
    pullsPerHour: r.pulls_per_hour as number,
    // Older servers have no claims
    claimsPerHour: (r.claims_per_hour as number | undefined) ?? 0,
    claimSeconds: (r.claim_seconds as number | undefined) ?? 0,
    wishlistLimit: (r.wishlist_limit as number | undefined) ?? 0,
    chances: r.chances as number[],
    // Older servers have no duplicate rewards
    duplicateRewards: (r.duplicate_rewards as number[] | undefined) ?? [0, 0, 0, 0],
  };
}

export function toFeedPull(f: Record<string, unknown>): FeedPull {
  return {
    id: f.id as number,
    player: (f.player as string | null) ?? null,
    isMe: f.is_me as boolean,
    position: f.position as number,
    // Older servers mask names the viewer doesn't own
    name: (f.name ?? f.masked) as string,
    rarity: f.rarity as number,
    category: toCategory(f),
    isNew: f.is_new as boolean,
    claimed: (f.claimed as boolean | undefined) ?? false,
    reward: (f.reward as number | undefined) ?? 0,
    pulledAt: f.pulled_at as number,
    claimedAt: (f.claimed_at as number | null | undefined) ?? null,
  };
}

export function toEntry(c: Record<string, unknown>): Entry {
  return {
    position: c.position as number,
    // Older servers mask unowned names and leave out their id
    id: (c.id as string | null) ?? "",
    name: (c.name ?? c.masked) as string,
    rarity: c.rarity as number,
    category: toCategory(c),
    price: (c.price as number | undefined) ?? null,
    count: c.count as number,
    wished: false,
    foundAt: (c.found_at as number | null) ?? null,
  };
}

function toCategory(c: Record<string, unknown>): Category {
  const category = c.category as Category | undefined;
  // Older servers only send the source
  return category ? { type: category.type, name: category.name ?? null } : { type: c.source as string, name: null };
}
