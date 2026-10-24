import { cn } from "@/lib/utils";
import { NewTag, Stars } from "./Rarity";

export function NameCard({
  name,
  rarity,
  owned = true,
  isNew = false,
  className,
}: {
  name: string | null;
  rarity: number;
  owned?: boolean;
  isNew?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("name-card", `r-${rarity}`, (!name || !owned) && "missing", className)}>
      <span aria-hidden className="initial">
        {name ? Array.from(name)[0]?.toUpperCase() : "?"}
      </span>
      {isNew && <NewTag />}
      <Stars rarity={rarity} />
    </div>
  );
}
