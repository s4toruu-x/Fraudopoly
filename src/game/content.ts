export type RarityName = "Common" | "Rare" | "Epic" | "Legendary";

/** Index 0 is Common, 3 is Legendary */
export const RARITIES: { name: RarityName }[] = [
  { name: "Common" },
  { name: "Rare" },
  { name: "Epic" },
  { name: "Legendary" },
];

export interface Category {
  type: string;
  name: string | null;
}

export const CURRENCY = { name: "Fraudbucks", symbol: "F$" };
