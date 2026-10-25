import { cn } from "@/lib/utils";
import { NewTag, Stars } from "./Rarity";

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
  return (
    <div className={cn("name-card", `r-${rarity}`, (!name || !owned) && "missing", className)}>
      <span aria-hidden className="initial">
        {name ? Array.from(name)[0]?.toUpperCase() : "?"}
      </span>
      {isNew && <NewTag />}
      {wished && (
        <span role="img" aria-label="On the wishlist" className="tag-wish">
          ♥
        </span>
      )}
      <Stars rarity={rarity} />
    </div>
  );
}
