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

export function NewTag() {
  return <span className="tag-new">New</span>;
}
