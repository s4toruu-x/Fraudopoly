import { useEffect, useState, type ReactNode } from "react";
import { RARITIES } from "@/game/content";
import { formatMoney } from "@/game/format";
import { fetchProfile, type Profile as ProfileData } from "@/game/leaderboard";
import type { Entry, Rules } from "@/game/state";
import { useGame } from "@/game/store";
import { HREF } from "@/lib/route";
import { cn } from "@/lib/utils";
import { Encyclopedia } from "./Encyclopedia";
import { NameCard } from "./NameCard";
import { NameDetails } from "./NameDetails";
import { ProfileCardDialog } from "./ProfileCard";
import { Stars } from "./Rarity";

/** How many of their priciest frauds the showcase shows */
const SHOWCASE_SIZE = 6;

/** A player's profile: who they are, their best frauds, and their encyclopedia. */
export function Profile({ username, entries, rules }: { username: string; entries: Entry[]; rules: Rules }) {
  // Undefined while loading, null when there's no such player
  const [profile, setProfile] = useState<ProfileData | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState<number | null>(null);
  const [showCard, setShowCard] = useState(false);
  const game = useGame();

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
  const owned = theirs.filter((entry) => entry.count > 0);
  const favoritePosition = profile.isMe ? game.favorite : profile.favorite;
  const favorite = owned.find((entry) => entry.position === favoritePosition) ?? null;
  const showcase = [...owned]
    .sort((a, b) => (b.price ?? 0) - (a.price ?? 0) || b.rarity - a.rarity)
    .slice(0, SHOWCASE_SIZE);
  const details = theirs.find((entry) => entry.position === opened);
  const progress = entries.length ? owned.length / entries.length : 0;

  return (
    <div className="flex flex-col gap-8">
      <section aria-label="Player" className="flex flex-col gap-3">
        <a href={HREF.leaderboard} className="back-link self-start">
          <svg aria-hidden viewBox="0 0 16 16" className="size-3.5">
            <path d="M10 3.5L5.5 8l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Leaderboard
        </a>

        <div className={cn("profile-hero", `r-${favorite?.rarity ?? 0}`, favorite && "has-favorite")}>
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-20 shrink-0 sm:w-24">
              <NameCard name={favorite?.name ?? null} rarity={favorite?.rarity ?? 0} owned={!!favorite} className={cn(!favorite && "[&_.stars]:hidden")} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <h2 className="truncate text-2xl font-bold sm:text-3xl">
                {profile.username}
                {profile.isMe && <span className="text-base font-normal text-muted-foreground"> (you)</span>}
              </h2>
              <p className="truncate text-sm text-muted-foreground">
                {favorite ? (
                  <>
                    Favorite · <span className="font-semibold text-foreground">{favorite.name}</span>
                  </>
                ) : profile.isMe ? (
                  "No favorite yet. Pick one from a fraud's details."
                ) : (
                  "No favorite yet"
                )}
              </p>
              <ul aria-label="By rarity" className="mt-1 flex flex-wrap gap-1.5">
                {[3, 2, 1, 0].map((rarity) => (
                  <li key={rarity} className={cn("rarity-chip", `r-${rarity}`)} title={RARITIES[rarity].name}>
                    <Stars rarity={rarity} />
                    <span className="tabular-nums">{owned.filter((entry) => entry.rarity === rarity).length}</span>
                  </li>
                ))}
              </ul>
            </div>
            {profile.isMe && (
              <button type="button" onClick={() => setShowCard(true)} className="share-button hidden shrink-0 self-start sm:inline-flex">
                <ShareIcon />
                Share card
              </button>
            )}
          </div>
          {profile.isMe && (
            <button type="button" onClick={() => setShowCard(true)} className="share-button justify-center sm:hidden">
              <ShareIcon />
              Share card
            </button>
          )}
        </div>

        <dl className="grid grid-cols-3 gap-2 sm:gap-2.5">
          <Stat label="Frauds" value={`${owned.length}`} note={`of ${entries.length}`}>
            <div className="progress" aria-hidden>
              <span style={{ width: `${progress * 100}%` }} />
            </div>
          </Stat>
          <Stat label="Worth" value={formatMoney(profile.value)} note={rank(profile.collectionRank)} money />
          <Stat label="Net worth" value={formatMoney(profile.netWorth)} note={rank(profile.fraudbucksRank)} money />
        </dl>
      </section>

      {showcase.length > 0 && (
        <section aria-labelledby="showcase-title" className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-2">
            <h3 id="showcase-title" className="text-lg font-semibold">
              Showcase
            </h3>
            <p className="text-sm text-muted-foreground">Priciest frauds</p>
          </div>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {showcase.map((entry) => (
              <li key={entry.position} className="min-w-0">
                <button
                  type="button"
                  onClick={() => setOpened(entry.position)}
                  className="card-button flex w-full min-w-0 flex-col gap-1.5 text-left"
                >
                  <NameCard name={entry.name} rarity={entry.rarity} />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm">{entry.name}</span>
                    {entry.price !== null && (
                      <span className="truncate text-xs text-stars tabular-nums">{formatMoney(entry.price)}</span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Encyclopedia
        key={profile.username}
        entries={theirs}
        rules={rules}
        title="Collection"
        owner={profile.isMe ? undefined : profile.username}
      />

      {details && (
        <NameDetails
          key={details.position}
          entry={details}
          rules={rules}
          entries={theirs}
          owner={profile.isMe ? undefined : profile.username}
          onClose={() => setOpened(null)}
        />
      )}
      {showCard && <ProfileCardDialog username={profile.username} onClose={() => setShowCard(false)} />}
    </div>
  );
}

/** A place on a leaderboard */
export function rank(place: number | null) {
  return place ? `Rank #${place}` : "Not ranked";
}

export function Stat({
  label,
  value,
  note,
  money = false,
  children,
}: {
  label: string;
  value: string;
  note: string;
  money?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="profile-stat gap-1!">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 flex-col sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
        <span className={cn("truncate text-base font-semibold tabular-nums sm:text-xl", money && "text-stars")}>
          {value}
        </span>
        <span className="truncate text-xs text-muted-foreground sm:shrink-0">{note}</span>
      </dd>
      {children && <dd>{children}</dd>}
    </div>
  );
}

export function ShareIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="size-4">
      <path d="M8 10V2.5M5 5.3L8 2.3l3 3M3.5 8.5v4a1 1 0 001 1h7a1 1 0 001-1v-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
