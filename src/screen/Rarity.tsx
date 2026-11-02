import { RARITIES } from "@/game/content";
import { cn } from "@/lib/utils";

export function Stars({ rarity, className }: { rarity: number; className?: string }) {
  const count = rarity + 2;
  return (
    <span role="img" aria-label={`${count} stars, ${RARITIES[rarity].name}`} className={cn("stars", className)}>
      {"★".repeat(count)}
    </span>
  );
}

/** A name written in its rarity's style: plain for Common, up to gold foil for Legendary */
export function TierName({ name, rarity, className }: { name: string; rarity: number; className?: string }) {
  return <span className={cn("tier-name", `r-${rarity}`, className)}>{name}</span>;
}

export function NewTag() {
  return <span className="tag-new">New</span>;
}
