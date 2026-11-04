import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CURRENCY } from "@/game/content";
import { formatClock, formatMoney } from "@/game/format";
import type { Player } from "@/game/state";
import { actions } from "@/game/store";
import { useNow } from "@/lib/useNow";

/** Collects the day's Fraudbucks; nothing on servers without the daily reward */
export function DailyReward({ player }: { player: Player }) {
  const [busy, setBusy] = useState(false);
  const [paid, setPaid] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const now = useNow();
  const daily = player.daily;
  if (!daily) return null;
  // Past midnight the server has a new day, even if this copy hasn't heard yet
  const ready = daily.ready || now >= daily.next;

  const collect = async () => {
    setBusy(true);
    setError(null);
    const answer = await actions.claimDaily();
    setBusy(false);
    if ("error" in answer) setError(answer.error);
    else setPaid(answer.paid);
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-semibold">Daily {CURRENCY.name}</span>
        {error ? (
          <span role="alert" className="text-xs text-danger">
            {error}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground tabular-nums">
            {ready
              ? `Collect ${formatMoney(daily.min)} to ${formatMoney(daily.max)}, once a day`
              : `${paid !== null ? `You got ${formatMoney(paid)}. ` : ""}Next one at ${formatClock(daily.next)}`}
          </span>
        )}
      </div>
      <Button size="sm" disabled={!ready || busy} onClick={collect} className="shrink-0">
        {busy ? "Collecting…" : ready ? "Collect" : "Collected"}
      </Button>
    </div>
  );
}
