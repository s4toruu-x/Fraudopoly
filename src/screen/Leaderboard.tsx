import { useCallback, useEffect, useState } from "react";
import { useAccount } from "@/game/account";
import { CURRENCY } from "@/game/content";
import { formatMoney } from "@/game/format";
import { fetchLeaderboards, type Board, type Leaderboards, type Place } from "@/game/leaderboard";
import { HREF, profileHref } from "@/lib/route";
import { cn } from "@/lib/utils";

const POLL_MS = 30_000;

type Kind = "collection" | "fraudbucks";

const KINDS: { id: Kind; label: string }[] = [
  { id: "collection", label: "Collection" },
  { id: "fraudbucks", label: CURRENCY.name },
];

export function Leaderboard() {
  const account = useAccount();
  const [kind, setKind] = useState<Kind>("collection");
  const [boards, setBoards] = useState<Leaderboards | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const answer = await fetchLeaderboards();
    if ("error" in answer) setError(answer.error);
    else {
      setBoards(answer.data);
      setError(null);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const board = boards?.[kind];

  return (
    <section aria-labelledby="leaderboard-title" className="flex flex-col gap-4">
      <h2 id="leaderboard-title" className="text-xl font-semibold">
        Leaderboard
      </h2>
      <div role="group" aria-label="Rank by" className="tabs">
        {KINDS.map(({ id, label }) => (
          <button key={id} type="button" aria-pressed={kind === id} onClick={() => setKind(id)}>
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      {!board ? (
        !error && <p className="text-muted-foreground">Loading…</p>
      ) : board.top.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">Nobody with an account is on this board yet.</p>
      ) : (
        <Table board={board} kind={kind} />
      )}

      {account.status === "guest" && (
        <p className="text-sm text-muted-foreground">
          Guests aren't on the leaderboard:{" "}
          <a href={HREF.account} className="text-foreground underline underline-offset-2">
            create an account
          </a>{" "}
          to be on it. Your frauds come with you.
        </p>
      )}
    </section>
  );
}

function Table({ board, kind }: { board: Board; kind: Kind }) {
  // Below the top, the viewer's own place gets a row of its own
  const mine = board.me && !board.top.some((place) => place.isMe) ? board.me : null;

  return (
    <div className="panel px-5 py-2 sm:px-6">
      <table className="rates-table">
        <thead>
          <tr>
            <th className="w-12 text-left">#</th>
            <th className="text-left">Player</th>
            {kind === "collection" ? (
              <>
                <th className="text-right">Frauds</th>
                <th className="text-right">Worth</th>
              </>
            ) : (
              <>
                <th className="text-right">{CURRENCY.name}</th>
                <th className="text-right">Net worth</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {board.top.map((place) => (
            <Row key={place.player} place={place} kind={kind} />
          ))}
          {mine && (
            <>
              <tr aria-hidden>
                <td colSpan={4} className="text-center text-muted-foreground">
                  …
                </td>
              </tr>
              <Row place={mine} kind={kind} />
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Row({ place, kind }: { place: Place; kind: Kind }) {
  return (
    <tr className={cn(place.isMe && "font-semibold")}>
      <td className="text-muted-foreground tabular-nums">{place.rank}</td>
      <td className="max-w-0 truncate">
        <a href={profileHref(place.player)} className="hover:underline hover:underline-offset-2">
          {place.player}
        </a>
        {place.isMe && <span className="font-normal text-muted-foreground"> (you)</span>}
      </td>
      {kind === "collection" ? (
        <>
          <td className="text-right tabular-nums">{place.names}</td>
          <td className="text-right text-stars tabular-nums">{formatMoney(place.value)}</td>
        </>
      ) : (
        <>
          <td className="text-right tabular-nums">{formatMoney(place.fraudbucks)}</td>
          <td className="text-right text-stars tabular-nums">{formatMoney(place.netWorth)}</td>
        </>
      )}
    </tr>
  );
}
