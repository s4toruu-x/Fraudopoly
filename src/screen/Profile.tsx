import { useEffect, useState, type ReactNode } from "react";
import { CURRENCY } from "@/game/content";
import { formatMoney } from "@/game/format";
import { fetchProfile, type Profile as ProfileData } from "@/game/leaderboard";
import type { Entry, Rules } from "@/game/state";
import { HREF } from "@/lib/route";
import { Encyclopedia } from "./Encyclopedia";

/** A player's profile: where they stand, and their encyclopedia. */
export function Profile({ username, entries, rules }: { username: string; entries: Entry[]; rules: Rules }) {
  // Undefined while loading, null when there's no such player
  const [profile, setProfile] = useState<ProfileData | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    setProfile(undefined);
    setError(null);
    void fetchProfile(username).then((answer) => {
      if (!current) return;
      if ("error" in answer) setError(answer.error);
      else setProfile(answer.data);
    });
    return () => {
      current = false;
    };
  }, [username]);

  if (error) {
    return (
      <p role="alert" className="text-danger">
        {error}
      </p>
    );
  }
  if (profile === undefined) return <p className="text-muted-foreground">Loading…</p>;
  if (profile === null) {
    return (
      <div className="flex flex-col items-start gap-2">
        <h2 className="text-xl font-semibold">No player called "{username}"</h2>
        <a href={HREF.leaderboard} className="text-sm text-muted-foreground underline underline-offset-2">
          Back to the leaderboard
        </a>
      </div>
    );
  }

  // Their collection on this player's copy of every name; your own profile uses the live copy
  const theirs: Entry[] = profile.isMe
    ? entries
    : entries.map((entry) => ({
        ...entry,
        count: profile.owned.has(entry.position) ? 1 : 0,
        foundAt: profile.owned.get(entry.position) ?? null,
        wished: profile.wishlist.has(entry.position),
      }));

  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Profile" className="flex flex-col gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span aria-hidden className="menu-avatar size-14 text-xl">
            {Array.from(profile.username)[0]?.toUpperCase()}
          </span>
          <h2 className="min-w-0 truncate text-2xl font-semibold">
            {profile.username}
            {profile.isMe && <span className="text-base font-normal text-muted-foreground"> (you)</span>}
          </h2>
        </div>
        <dl className="grid grid-cols-3 gap-3">
          <Stat label="Frauds" value={String(profile.names)} note={`of ${entries.length}`} />
          <Stat label="Worth" value={formatMoney(profile.value)} note={place(profile.collectionRank)} money />
          <Stat label={CURRENCY.name} value={formatMoney(profile.fraudbucks)} note={place(profile.fraudbucksRank)} money />
        </dl>
      </section>

      <Encyclopedia
        key={profile.username}
        entries={theirs}
        rules={rules}
        owner={profile.isMe ? undefined : profile.username}
      />
    </div>
  );
}

/** A place on a leaderboard, linked to it */
function place(rank: number | null) {
  return rank ? (
    <a href={HREF.leaderboard} className="hover:text-foreground hover:underline hover:underline-offset-2">
      Rank #{rank}
    </a>
  ) : (
    "Not ranked"
  );
}

function Stat({ label, value, note, money = false }: { label: string; value: string; note: ReactNode; money?: boolean }) {
  return (
    <div className="panel flex min-w-0 flex-col gap-0.5 px-3 py-3 sm:px-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={money ? "truncate text-base font-semibold text-stars tabular-nums sm:text-xl" : "truncate text-base font-semibold tabular-nums sm:text-xl"}>
        {value}
      </dd>
      <dd className="truncate text-xs text-muted-foreground">{note}</dd>
    </div>
  );
}
