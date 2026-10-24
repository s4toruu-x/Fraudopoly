import { useEffect, useState } from "react";
import { RARITIES } from "@/game/content";
import { formatAgo, formatCategory, formatMoney } from "@/game/format";
import type { Entry, FeedPull, Rules } from "@/game/state";
import { refreshFeed } from "@/game/store";
import { useNow } from "@/lib/useNow";
import { NameCard } from "./NameCard";
import { NameDetails } from "./NameDetails";
import { Stars } from "./Rarity";

const POLL_MS = 20_000;

interface Props {
  myPulls: FeedPull[];
  claims: FeedPull[];
  entries: Entry[];
  rules: Rules;
}

export function LatestPulls({ myPulls, claims, entries, rules }: Props) {
  const now = useNow();
  const [opened, setOpened] = useState<number | null>(null);
  const details = entries.find((entry) => entry.position === opened);

  useEffect(() => {
    const timer = setInterval(() => void refreshFeed(), POLL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <List
        id="mine-title"
        title="Your latest pulls"
        empty="Your pulls will show up here."
        pulls={myPulls}
        onOpen={setOpened}
        row={(pull) => ({
          who: null,
          note: !pull.claimed
            ? "Not claimed"
            : pull.reward > 0
              ? `Claimed · +${formatMoney(pull.reward)}`
              : "Claimed",
          claimed: pull.claimed,
          at: formatAgo(pull.pulledAt, now),
        })}
      />
      <List
        id="claims-title"
        title="Latest claims"
        aside="Everyone"
        empty="Claims from every player will show up here."
        pulls={claims}
        onOpen={setOpened}
        row={(pull) => ({
          who: pull.isMe ? "You" : (pull.player ?? "A guest"),
          note: pull.reward > 0 ? `+${formatMoney(pull.reward)}` : null,
          claimed: false,
          at: formatAgo(pull.claimedAt ?? pull.pulledAt, now),
        })}
      />
      {details && (
        <NameDetails
          key={details.position}
          entry={details}
          rules={rules}
          entries={entries}
          onClose={() => setOpened(null)}
        />
      )}
    </div>
  );
}

interface Row {
  who: string | null;
  note: string | null;
  claimed: boolean;
  at: string;
}

function List({
  id,
  title,
  aside,
  empty,
  pulls,
  onOpen,
  row,
}: {
  id: string;
  title: string;
  aside?: string;
  empty: string;
  pulls: FeedPull[];
  onOpen: (position: number) => void;
  row: (pull: FeedPull) => Row;
}) {
  return (
    <section aria-labelledby={id} className="panel flex min-w-0 flex-col gap-3 p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id={id} className="font-semibold">
          {title}
        </h2>
        {aside && <span className="text-xs text-muted-foreground">{aside}</span>}
      </div>
      {pulls.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        // Negative margin and padding give the rows' hover background room
        <ul className="-mx-2 flex max-h-96 flex-col divide-y divide-border overflow-y-auto overscroll-contain px-2">
          {pulls.map((pull) => {
            const { who, note, claimed, at } = row(pull);
            return (
              <li key={pull.id} className="py-1 first:pt-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => onOpen(pull.position)}
                  className="row-button flex items-center gap-3 py-1 text-left"
                >
                  <NameCard name={pull.name} rarity={pull.rarity} className="w-8 shrink-0 [&_.stars]:hidden" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm">
                      {who && (
                        <>
                          <span className="font-medium">{who}</span>
                          <span className="text-muted-foreground"> claimed </span>
                        </>
                      )}
                      <span className="font-medium">{pull.name}</span>
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      <Stars rarity={pull.rarity} /> {RARITIES[pull.rarity].name} · {formatCategory(pull.category)}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-0.5 text-right text-xs tabular-nums">
                    {note && (
                      <span className={claimed ? "font-semibold" : pull.reward > 0 ? "text-stars" : "text-muted-foreground"}>
                        {note}
                      </span>
                    )}
                    <span className="text-muted-foreground">{at}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
