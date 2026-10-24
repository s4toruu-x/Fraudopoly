import { useCallback, useEffect, useState } from "react";
import { useAccount } from "@/game/account";
import { formatMoney } from "@/game/format";
import { fetchLeaderboard, type Leaderboard as Board, type Place } from "@/game/leaderboard";
import { HREF } from "@/lib/route";
import { cn } from "@/lib/utils";

const POLL_MS = 30_000;

export function Leaderboard() {
  const account = useAccount();
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const answer = await fetchLeaderboard();
    if ("error" in answer) setError(answer.error);
    else {
      setBoard(answer.data);
      setError(null);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const mine = board?.me && !board.top.some((place) => place.isMe) ? board.me : null;

  return (
    <section aria-labelledby="leaderboard-title" className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="leaderboard-title" className="text-xl font-semibold">
          Leaderboard
        </h2>
        <p className="text-sm text-muted-foreground">Most valuable collections</p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      {board === null ? (
        !error && <p className="text-muted-foreground">Loading…</p>
      ) : board.top.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">Nobody with an account has a name yet.</p>
      ) : (
        <div className="panel px-5 py-2 sm:px-6">
          <table className="rates-table">
            <thead>
              <tr>
                <th className="w-12 text-left">#</th>
                <th className="text-left">Player</th>
                <th className="text-right">Frauds</th>
                <th className="text-right">Worth</th>
              </tr>
            </thead>
            <tbody>
              {board.top.map((place) => (
                <Row key={place.player} place={place} />
              ))}
              {mine && (
                <>
                  <tr aria-hidden>
                    <td colSpan={4} className="text-center text-muted-foreground">
                      …
                    </td>
                  </tr>
                  <Row place={mine} />
                </>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        A collection is worth the sum of its names' prices.{" "}
        {account.status === "guest" && (
          <>
            Guests aren't on the leaderboard:{" "}
            <a href={HREF.account} className="text-foreground underline underline-offset-2">
              create an account
            </a>{" "}
            to be on it. Your names come with you.
          </>
        )}
      </p>
    </section>
  );
}

function Row({ place }: { place: Place }) {
  return (
    <tr className={cn(place.isMe && "font-semibold")}>
      <td className="text-muted-foreground tabular-nums">{place.rank}</td>
      <td className="max-w-0 truncate">
        {place.player}
        {place.isMe && <span className="font-normal text-muted-foreground"> (you)</span>}
      </td>
      <td className="text-right tabular-nums">{place.names}</td>
      <td className="text-right text-stars tabular-nums">{formatMoney(place.value)}</td>
    </tr>
  );
}
