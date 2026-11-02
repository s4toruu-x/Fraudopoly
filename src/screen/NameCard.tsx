import { cn } from "@/lib/utils";
import { NewTag, Stars, TierName } from "./Rarity";

export function NameCard({
  name,
  rarity,
  owned = true,
  isNew = false,
  wished = false,
  className,
}: {
  name: string | null;
  rarity: number;
  owned?: boolean;
  isNew?: boolean;
  wished?: boolean;
  className?: string;
}) {
  const missing = !name || !owned;
  return (
    <div className={cn("name-card", `r-${rarity}`, missing && "missing", className)}>
      <span aria-hidden className="initial">
        {name ? Array.from(name)[0]?.toUpperCase() : "?"}
      </span>
      {isNew && <NewTag />}
      {wished && (
        <span role="img" aria-label="On the wishlist" className="tag-wish">
          ♥
        </span>
      )}
      {/* The nameplate across the bottom, like a trading card's name bar */}
      <span className="card-plate">
        {name && (
          <span className="card-plate-name">{missing ? name : <TierName name={name} rarity={rarity} />}</span>
        )}
        <Stars rarity={rarity} />
      </span>
    </div>
  );
}
