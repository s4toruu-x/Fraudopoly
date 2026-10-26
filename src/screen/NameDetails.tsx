import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAccount } from "@/game/account";
import { AUCTION_HOURS, START_MULTIPLIER, createAuction } from "@/game/auctions";
import { Button } from "@/components/ui/button";
import { RARITIES } from "@/game/content";
import { formatChance, formatDate, formatMoney } from "@/game/format";
import { nameChance } from "@/game/odds";
import type { Entry, Rules } from "@/game/state";
import { actions } from "@/game/store";
import { HREF } from "@/lib/route";
import { cn } from "@/lib/utils";
import { NameCard } from "./NameCard";
import { Stars } from "./Rarity";

/** Upper bound on waiting for the 0.14s closing animation */
const CLOSE_FALLBACK_MS = 400;

/** How long a sale waits for its confirm tap; the countdown bar in index.css runs this long */
const SELL_CONFIRM_MS = 4000;

interface Props {
  entry: Entry;
  rules: Rules;
  entries: Entry[];
  /** Whose copy this is, when it isn't the player's own */
  owner?: string;
  onClose: () => void;
}

type Outcome = { kind: "sold" | "listed"; amount: number };

export function NameDetails({ entry, rules, entries, owner, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closing = useRef(false);
  const owned = entry.count > 0;
  // What just happened to the fraud, while this stays open
  const [outcome, setOutcome] = useState<Outcome | null>(null);

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
      <button type="button" aria-label="Close" autoFocus onClick={close} className="details-close">
        <svg aria-hidden viewBox="0 0 16 16" className="size-4">
          <path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
      <div className="flex flex-col items-center gap-5 p-5 sm:flex-row sm:items-start sm:p-6">
        <div className="relative w-36 shrink-0 sm:w-40">
          <NameCard name={entry.name} rarity={entry.rarity} owned={owned} />
          {outcome && !owned && (
            <div aria-hidden className="sold-stamp">
              <span>{outcome.kind === "sold" ? "Sold" : "Listed"}</span>
            </div>
          )}
        </div>
        <div className="flex w-full min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-1 text-center sm:pr-8 sm:text-left">
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

      {!owner && (
        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <Actions entry={entry} entries={entries} rules={rules} outcome={outcome} onOutcome={setOutcome} />
        </div>
      )}
    </dialog>
  );
}

/** What the player can do with this name: sell or auction one they own, wish for one they don't */
function Actions({
  entry,
  entries,
  rules,
  outcome,
  onOutcome,
}: {
  entry: Entry;
  entries: Entry[];
  rules: Rules;
  outcome: Outcome | null;
  onOutcome: (outcome: Outcome) => void;
}) {
  const account = useAccount();
  const owned = entry.count > 0;
  const rows: ReactNode[] = [];

  if (outcome && !owned) {
    rows.push(<OutcomeRow key="outcome" outcome={outcome} />);
  }
  if (!outcome && owned && entry.price !== null) {
    rows.push(<SellRow key="sell" entry={entry} price={entry.price} onSold={(amount) => onOutcome({ kind: "sold", amount })} />);
    if (account.status === "signed-in") {
      rows.push(
        <AuctionRow key="auction" entry={entry} price={entry.price} onListed={(amount) => onOutcome({ kind: "listed", amount })} />,
      );
    }
  }
  if (!owned && outcome?.kind !== "listed" && rules.wishlistLimit > 0) {
    rows.push(<WishRow key="wish" entry={entry} entries={entries} limit={rules.wishlistLimit} />);
  }

  if (rows.length === 0) return null;
  return <div className="action-list">{rows}</div>;
}

