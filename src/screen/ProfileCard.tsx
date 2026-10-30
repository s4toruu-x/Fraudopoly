import { useEffect, useRef, useState, type ReactNode } from "react";
import { CURRENCY, RARITIES } from "@/game/content";
import { formatMoney } from "@/game/format";
import { fetchProfile, type Profile } from "@/game/leaderboard";
import type { Entry } from "@/game/state";
import { useGame } from "@/game/store";
import { drawProfileCard, type CardData } from "@/lib/profileImage";
import { HREF, profileHref } from "@/lib/route";
import { cn } from "@/lib/utils";
import { NameCard } from "./NameCard";
import { Stars } from "./Rarity";

/** Upper bound on waiting for the 0.14s closing animation */
const CLOSE_FALLBACK_MS = 400;

/** The signed-in player's card in a pop-up, to look at and share */
export function ProfileCardDialog({ username, onClose }: { username: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closing = useRef(false);
  const game = useGame();
  // Undefined while loading
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // React's development double run would open it twice
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);

  useEffect(() => {
    let current = true;
    void fetchProfile(username).then((answer) => {
      if (!current) return;
      if ("error" in answer) setError(answer.error);
      else setProfile(answer.data);
    });
    return () => {
      current = false;
    };
  }, [username]);

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
      aria-label="Your profile card"
      className="details profile-dialog"
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => event.target === dialog.current && close()}
    >
      <button type="button" aria-label="Close" autoFocus onClick={close} className="details-close">
        <svg aria-hidden viewBox="0 0 16 16" className="size-4">
          <path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
      {profile ? (
        <ProfileCard profile={profile} entries={game.entries} owned={game.entries} favorite={game.favorite} />
      ) : (
        <p role={error ? "alert" : undefined} className={cn("p-6", error ? "text-danger" : "text-muted-foreground")}>
          {error ?? (profile === null ? "Your profile isn't on the server yet." : "Loading…")}
        </p>
      )}
    </dialog>
  );
}

/**
 * A player's card: their favorite fraud big, their numbers, and how many they have of each
 * rarity, with a link to share and a picture to save.
 */
