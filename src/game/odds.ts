import { RARITIES } from "./content";
import type { Entry, Rules } from "./state";

export function raritySizes(entries: Entry[]): number[] {
  return RARITIES.map((_, rarity) => entries.filter((entry) => entry.rarity === rarity).length);
}

/** Rarities without names get no chance; theirs is shared by the rest, as on the server. */
export function rarityChances(rules: Rules, sizes: number[]): number[] {
  const inPlay = rules.chances.reduce((sum, chance, rarity) => sum + (sizes[rarity] > 0 ? chance : 0), 0);
  return rules.chances.map((chance, rarity) => (sizes[rarity] > 0 ? chance / inPlay : 0));
}

export function nameChance(rules: Rules, entries: Entry[], entry: Entry): number {
  const sizes = raritySizes(entries);
  return rarityChances(rules, sizes)[entry.rarity] / sizes[entry.rarity];
}
