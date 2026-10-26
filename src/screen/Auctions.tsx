import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/game/account";
import { cancelAuction, fetchAuctions, placeBid, type Auction, type Auctions as AuctionsData } from "@/game/auctions";
import { RARITIES } from "@/game/content";
import { formatAgo, formatCategory, formatMoney, formatTimeLeft } from "@/game/format";
import type { Entry } from "@/game/state";
import { HREF, profileHref } from "@/lib/route";
import { useNow } from "@/lib/useNow";
import { cn } from "@/lib/utils";
import { NameCard } from "./NameCard";
import { Stars } from "./Rarity";

const POLL_MS = 10_000;

type Show = "live" | "ended";

/** Live auctions to bid on, and how the latest ones ended */
export function Auctions({ entries }: { entries: Entry[] }) {
  const account = useAccount();
  const now = useNow();
  const [show, setShow] = useState<Show>("live");
  const [auctions, setAuctions] = useState<AuctionsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const answer = await fetchAuctions();
    if ("error" in answer) setError(answer.error);
    else {
      setAuctions(answer.data);
      setError(null);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  // One that just ran out is settled by the server on the next look
  const overdue = auctions?.live.some((auction) => auction.endsAt <= now) ?? false;
  useEffect(() => {
    if (overdue) void load();
  }, [overdue, load]);

  const list = show === "live" ? auctions?.live.filter((auction) => auction.endsAt > now) : auctions?.ended;

  return (
    <section aria-labelledby="auctions-title" className="flex flex-col gap-4">
      <h2 id="auctions-title" className="text-xl font-semibold">
        Auctions
      </h2>
      <div role="group" aria-label="Show" className="tabs">
        <button type="button" aria-pressed={show === "live"} onClick={() => setShow("live")}>
          Live{auctions && auctions.live.length > 0 ? ` · ${auctions.live.length}` : ""}
        </button>
        <button type="button" aria-pressed={show === "ended"} onClick={() => setShow("ended")}>
          Ended
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {account.status === "guest" && (
        <p className="text-sm text-muted-foreground">
          Bidding and selling need an account.{" "}
          <a href={HREF.account} className="text-foreground underline underline-offset-2">
            Create one
          </a>
          ; your frauds come with you.
        </p>
      )}

      {!list ? (
        !error && <p className="text-muted-foreground">Loading…</p>
      ) : list.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          {show === "live"
            ? "No auctions right now. Put one of your frauds up for auction from its details."
            : "No auctions have ended yet."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((auction) =>
            show === "live" ? (
              <LiveAuction
                key={auction.id}
                auction={auction}
                now={now}
                canBid={account.status === "signed-in"}
                owned={entries.some((entry) => entry.position === auction.position && entry.count > 0)}
                onChanged={load}
              />
            ) : (
              <EndedAuction key={auction.id} auction={auction} now={now} />
            ),
          )}
        </ul>
      )}
    </section>
  );
}

function Header({ auction }: { auction: Auction }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <NameCard name={auction.name} rarity={auction.rarity} className="w-12 shrink-0 [&_.stars]:hidden" />
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-semibold">{auction.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          <Stars rarity={auction.rarity} /> {RARITIES[auction.rarity].name} · {formatCategory(auction.category)}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          by{" "}
          <a href={profileHref(auction.seller)} className="hover:text-foreground hover:underline">
            {auction.isMine ? "you" : auction.seller}
          </a>
        </span>
      </div>
    </div>
  );
}

function LiveAuction({
  auction,
  now,
  canBid,
  owned,
  onChanged,
}: {
  auction: Auction;
  now: number;
  canBid: boolean;
  owned: boolean;
  onChanged: () => Promise<void>;
}) {
  const [amount, setAmount] = useState(String(auction.minBid));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const left = auction.endsAt - now;

  // When someone else bids, the box moves up to the new least bid
  useEffect(() => {
    setAmount((current) => (Number(current) < auction.minBid ? String(auction.minBid) : current));
  }, [auction.minBid]);

  const bid = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const refused = await placeBid(auction.id, Math.floor(Number(amount)));
    setBusy(false);
    if (refused) setError(refused.error);
    await onChanged();
  };

  const cancel = async () => {
    setBusy(true);
    setError(null);
    const refused = await cancelAuction(auction.id);
    setBusy(false);
    if (refused) setError(refused.error);
    await onChanged();
  };

  // Why this player can't bid, if they can't
  const blocked = auction.isMine
    ? null
    : !canBid
      ? "Bidding needs an account"
      : owned
        ? "You already have it"
        : auction.leading
          ? "You're the top bidder"
          : null;

  return (
    <li className={cn("panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center", auction.leading && "auction-leading")}>
      <Header auction={auction} />
      <dl className="grid grid-cols-3 gap-3 text-sm sm:w-72 sm:shrink-0">
        <div>
          <dt className="text-xs text-muted-foreground">{auction.topBid === null ? "Starts at" : "Top bid"}</dt>
          <dd className="font-semibold text-stars tabular-nums">{formatMoney(auction.topBid ?? auction.startPrice)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Bids</dt>
          <dd className="truncate font-semibold tabular-nums">
            {auction.bids}
            {auction.topBidder && <span className="font-normal text-muted-foreground"> · {auction.leading ? "you" : auction.topBidder}</span>}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Ends in</dt>
          <dd className={cn("font-semibold tabular-nums", left < 120e3 && "text-danger")}>{formatTimeLeft(left)}</dd>
        </div>
      </dl>
      <div className="flex flex-col gap-1.5 sm:w-48 sm:shrink-0">
        {auction.isMine ? (
          auction.bids === 0 ? (
            <Button variant="outline" disabled={busy} onClick={cancel}>
              {busy ? "Cancelling…" : "Cancel auction"}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">Your auction</p>
          )
        ) : blocked ? (
          <p className="text-sm text-muted-foreground">{blocked}</p>
        ) : (
          <form onSubmit={bid} className="flex gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={auction.minBid}
              step={1}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              aria-label={`Bid on ${auction.name}`}
              className="field h-9 w-full min-w-0 tabular-nums"
            />
            <Button type="submit" disabled={busy || Number(amount) < auction.minBid}>
              {busy ? "…" : "Bid"}
            </Button>
          </form>
        )}
        {!auction.isMine && !blocked && (
          <p className="text-xs text-muted-foreground">At least {formatMoney(auction.minBid)}</p>
        )}
        {error && (
          <p role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    </li>
  );
}

const OUTCOME: Record<Auction["status"], string> = {
  live: "",
  sold: "Sold",
  unsold: "No bids",
  cancelled: "Cancelled",
  failed: "Fell through",
};

function EndedAuction({ auction, now }: { auction: Auction; now: number }) {
  return (
    <li className="panel flex items-center gap-4 p-4">
      <Header auction={auction} />
      <div className="flex shrink-0 flex-col items-end text-right text-sm">
        <span className={cn("font-semibold", auction.status === "sold" && "text-stars")}>
          {auction.status === "sold"
            ? `${formatMoney(auction.topBid ?? 0)} to ${auction.leading ? "you" : auction.topBidder}`
            : OUTCOME[auction.status]}
        </span>
        <span className="text-xs text-muted-foreground">
          {OUTCOME[auction.status]} · {formatAgo(auction.endsAt, now)}
        </span>
      </div>
    </li>
  );
}
