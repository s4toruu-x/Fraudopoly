import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/game/account";
import { formatDate } from "@/game/format";
import type { Entry } from "@/game/state";
import {
  cancelTrade,
  createTrade,
  fetchTrades,
  findPlayer,
  respondTrade,
  type Picked,
  type Trade,
  type TradeCard,
} from "@/game/trades";
import { HREF } from "@/lib/route";

const POLL_MS = 15_000;

const STATUS: Record<Trade["status"], string> = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  cancelled: "Cancelled",
  failed: "Failed: the names weren't there anymore",
};

export function Trades({ entries }: { entries: Entry[] }) {
  const account = useAccount();
  const signedIn = account.status === "signed-in";
  const [trades, setTrades] = useState<Trade[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const answer = await fetchTrades();
    if ("error" in answer) setError(answer.error);
    else {
      setTrades(answer.data);
      setError(null);
    }
  }, []);

  useEffect(() => {
    if (!signedIn) return;
    void load();
    const timer = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(timer);
  }, [signedIn, load]);

  if (!signedIn) {
    return (
      <section aria-labelledby="trades-title" className="flex max-w-md flex-col gap-3">
        <h2 id="trades-title" className="text-xl font-semibold">
          Trades
        </h2>
        <p className="text-muted-foreground">
          Trading needs an account, so other players can find you by username.{" "}
          <a href={HREF.account} className="text-foreground underline underline-offset-2">
            Create one
          </a>
          . Your names come with you.
        </p>
      </section>
    );
  }

  const mine: TradeCard[] = entries
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.rarity - a.rarity || a.position - b.position)
    .map((entry) => ({ id: entry.id, name: entry.name, rarity: entry.rarity }));
  const pending = (trade: Trade) => trade.status === "pending";

  return (
    <section aria-labelledby="trades-title" className="flex flex-col gap-6">
      <h2 id="trades-title" className="text-xl font-semibold">
        Trades
      </h2>
      <NewOffer mine={mine} onSent={load} />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {trades === null ? (
        <p className="text-sm text-muted-foreground">Loading trades…</p>
      ) : (
        <>
          <TradeGroup
            title="Offers to you"
            empty="No offers right now."
            trades={trades.filter((t) => pending(t) && !t.outgoing)}
            onChange={load}
          />
          <TradeGroup
            title="Sent"
            empty="No offers waiting for an answer."
            trades={trades.filter((t) => pending(t) && t.outgoing)}
            onChange={load}
          />
          {trades.some((t) => !pending(t)) && (
            <TradeGroup title="History" empty="" trades={trades.filter((t) => !pending(t))} onChange={load} />
          )}
        </>
      )}
    </section>
  );
}

function NewOffer({ mine, onSent }: { mine: TradeCard[]; onSent: () => Promise<void> }) {
  const [name, setName] = useState("");
  const [them, setThem] = useState<{ username: string; cards: TradeCard[] } | null>(null);
  const [give, setGive] = useState<Picked>([]);
  const [want, setWant] = useState<Picked>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const anything = give.length + want.length > 0;

  // Each side can only get names it doesn't have, so the rest aren't offered
  const theirs = new Set(them?.cards.map((card) => card.id));
  const mineIds = new Set(mine.map((card) => card.id));
  const canGive = mine.filter((card) => !theirs.has(card.id));
  const canGet = them?.cards.filter((card) => !mineIds.has(card.id)) ?? [];

  async function find(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const answer = await findPlayer(name);
    setBusy(false);
    if ("error" in answer) {
      setError(answer.error);
      setThem(null);
    } else {
      setThem(answer.data);
      setGive([]);
      setWant([]);
    }
  }

  async function send() {
    if (!them) return;
    setBusy(true);
    setError(null);
    const problem = await createTrade(them.username, give, want);
    setBusy(false);
    if (problem) {
      setError(problem);
      return;
    }
    setNotice(`Offer sent to ${them.username}.`);
    setThem(null);
    setName("");
    await onSent();
  }

  return (
    <div className="panel flex flex-col gap-4 p-5">
      <h3 className="font-semibold">New offer</h3>
      <form onSubmit={find} className="flex gap-2">
        <input
          className="field min-w-0 flex-1"
          placeholder="Player's username"
          aria-label="Player's username"
          autoCapitalize="none"
          spellCheck={false}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Button type="submit" variant="outline" disabled={busy}>
          Find
        </Button>
      </form>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {notice && <p className="text-sm text-muted-foreground">{notice}</p>}

      {them && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Picker
              title="You give"
              cards={canGive}
              hidden={mine.length - canGive.length}
              hiddenBy={`${them.username} already has`}
              picked={give}
              onChange={setGive}
              empty={mine.length === 0 ? "You have no names yet." : `${them.username} already has all of yours.`}
            />
            <Picker
              title={`You get from ${them.username}`}
              cards={canGet}
              hidden={them.cards.length - canGet.length}
              hiddenBy="you already have"
              picked={want}
              onChange={setWant}
              empty={
                them.cards.length === 0
                  ? `${them.username} has no names yet.`
                  : `You already have all of ${them.username}'s names.`
              }
            />
          </div>
          <p className="text-xs text-muted-foreground">
            You can only get names you don't have, and the names you give leave your collection. One side
            can stay empty, for a gift or a request.
          </p>
          <Button onClick={send} disabled={busy || !anything} className="self-start">
            Send offer
          </Button>
        </>
      )}
    </div>
  );
}