export function ProfileCard({
  profile,
  entries,
  owned,
  favorite,
}: {
  profile: Profile;
  entries: Entry[];
  /** Their collection, on this player's copy of every name */
  owned: Entry[];
  favorite: number | null;
}) {
  const fav = favorite === null ? null : (owned.find((entry) => entry.position === favorite && entry.count > 0) ?? null);
  const byRarity = RARITIES.map((_, rarity) => owned.filter((entry) => entry.count > 0 && entry.rarity === rarity).length);
  const url = `${location.origin}${location.pathname}${profileHref(profile.username)}`;

  const data: CardData = {
    username: profile.username,
    favorite: fav && { name: fav.name, rarity: fav.rarity },
    frauds: profile.names,
    total: entries.length,
    worth: profile.value,
    netWorth: profile.netWorth,
    fraudbucks: profile.fraudbucks,
    collectionRank: profile.collectionRank,
    netWorthRank: profile.fraudbucksRank,
    byRarity,
    url,
  };

  return (
    <section aria-label="Profile card" className={cn("profile-card", `r-${fav?.rarity ?? 0}`, fav && "has-favorite")}>
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-stretch">
        <div className="pc-favorite flex w-32 shrink-0 flex-col gap-2 sm:w-40">
          <NameCard name={fav?.name ?? null} rarity={fav?.rarity ?? 0} owned={!!fav} className={cn(!fav && "[&_.stars]:hidden")} />
          <p className="truncate text-center text-xs text-muted-foreground">
            {fav ? (
              <>
                Favorite · <span className="font-semibold text-foreground">{fav.name}</span>
              </>
            ) : (
              "Pick a favorite from a fraud's details"
            )}
          </p>
        </div>

        <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
          <div className="pc-head flex flex-col text-center sm:text-left">
            <span className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Fraudopoly player
            </span>
            <h2 className="truncate text-3xl font-bold">{profile.username}</h2>
          </div>

          <dl className="pc-stats grid grid-cols-2 gap-2.5">
            <Stat label="Frauds" value={<CountUp to={profile.names} format={String} delay={220} />} note={`of ${entries.length}`} />
            <Stat label="Worth" value={<CountUp to={profile.value} delay={280} />} note={place(profile.collectionRank)} money />
            <Stat label="Net worth" value={<CountUp to={profile.netWorth} delay={340} />} note={place(profile.fraudbucksRank)} money />
            <Stat label={CURRENCY.name} value={<CountUp to={profile.fraudbucks} delay={400} />} note="In hand" money />
          </dl>

          <ul aria-label="By rarity" className="pc-chips flex flex-wrap justify-center gap-1.5 sm:justify-start">
            {[3, 2, 1, 0].map((rarity) => (
              <li key={rarity} className={cn("rarity-chip", `r-${rarity}`)}>
                <Stars rarity={rarity} />
                <span className="tabular-nums">{byRarity[rarity]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ShareBar data={data} />
    </section>
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

/** How long a number on the card takes to count up */
const COUNT_MS = 700;

/** A number that counts up from zero as the card plays in */
function CountUp({ to, delay, format = formatMoney }: { to: number; delay: number; format?: (value: number) => string }) {
  const [shown, setShown] = useState(() => (matchMedia("(prefers-reduced-motion: reduce)").matches ? to : 0));

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(to);
      return;
    }
    const start = performance.now() + delay;
    let frame = 0;
    const step = (now: number) => {
      const progress = Math.min(1, Math.max(0, (now - start) / COUNT_MS));
      setShown(Math.round(to * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [to, delay]);

  return <>{format(shown)}</>;
}

function Stat({ label, value, note, money = false }: { label: string; value: ReactNode; note: ReactNode; money?: boolean }) {
  return (
    <div className="profile-stat">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("truncate text-lg font-semibold tabular-nums sm:text-xl", money && "text-stars")}>{value}</dd>
      <dd className="truncate text-xs text-muted-foreground">{note}</dd>
    </div>
  );
}

/** Share the profile's link, or save the card as a picture */
function ShareBar({ data }: { data: CardData }) {
  const [said, setSaid] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const title = `${data.username} on Fraudopoly`;

  const flash = (text: string) => {
    setSaid(text);
    setTimeout(() => setSaid(null), 2200);
  };

  const shareLink = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, url: data.url });
        return;
      }
      await navigator.clipboard.writeText(data.url);
      flash("Link copied");
    } catch (error) {
      // Closing the share sheet isn't a failure
      if ((error as Error).name !== "AbortError") flash("Couldn't share the link");
    }
  };

  const saveImage = async () => {
    setBusy(true);
    try {
      const blob = await drawProfileCard(data);
      const file = new File([blob], `${data.username}-fraudopoly.png`, { type: "image/png" });
      // Phones get the share sheet with the picture; elsewhere it downloads
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title });
      } else {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = file.name;
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 10_000);
        flash("Picture saved");
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") flash("Couldn't make the picture");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pc-share flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
      {said && (
        <span role="status" className="share-said mr-auto text-sm text-muted-foreground">
          {said}
        </span>
      )}
      <button type="button" onClick={shareLink} className="share-button">
        <svg aria-hidden viewBox="0 0 16 16" className="size-4">
          <path d="M6.5 9.5l3-3M7 4.5l1-1a3 3 0 014.2 4.2l-1 1M9 11.5l-1 1a3 3 0 01-4.2-4.2l1-1" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        Share link
      </button>
      <button type="button" onClick={saveImage} disabled={busy} className="share-button primary">
        <svg aria-hidden viewBox="0 0 16 16" className="size-4">
          <path d="M8 2.5v7.5M4.8 7l3.2 3.2L11.2 7M3 13.5h10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {busy ? "Making…" : "Save image"}
      </button>
    </div>
  );
}
