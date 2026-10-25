import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { RARITIES } from "@/game/content";
import { formatChance, formatDate, formatMoney } from "@/game/format";
import { nameChance } from "@/game/odds";
import type { Entry, Rules } from "@/game/state";
import { actions } from "@/game/store";
import { NameCard } from "./NameCard";
import { Stars } from "./Rarity";

/** Upper bound on waiting for the 0.14s closing animation */
const CLOSE_FALLBACK_MS = 400;

/** How long a sale waits for its confirm click; the countdown bar in index.css runs this long */
const SELL_CONFIRM_MS = 4000;

interface Props {
  entry: Entry;
  rules: Rules;
  entries: Entry[];
  /** Whose copy this is, when it isn't the player's own */
  owner?: string;
  onClose: () => void;
}

export function NameDetails({ entry, rules, entries, owner, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closing = useRef(false);
  const owned = entry.count > 0;
  // What the fraud just sold for, while this stays open
  const [soldFor, setSoldFor] = useState<number | null>(null);

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
        <div className="relative w-36 shrink-0 sm:w-40">
          <NameCard name={entry.name} rarity={entry.rarity} owned={owned} />
          {soldFor !== null && !owned && (
            <div aria-hidden className="sold-stamp">
              <span>Sold</span>
            </div>
          )}
        </div>
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
            <dt>{owner ?? "Yours"}</dt>
            <dd>{owned ? (entry.foundAt ? `Since ${formatDate(entry.foundAt)}` : "Yes") : "Not yet"}</dd>
          </dl>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-3 sm:px-6">
        {!owner && !owned && rules.wishlistLimit > 0 && (
          <WishButton entry={entry} entries={entries} limit={rules.wishlistLimit} />
        )}
        {!owner && owned && entry.price !== null && (
          <SellButton entry={entry} price={entry.price} onSold={setSoldFor} />
        )}
        {soldFor !== null && !owned && (
          <p role="status" className="sold-note mr-auto">
            <svg aria-hidden viewBox="0 0 16 16" className="size-4">
              <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Sold for {formatMoney(soldFor)}
          </p>
        )}
        <Button variant="outline" autoFocus onClick={close}>
          Close
        </Button>
      </div>
    </dialog>
  );
}

/** Adds the name to the player's wishlist, or takes it off */
function WishButton({ entry, entries, limit }: { entry: Entry; entries: Entry[]; limit: number }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const count = entries.filter((other) => other.wished).length;
  const full = !entry.wished && count >= limit;

  const toggle = async () => {
    setBusy(true);
    setError(null);
    const refused = await actions.wish(entry, !entry.wished);
    setBusy(false);
    if (refused) setError(refused.error);
  };

  return (
    <>
      {error && (
        <p role="alert" className="mr-auto text-sm text-danger">
          {error}
        </p>
      )}
      <Button variant="outline" disabled={busy || full} onClick={toggle} className="mr-auto tabular-nums">
        <span aria-hidden className={entry.wished ? "text-rose-500" : undefined}>
          {entry.wished ? "♥" : "♡"}
        </span>
        {entry.wished ? "Remove from wishlist" : full ? `Wishlist full · ${count}/${limit}` : `Add to wishlist · ${count}/${limit}`}
      </Button>
    </>
  );
}

/** Sells the fraud for its price, after a second click to confirm */
function SellButton({ entry, price, onSold }: { entry: Entry; price: number; onSold: (price: number) => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // An unconfirmed sale goes back to the plain button
  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), SELL_CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [confirming]);

  const click = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setBusy(true);
    setError(null);
    const refused = await actions.sell(entry);
    setBusy(false);
    setConfirming(false);
    if (refused) setError(refused.error);
    else onSold(price);
  };

  return (
    <>
      {error && (
        <p role="alert" className="mr-auto text-sm text-danger">
          {error}
        </p>
      )}
      <Button
        variant={confirming ? "default" : "outline"}
        disabled={busy}
        onClick={click}
        className={confirming ? "sell-confirm mr-auto tabular-nums" : "mr-auto tabular-nums"}
      >
        {busy ? "Selling…" : confirming ? `Confirm sale · ${formatMoney(price)}` : `Sell for ${formatMoney(price)}`}
        {confirming && !busy && <span aria-hidden className="sell-countdown" />}
      </Button>
    </>
  );
}
