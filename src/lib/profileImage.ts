import { RARITIES } from "@/game/content";
import { formatMoney } from "@/game/format";

// The profile card as a picture to post: 1200x630, the size link previews use.

export interface CardData {
  username: string;
  favorite: { name: string; rarity: number } | null;
  frauds: number;
  total: number;
  worth: number;
  netWorth: number;
  fraudbucks: number;
  collectionRank: number | null;
  netWorthRank: number | null;
  /** How many they have of each rarity, Common first */
  byRarity: number[];
  url: string;
}

const W = 1200;
const H = 630;
const FONT = "Inter, system-ui, sans-serif";

/** A theme color from index.css, so the picture matches the cards on the page */
function token(name: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

/** A color at some transparency, from any CSS color the canvas understands */
function fade(color: string, alpha: number): string {
  const probe = document.createElement("canvas").getContext("2d")!;
  probe.fillStyle = color;
  const hex = probe.fillStyle;
  if (!hex.startsWith("#") || hex.length !== 7) return `rgba(82, 82, 91, ${alpha})`;
  const [r, g, b] = [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Cuts text to fit a width, with an ellipsis */
function fit(ctx: CanvasRenderingContext2D, text: string, width: number): string {
  if (ctx.measureText(text).width <= width) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > width) cut = cut.slice(0, -1);
  return `${cut}…`;
}

export async function drawProfileCard(data: CardData): Promise<Blob> {
  await Promise.all([document.fonts.load(`700 64px Inter`), document.fonts.load(`500 24px Inter`)]).catch(() => {});
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const rarityColor = token(`--rarity-${data.favorite?.rarity ?? 0}`, "#52525b");
  const gold = token("--stars", "#fbbf24");

  // Background: near-black, lit from the favorite's corner in its rarity's color
  ctx.fillStyle = "#0b0b0e";
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(240, 300, 40, 240, 300, 760);
  glow.addColorStop(0, fade(rarityColor, 0.45));
  glow.addColorStop(1, fade(rarityColor, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // The favorite card
  const cx = 80;
  const cy = 95;
  const cw = 330;
  const ch = 440;
  const rarity = data.favorite?.rarity ?? 0;
  rounded(ctx, cx, cy, cw, ch, 28);
  ctx.fillStyle = data.favorite ? rarityColor : "#1f1f23";
  ctx.fill();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = data.favorite ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.18)";
  ctx.font = `700 170px ${FONT}`;
  ctx.fillText(data.favorite ? Array.from(data.favorite.name)[0]!.toUpperCase() : "?", cx + cw / 2, cy + 150);

  // Its nameplate across the foot, edge to edge, the name in its tier's style (dark theme)
  if (data.favorite) {
    const px = cx;
    const pw = cw;
    const ph = 130;
    const py = cy + ch - ph;
    ctx.save();
    rounded(ctx, cx, cy, cw, ch, 28);
    ctx.clip();
    ctx.fillStyle = "rgba(24,24,27,0.94)";
    ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = rarity === 3 ? "#fbbf24" : fade(rarityColor, 0.8);
    ctx.fillRect(px, py, pw, 4);
    ctx.restore();

    const style = rarity === 3 ? "italic 700" : rarity === 0 ? "600" : "700";
    // Shrink long names to fit the plate
    let size = 44;
    ctx.font = `${style} ${size}px ${FONT}`;
    while (size > 24 && ctx.measureText(data.favorite.name).width > pw - 36) ctx.font = `${style} ${(size -= 2)}px ${FONT}`;
    const shown = fit(ctx, data.favorite.name, pw - 36);
    const nameY = py + 50;
    const half = ctx.measureText(shown).width / 2;
    const across = ctx.createLinearGradient(cx + cw / 2 - half, 0, cx + cw / 2 + half, 0);
    ["#60a5fa", "#a78bfa", "#f472b6"].forEach((color, i) => across.addColorStop(i / 2, color));
    const down = ctx.createLinearGradient(0, nameY - size / 2, 0, nameY + size / 2);
    ["#fef3c7", "#fbbf24", "#d97706"].forEach((color, i) => down.addColorStop([0, 0.55, 1][i]!, color));
    ctx.fillStyle = ["rgba(255,255,255,0.95)", "#60a5fa", across, down][rarity]!;
    ctx.fillText(shown, cx + cw / 2, nameY);
    ctx.fillStyle = gold;
    ctx.font = `400 26px ${FONT}`;
    ctx.fillText("★".repeat(rarity + 2), cx + cw / 2, py + ph - 32);
  }
  // Legendary's frame goes over the nameplate, unbroken round the card
  if (rarity === 3) {
    ctx.lineWidth = 6;
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    rounded(ctx, cx + 3, cy + 3, cw - 6, ch - 6, 25);
    ctx.stroke();
  }

  // Name and favorite
  const tx = 470;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = `600 22px ${FONT}`;
  ctx.fillText("FRAUDOPOLY", tx, 140);
  ctx.fillStyle = "#fff";
  ctx.font = `700 68px ${FONT}`;
  ctx.fillText(fit(ctx, data.username, W - tx - 70), tx, 212);
  ctx.fillStyle = "rgba(255,255,255,0.62)";
  ctx.font = `500 26px ${FONT}`;
  ctx.fillText(
    fit(ctx, data.favorite ? `Favorite: ${data.favorite.name} · ${RARITIES[data.favorite.rarity].name}` : "No favorite yet", W - tx - 70),
    tx,
    256,
  );

  // Four stats in a 2x2 grid
  const stats: [string, string, string][] = [
    ["Frauds", `${data.frauds}`, `of ${data.total}`],
    ["Worth", formatMoney(data.worth), data.collectionRank ? `Rank #${data.collectionRank}` : "Not ranked"],
    ["Net worth", formatMoney(data.netWorth), data.netWorthRank ? `Rank #${data.netWorthRank}` : "Not ranked"],
    ["Fraudbucks", formatMoney(data.fraudbucks), "In hand"],
  ];
  const bw = 315;
  const bh = 104;
  stats.forEach(([label, value, note], i) => {
    const x = tx + (i % 2) * (bw + 20);
    const y = 292 + Math.floor(i / 2) * (bh + 16);
    rounded(ctx, x, y, bw, bh, 16);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = `500 19px ${FONT}`;
    ctx.fillText(label, x + 20, y + 32);
    ctx.fillStyle = i === 0 ? "#fff" : gold;
    ctx.font = `700 34px ${FONT}`;
    ctx.fillText(fit(ctx, value, bw - 150), x + 20, y + 76);
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = `500 18px ${FONT}`;
    ctx.textAlign = "right";
    ctx.fillText(note, x + bw - 20, y + 76);
    ctx.textAlign = "left";
  });

  // How many of each rarity, rarest first
  let rx = tx;
  ctx.font = `600 22px ${FONT}`;
  for (let rarity = 3; rarity >= 0; rarity--) {
    const label = `${"★".repeat(rarity + 2)} ${data.byRarity[rarity] ?? 0}`;
    const width = ctx.measureText(label).width + 28;
    rounded(ctx, rx, 540, width, 40, 20);
    ctx.fillStyle = fade(token(`--rarity-${rarity}`, "#52525b"), 0.3);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText(label, rx + 14, 568);
    rx += width + 10;
  }

  // Where to find them
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = `500 18px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillText(fit(ctx, data.url.replace(/^https?:\/\//, ""), cw), cx + cw / 2, 585);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't make the picture"))), "image/png"),
  );
}
