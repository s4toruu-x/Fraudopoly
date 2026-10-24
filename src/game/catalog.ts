import { RARITIES, type Category } from "./content";
import { NAME_GROUPS } from "./names";

// Builds the cards table from names.ts. Only scripts/seed.ts uses it.

/** Rarity shares when names.ts doesn't set one, Common first */
const SHARES = [0.5, 0.3, 0.15, 0.05];

/** Price range per rarity, Common first. The ranges don't overlap. */
const PRICE_RANGES: [number, number][] = [
  [50, 145],
  [150, 445],
  [450, 1495],
  [1500, 5000],
];

const PRICE_STEP = 5;

export interface CatalogCard {
  /** Collections store names by this, so renaming a name drops it from collections */
  id: string;
  name: string;
  rarity: number;
  category: Category;
  price: number;
  position: number;
}

/** Deterministic hash to [0, 1) (FNV-1a) */
function hashOf(text: string): number {
  let hash = 2166136261;
  for (const char of text) {
    hash ^= char.codePointAt(0)!;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 2 ** 32;
}

function rarityOf(id: string): number {
  const roll = hashOf(id);
  let sum = 0;
  for (let rarity = SHARES.length - 1; rarity > 0; rarity--) {
    sum += SHARES[rarity];
    if (roll < sum) return rarity;
  }
  return 0;
}

function priceOf(id: string, rarity: number): number {
  const [low, high] = PRICE_RANGES[rarity];
  const steps = (high - low) / PRICE_STEP;
  // Separate hash from the rarity's, so price and rarity aren't linked
  return low + Math.floor(hashOf(`price:${id}`) * (steps + 1)) * PRICE_STEP;
}

export function buildCatalog(): CatalogCard[] {
  const cards: CatalogCard[] = [];
  const seen = new Set<string>();
  for (const group of NAME_GROUPS) {
    const type = group.category.type.trim();
    const from = group.category.name?.trim();
    if (!type) throw new Error("names.ts has a group whose category has no type");
    const category = { type, name: from || null };
    for (const entry of group.names) {
      const picked = typeof entry === "string" ? { name: entry } : entry;
      const name = picked.name.trim();
      const id = name.toLowerCase();
      if (!name || seen.has(id)) continue;
      seen.add(id);
      const rarity = picked.rarity ? RARITIES.findIndex((r) => r.name === picked.rarity) : rarityOf(id);
      const price = picked.price ?? priceOf(id, rarity);
      const [low, high] = PRICE_RANGES[rarity];
      if (!Number.isInteger(price) || price < low || price > high) {
        throw new Error(
          `names.ts: ${name} is ${RARITIES[rarity].name}, so its price has to be a whole number from ${low} to ${high}`,
        );
      }
      cards.push({ id, name, rarity, category, price, position: cards.length + 1 });
    }
  }
  return cards;
}