function Picker({
  title,
  cards,
  hidden,
  hiddenBy,
  picked,
  onChange,
  empty,
}: {
  title: string;
  cards: TradeCard[];
  /** Names left out because the other side already has them */
  hidden: number;
  /** Who has the left-out names, like "you already have" */
  hiddenBy: string;
  picked: Picked;
  onChange: (picked: Picked) => void;
  empty: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">{title}</p>
      {cards.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {cards.map((card) => {
            const on = picked.includes(card.id);
            return (
              <li key={card.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => onChange(on ? picked.filter((id) => id !== card.id) : [...picked, card.id])}
                  className="chip"
                >
                  <span aria-hidden className={`dot r-${card.rarity}`} />
                  {card.name}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {hidden > 0 && cards.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {hidden} not shown: {hiddenBy} {hidden === 1 ? "it" : "them"}.
        </p>
      )}
    </div>
  );
}

function TradeGroup({
  title,
  empty,
  trades,
  onChange,
}: {
  title: string;
  empty: string;
  trades: Trade[];
  onChange: () => Promise<void>;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      {trades.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {trades.map((trade) => (
            <TradeRow key={trade.id} trade={trade} onChange={onChange} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TradeRow({ trade, onChange }: { trade: Trade; onChange: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const youGive = trade.outgoing ? trade.give : trade.want;
  const youGet = trade.outgoing ? trade.want : trade.give;
  const open = trade.status === "pending";

  async function answer(accept: boolean) {
    setBusy(true);
    setError(null);
    const result = await respondTrade(trade.id, accept);
    setBusy(false);
    if ("error" in result) setError(result.error);
    else if (result.data === "failed") setError("One of you no longer has those names, so nothing changed.");
    await onChange();
  }

  async function cancel() {
    setBusy(true);
    const problem = await cancelTrade(trade.id);
    setBusy(false);
    setError(problem);
    await onChange();
  }

  return (
    <li className="panel flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">{trade.outgoing ? `To ${trade.other}` : `From ${trade.other}`}</span>
        <span className="text-xs text-muted-foreground">
          {STATUS[trade.status]} · {formatDate(trade.createdAt)}
        </span>
      </div>
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <Side label="You give" cards={youGive} />
        <Side label="You get" cards={youGet} />
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {open && (
        <div className="flex gap-2">
          {trade.outgoing ? (
            <Button variant="outline" size="sm" disabled={busy} onClick={cancel}>
              Cancel offer
            </Button>
          ) : (
            <>
              <Button size="sm" disabled={busy} onClick={() => answer(true)}>
                Accept
              </Button>
              <Button variant="outline" size="sm" disabled={busy} onClick={() => answer(false)}>
                Decline
              </Button>
            </>
          )}
        </div>
      )}
    </li>
  );
}

function Side({ label, cards }: { label: string; cards: TradeCard[] }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      {cards.length === 0 ? (
        <p className="text-muted-foreground">Nothing</p>
      ) : (
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          {cards.map((card) => (
            <li key={card.id} className="flex items-center gap-1.5">
              <span aria-hidden className={`dot r-${card.rarity}`} />
              {card.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
