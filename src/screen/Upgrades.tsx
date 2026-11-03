import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/game/format";
import type { Player } from "@/game/state";
import { actions } from "@/game/store";
import { HREF } from "@/lib/route";
import { cn } from "@/lib/utils";

/** Slots added by each upgrade (slots_at() on the server) */
export const SLOTS_PER_UPGRADE = 5;

/** Whether the player can't take another fraud; false on servers without slots */
export function isFull(player: Player): boolean {
  return player.slots !== null && player.slotsUsed >= player.slots;
}

function useUpgrade() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const upgrade = async () => {
    setBusy(true);
    setError(null);
    const refused = await actions.upgradeSlots();
    setBusy(false);
    if (refused) setError(refused.error);
  };
  return { busy, error, upgrade };
}

/** The account page's upgrades; nothing on servers without slots */
export function Upgrades({ player }: { player: Player }) {
  const { busy, error, upgrade } = useUpgrade();
  if (player.slots === null) return null;
  const cost = player.slotUpgradeCost;
  const short = cost !== null && player.fraudbucks < cost;

  return (
    <section aria-labelledby="upgrades-title" className="flex flex-col gap-2">
      <h3 id="upgrades-title" className="text-sm font-semibold text-muted-foreground">
        Upgrades
      </h3>
      <div className="action-list">
        <div className={cn("action-item", error && "has-error")}>
          <button type="button" disabled={busy || cost === null || short} className="action-row" onClick={upgrade}>
            <span aria-hidden className="action-icon tone-gold">
              <svg viewBox="0 0 16 16" className="size-4">
                <path d="M2.5 3.5h4.5v4h-4.5zM9 3.5h4.5v4H9zM2.5 9.5h4.5v4h-4.5zM9 9.5h4.5v4H9z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-semibold tabular-nums">
                Collection slots · {player.slotsUsed} of {player.slots} used
              </span>
              <span className="action-note truncate text-xs text-muted-foreground">
                {error ??
                  (cost === null
                    ? "Room for every name in the game"
                    : short
                      ? `+${SLOTS_PER_UPGRADE} slots for ${formatMoney(cost)} · you have ${formatMoney(player.fraudbucks)}`
                      : `+${SLOTS_PER_UPGRADE} slots, for good`)}
              </span>
            </span>
            {cost !== null && (
              <span className="action-aside text-sm font-semibold tabular-nums">
                {busy ? "Upgrading…" : formatMoney(cost)}
              </span>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

/** Says the collection is full, with the upgrade right there */
export function SlotsFull({ player }: { player: Player }) {
  const { busy, error, upgrade } = useUpgrade();
  const cost = player.slotUpgradeCost;

  return (
    <div role="status" className="flex flex-col gap-2 rounded-md border border-border p-3 text-sm">
      <p>
        <span className="font-semibold">Your collection is full</span>{" "}
        <span className="text-muted-foreground tabular-nums">
          ({player.slotsUsed} of {player.slots} slots). New names can't be claimed until you upgrade your slots or
          sell a fraud. Names you have still pay when claimed.
        </span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {cost !== null && (
          <Button size="sm" disabled={busy || player.fraudbucks < cost} onClick={upgrade} className="tabular-nums">
            {busy ? "Upgrading…" : `+${SLOTS_PER_UPGRADE} slots · ${formatMoney(cost)}`}
          </Button>
        )}
        <a href={HREF.encyclopedia} className="btn btn-plain h-8 px-2 text-sm">
          Sell a fraud
        </a>
      </div>
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
