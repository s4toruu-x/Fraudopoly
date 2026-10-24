/// <reference types="node" />
import { writeFileSync } from "node:fs";
import { buildCatalog } from "../src/game/catalog";

// npm run seed: writes supabase/seed.sql from src/game/names.ts. Run that file
// in the Supabase SQL Editor afterwards to put the names in the game.

const cards = buildCatalog();
if (cards.length === 0) throw new Error("names.ts has no names");

const quote = (text: string | null) => (text === null ? "null" : `'${text.replace(/'/g, "''")}'`);
const rows = cards.map(
  (c) =>
    `  (${quote(c.id)}, ${quote(c.name)}, ${c.rarity}, ${quote(c.category.type)}, ${quote(c.category.name)}, ${c.price}, ${c.position})`,
);

const sql = `-- Made by npm run seed from src/game/names.ts. Don't edit it by hand: change
-- names.ts, run npm run seed, then run this file in the Supabase SQL Editor.
-- Names taken out of names.ts leave the game, and every collection.

insert into public.cards (id, name, rarity, category_type, category_name, price, position) values
${rows.join(",\n")}
on conflict (id) do update set
  name = excluded.name, rarity = excluded.rarity, category_type = excluded.category_type,
  category_name = excluded.category_name, price = excluded.price, position = excluded.position;

delete from public.cards where id not in (${cards.map((c) => quote(c.id)).join(", ")});
`;

writeFileSync(new URL("../supabase/seed.sql", import.meta.url), sql);
console.log(`Wrote supabase/seed.sql with ${cards.length} names.`);