/** One row: a tinted icon, a title with a line under it, and what it's worth on the right */
function Row({
  icon,
  tone,
  title,
  note,
  aside,
  chevron,
  open = false,
  busy = false,
  className,
  onClick,
  children,
}: {
  icon: ReactNode;
  tone: "gold" | "blue" | "rose" | "green";
  title: ReactNode;
  note: ReactNode;
  aside?: ReactNode;
  chevron?: boolean;
  open?: boolean;
  busy?: boolean;
  className?: string;
  onClick?: () => void;
  children?: ReactNode;
}) {
  const body = (
    <>
      <span aria-hidden className={`action-icon tone-${tone}`}>
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold">{title}</span>
        <span className="action-note truncate text-xs text-muted-foreground">{note}</span>
      </span>
      {aside && <span className="action-aside">{aside}</span>}
      {chevron && (
        <svg aria-hidden viewBox="0 0 16 16" className={cn("action-chevron", open && "open")}>
          <path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </>
  );

  return (
    <div className={cn("action-item", className)}>
      {onClick ? (
        <button type="button" disabled={busy} aria-expanded={chevron ? open : undefined} onClick={onClick} className="action-row">
          {body}
        </button>
      ) : (
        <div className="action-row" role="status">
          {body}
        </div>
      )}
      {children}
    </div>
  );
}

const ICONS = {
  tag: (
    <svg viewBox="0 0 16 16" className="size-4">
      <path d="M2.5 8.6V3.5a1 1 0 011-1h5.1l5 5a1 1 0 010 1.4l-4.7 4.7a1 1 0 01-1.4 0z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="5.6" cy="5.6" r="1.1" fill="currentColor" />
    </svg>
  ),
  gavel: (
    <svg viewBox="0 0 16 16" className="size-4">
      <rect x="7.2" y="0.9" width="4.4" height="7.6" rx="1.1" transform="rotate(45 9.4 4.7)" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7.4 8.1L2.6 12.9M9 14.4h5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  heart: (filled: boolean) => (
    <svg viewBox="0 0 16 16" className="size-4">
      <path
        d="M8 13.5S2.5 10.2 2.5 6.3A2.8 2.8 0 018 4.9a2.8 2.8 0 015.5 1.4C13.5 10.2 8 13.5 8 13.5z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 16 16" className="size-4">
      <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

/** Sells the fraud for its price; the first tap asks, the second sells */
function SellRow({ entry, price, onSold }: { entry: Entry; price: number; onSold: (price: number) => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // An unconfirmed sale goes back to normal
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
    <Row
      icon={ICONS.tag}
      tone="gold"
      title={busy ? "Selling…" : confirming ? "Tap again to sell" : "Sell"}
      note={error ?? (confirming ? "It leaves your collection" : "Paid straight into your balance")}
      aside={<span className="text-stars">{formatMoney(price)}</span>}
      chevron={!confirming}
      busy={busy}
      className={cn(confirming && "confirming", error && "has-error")}
      onClick={click}
    >
      {confirming && !busy && <span aria-hidden className="sell-countdown" />}
    </Row>
  );
}

/** Opens a drawer to put the fraud up for auction: how long, at 3x its price */
function AuctionRow({ entry, price, onListed }: { entry: Entry; price: number; onListed: (start: number) => void }) {
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState(AUCTION_HOURS[AUCTION_HOURS.length - 1]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const start = price * START_MULTIPLIER;

  const list = async () => {
    setBusy(true);
    setError(null);
    const refused = await createAuction(entry.id, hours);
    setBusy(false);
    if (refused) setError(refused.error);
    else onListed(start);
  };

  return (
    <Row
      icon={ICONS.gavel}
      tone="blue"
      title="Auction"
      note="Players bid for it, for up to a day"
      aside={
        <span className="flex flex-col items-end leading-tight">
          <span className="text-[10px] font-medium text-muted-foreground uppercase">from</span>
          <span className="text-stars">{formatMoney(start)}</span>
        </span>
      }
      chevron
      open={open}
      onClick={() => setOpen(!open)}
    >
      <div className={cn("action-drawer", open && "open")} inert={!open}>
        {/* Padding goes inside, or the closed drawer would keep its height */}
        <div>
          <div className="flex flex-col gap-3 px-3.5 pt-1 pb-3.5">
            <div role="group" aria-label="Runs for" className="tabs">
              {AUCTION_HOURS.map((option) => (
                <button key={option} type="button" aria-pressed={hours === option} onClick={() => setHours(option)}>
                  {option} {option === 1 ? "hour" : "hours"}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Starts at {START_MULTIPLIER}× its price. The auction holds it until the end: the top bid gets it, and with no
              bids it comes back to you. You can call it off until someone bids.
            </p>
            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
            <Button disabled={busy} onClick={list} className="w-full">
              {busy ? "Starting…" : `Start ${hours === 1 ? "1-hour" : `${hours}-hour`} auction`}
            </Button>
          </div>
        </div>
      </div>
    </Row>
  );
}

/** Adds the name to the player's wishlist, or takes it off */
function WishRow({ entry, entries, limit }: { entry: Entry; entries: Entry[]; limit: number }) {
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
    <Row
      icon={ICONS.heart(entry.wished)}
      tone="rose"
      title={entry.wished ? "On your wishlist" : full ? "Wishlist full" : "Add to wishlist"}
      note={error ?? (entry.wished ? "Tap to take it off" : full ? "Take one off to make room" : "Spot it with a ♥ in your pulls")}
      aside={<span className="text-muted-foreground">{count}/{limit}</span>}
      busy={busy || full}
      className={cn(entry.wished && "wished", error && "has-error")}
      onClick={toggle}
    />
  );
}

/** What just happened: sold, or up for auction */
function OutcomeRow({ outcome }: { outcome: Outcome }) {
  return (
    <Row
      icon={ICONS.check}
      tone="green"
      title={outcome.kind === "sold" ? `Sold for ${formatMoney(outcome.amount)}` : "Up for auction"}
      note={
        outcome.kind === "sold" ? (
          "Added to your balance"
        ) : (
          <>
            From {formatMoney(outcome.amount)} ·{" "}
            <a href={HREF.auctions} className="text-foreground underline underline-offset-2">
              See it on Auctions
            </a>
          </>
        )
      }
      className="outcome"
    />
  );
}
