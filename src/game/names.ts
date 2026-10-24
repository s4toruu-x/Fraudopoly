import type { RarityName } from "./content";

/**
 * The names you can pull, in groups that share a category. Add or remove
 * freely: a name taken out of the list also drops out of saves, and the same
 * name (ignoring case) only counts once, in the first group that has it.
 *
 * Each name gets a rarity from its spelling, so it's the same for everyone
 * who plays, and a price in Fraudbucks inside its rarity's range (Common
 * 50-145, Rare 150-445, Epic 450-1495, Legendary 1500-5000, in
 * src/game/catalog.ts), so rarer names are always worth more. To pick either
 * yourself, write the name as { name: "...", rarity: "Epic" },
 * { name: "...", rarity: "Epic", price: 900 } or { name: "...", price: 120 }.
 */
export type NameEntry = string | { name: string; rarity?: RarityName; price?: number };

export interface NameGroup {
  /**
   * What the names are: a type (Discord, Random, Anime, Game…) and, if it
   * has one, the name of where they're from, like the server or the series
   */
  category: { type: string; name?: string };
  names: NameEntry[];
}

/** People from the Discord server, one per line. */
const DISCORD: NameGroup = {
  category: { type: "Discord" },
  names: [
    // "someone",
    // { name: "the server owner", rarity: "Legendary" },
  ],
};

// Characters from a series get a group of their own, for example:
// const SOME_SERIES: NameGroup = {
//   category: { type: "Anime", name: "Some Series" },
//   names: ["The Hero", { name: "The Rival", rarity: "Legendary" }],
// };

/** Made-up names that fill out the pool around the others. */
const RANDOM: NameGroup = {
  category: { type: "Random" },
  names: [
    "MothLantern",
    "QuietComet",
    "Bramblewick",
    "NeonOtter",
    "Kestrel",
    "Juniper",
    "SaltyPretzel",
    "Velvetine",
    "Pixelbloom",
    "Driftwood",
    "Marlowe",
    "LunarToast",
    "Fizzbin",
    "Gravelpaw",
    "Wren",
    "Captain Noodle",
    "Mossy",
    "Orbit",
    "Tidewater",
    "Pebble",
    "Blue Static",
    "Clementine",
    "Rook",
    "Thistle",
    "Nova_7",
    "Sprocket",
    "Ember",
    "Hollow",
    "Biscuit",
    "Zephyr",
    "Glitchfox",
    "Marzipan",
    "Indigo",
    "Parsnip",
    "Halcyon",
    "Corvid",
    "Lumen",
    "Dandelion",
    "Quasar",
    "Puddle",
    "Sable",
    "Tangerine",
    "Echo",
    "Waffles",
    "Nimbus",
    "Cobalt",
    "Fern",
    "Rascal",
    "Starling",
    "Moonbeam",
  ],
};

/** Every group, in encyclopedia order (within each rarity). Add new groups here. */
export const NAME_GROUPS: NameGroup[] = [DISCORD, RANDOM];
