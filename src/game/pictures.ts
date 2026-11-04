// Card pictures. A file in src/assets/cards named after a card's id (its name
// in lower case, like "tyrannosaurus.svg") becomes that card's picture. Cards
// without one show their first letter.
const FILES = import.meta.glob<string>("../assets/cards/*.{svg,png,jpg,jpeg,webp}", {
  eager: true,
  query: "?url",
  import: "default",
});

const PICTURES = new Map(
  Object.entries(FILES).map(([path, url]) => [path.slice(path.lastIndexOf("/") + 1, path.lastIndexOf(".")), url]),
);

export function pictureOf(name: string | null): string | undefined {
  return name ? PICTURES.get(name.trim().toLowerCase()) : undefined;
}
