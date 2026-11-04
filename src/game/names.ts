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
    { name: "XiaoBing", rarity: "Legendary" },
    { name: "Cyclone", rarity: "Legendary", price: 3605 },
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

/** Also from the Discord server; a group of its own to keep the card's place in the encyclopedia. */
const DISCORD_EARLY: NameGroup = {
  category: { type: "Discord" },
  names: [{ name: "Manjiro", rarity: "Legendary" }],
};

const DINOSAURS: NameGroup = {
  category: { type: "Dinosaurs" },
  names: [
    { name: "Tyrannosaurus", rarity: "Legendary" },
    { name: "Spinosaurus", rarity: "Legendary" },
    { name: "Argentinosaurus", rarity: "Legendary" },
    { name: "Velociraptor", rarity: "Epic" },
    { name: "Triceratops", rarity: "Epic" },
    { name: "Giganotosaurus", rarity: "Epic" },
    { name: "Allosaurus", rarity: "Epic" },
    { name: "Carnotaurus", rarity: "Epic" },
    { name: "Ankylosaurus", rarity: "Epic" },
    { name: "Brachiosaurus", rarity: "Epic" },
    { name: "Stegosaurus", rarity: "Rare" },
    { name: "Diplodocus", rarity: "Rare" },
    { name: "Parasaurolophus", rarity: "Rare" },
    { name: "Utahraptor", rarity: "Rare" },
    { name: "Baryonyx", rarity: "Rare" },
    { name: "Pachycephalosaurus", rarity: "Rare" },
    { name: "Iguanodon", rarity: "Common" },
    { name: "Compsognathus", rarity: "Common" },
    { name: "Gallimimus", rarity: "Common" },
    { name: "Dilophosaurus", rarity: "Common" },
    { name: "Protoceratops", rarity: "Common" },
    { name: "Oviraptor", rarity: "Common" },
    { name: "Maiasaura", rarity: "Common" },
    { name: "Coelophysis", rarity: "Common" },
  ],
};

const MORE_DINOSAURS: NameGroup = {
  category: { type: "Dinosaurs" },
  names: [
    { name: "Therizinosaurus", rarity: "Legendary" },
    { name: "Deinonychus", rarity: "Legendary" },
    { name: "Tarbosaurus", rarity: "Legendary" },
    { name: "Cryolophosaurus", rarity: "Legendary" },
    { name: "Yutyrannus", rarity: "Epic" },
    { name: "Albertosaurus", rarity: "Rare" },
    { name: "Deinocheirus", rarity: "Rare" },
    { name: "Styracosaurus", rarity: "Rare" },
    { name: "Microraptor", rarity: "Rare" },
    { name: "Majungasaurus", rarity: "Rare" },
    { name: "Ceratosaurus", rarity: "Common" },
    { name: "Corythosaurus", rarity: "Common" },
    { name: "Edmontosaurus", rarity: "Common" },
    { name: "Kentrosaurus", rarity: "Common" },
    { name: "Mamenchisaurus", rarity: "Common" },
    { name: "Psittacosaurus", rarity: "Common" },
  ],
};

/** Every group, in encyclopedia order (within each rarity). Add new groups here. */
export const NAME_GROUPS: NameGroup[] = [RANDOM, DISCORD_EARLY, DINOSAURS, DISCORD, MORE_DINOSAURS];
