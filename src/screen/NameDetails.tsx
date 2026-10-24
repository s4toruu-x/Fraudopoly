import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { RARITIES } from "@/game/content";
import { formatChance, formatDate, formatMoney } from "@/game/format";
import { nameChance } from "@/game/odds";
import type { Entry, Rules } from "@/game/state";
import { NameCard } from "./NameCard";
import { Stars } from "./Rarity";

/** Upper bound on waiting for the 0.14s closing animation */
const CLOSE_FALLBACK_MS = 400;

interface Props {
  entry: Entry;
  rules: Rules;
  entries: Entry[];
  onClose: () => void;
}

export function NameDetails({ entry, rules, entries, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closing = useRef(false);
  const owned = entry.count > 0;

  useEffect(() => {
    // React's development double run would open it twice
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);

  const close = () => {
    const element = dialog.current;
    if (!element || closing.current) return;
    closing.current = true;
    element.dataset.closing = "";
    const effect = Promise.allSettled(element.getAnimations().map((animation) => animation.finished));
    // Hidden tabs don't run animations, so close anyway after a moment
    const fallback = new Promise((resolve) => setTimeout(resolve, CLOSE_FALLBACK_MS));
    void Promise.race([effect, fallback]).then(() => element.close());
  };

  return (
    <dialog
      ref={dialog}
      aria-labelledby="details-title"
      className="details"
      onClose={onClose}
      // Run the closing animation first; a second Esc closes at once
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      // Only the backdrop hits the dialog element itself
      onClick={(event) => event.target === dialog.current && close()}
    >
      <div className="flex flex-col items-center gap-5 p-5 sm:flex-row sm:items-start sm:p-6">
        <NameCard name={entry.name} rarity={entry.rarity} owned={owned} className="w-36 shrink-0 sm:w-40" />
        <div className="flex w-full min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <h2 id="details-title" className="text-xl font-semibold [overflow-wrap:anywhere]">
              {entry.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              <Stars rarity={entry.rarity} /> {RARITIES[entry.rarity].name}
            </p>
          </div>
          <dl className="details-list">
            <dt>Type</dt>
            <dd>{entry.category.type}</dd>
            {entry.category.name && (
              <>
                <dt>From</dt>
                <dd>{entry.category.name}</dd>
              </>
            )}
            {entry.price !== null && (
              <>
                <dt>Price</dt>
                <dd className="tabular-nums">{formatMoney(entry.price)}</dd>
              </>
            )}
            <dt>Duplicate pays</dt>
            <dd className="tabular-nums">+{formatMoney(rules.duplicateRewards[entry.rarity])}</dd>
            <dt>Chance per pull</dt>
            <dd className="tabular-nums">{formatChance(nameChance(rules, entries, entry))}</dd>
            <dt>Yours</dt>
            <dd>{owned ? (entry.foundAt ? `Since ${formatDate(entry.foundAt)}` : "Yes") : "Not yet"}</dd>
          </dl>
        </div>
      </div>
      <div className="flex justify-end border-t border-border px-5 py-3 sm:px-6">
        <Button variant="outline" autoFocus onClick={close}>
          Close
        </Button>
      </div>
    </dialog>
  );
}
