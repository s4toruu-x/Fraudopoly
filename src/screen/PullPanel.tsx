import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CURRENCY, RARITIES } from "@/game/content";
import { formatChance, formatClock, formatCountdown, formatMoney } from "@/game/format";
import { rarityChances, raritySizes } from "@/game/odds";
import type { Entry, HourPull, Player, Rules } from "@/game/state";
import { actions } from "@/game/store";
import { HREF } from "@/lib/route";
import { useNow } from "@/lib/useNow";
import { cn } from "@/lib/utils";
import { NameCard } from "./NameCard";
import { NameDetails } from "./NameDetails";
import { Stars } from "./Rarity";

interface Props {
  player: Player;
  rules: Rules;
  entries: Entry[];
  pulls: HourPull[];
}

export function PullPanel({ player, rules, entries, pulls }: Props) {
  const [showRates, setShowRates] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState<number | null>(null);
  const now = useNow();
  // Past the refill time the server has refilled, even if this copy hasn't heard yet
  const refilled = now >= player.nextRefill;
  const left = refilled ? rules.pullsPerHour : player.pullsLeft;
  const claimsLeft = refilled ? rules.claimsPerHour : player.claimsLeft;
  // Older servers have no claims
  const claims = rules.claimsPerHour > 0;
  const details = entries.find((entry) => entry.position === opened);
  const waiting = pulls.filter((pull) => canClaim(pull, now, claimsLeft)).length;
  // Pulls that can't be claimed any more are only in Your latest pulls
  const shown = claims ? pulls.filter((pull) => pull.claimed || canClaim(pull, now, claimsLeft)) : pulls;

  const pull = async () => {
    setPulling(true);
    setError(null);
    const refused = await actions.pull();
    setPulling(false);
    if (refused) setError(refused.error);
  };

  const claim = async (pullId: number) => {
    setClaiming(pullId);
    setError(null);
    const refused = await actions.claim(pullId);
    setClaiming(null);
    if (refused) setError(refused.error);
  };

  return (
    <section aria-label="Pull" className="panel flex flex-col gap-5 p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">
            {waiting > 0 ? `Pick one to claim · ${waiting} waiting` : shown.length > 0 ? "Claimed this hour" : "Pull a name"}
          </h2>
          <p className="text-sm text-muted-foreground tabular-nums">
            {left > 0 ? `${left} of ${rules.pullsPerHour} pulls left` : "No pulls left"}
            {claims && (claimsLeft > 0 ? ` · ${claimsLeft} ${claimsLeft === 1 ? "claim" : "claims"} left` : " · no claim left")}
            {left > 0 && (!claims || claimsLeft > 0)
              ? ` · refills at ${formatClock(player.nextRefill)}`
              : ` · refills in ${formatCountdown(player.nextRefill - now)}`}
          </p>
        </div>
        <Button size="lg" disabled={left < 1 || pulling} onClick={pull} className="w-full sm:w-44">
          {pulling ? "Pulling…" : "Pull"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="-mt-2 text-sm text-danger">
          {error}
        </p>
      )}

      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {claims
            ? `Pull as many as you like, then claim the one you want within ${rules.claimSeconds} seconds of pulling it. A name you already have pays ${CURRENCY.name} when claimed.`
            : "Names come from the Discord server and a list of random names."}
        </p>
      ) : (
        <ul aria-label="This hour's pulls" className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-5">
          {shown.map((pull) => {
            const entry = entries.find((other) => other.position === pull.position);
            if (!entry) return null;
            return (
              <PullItem
                key={pull.pullId}
                pull={pull}
                entry={entry}
                now={now}
                rules={rules}
                claimsLeft={claimsLeft}
                claiming={claiming}
                onClaim={() => claim(pull.pullId)}
                onOpen={() => setOpened(entry.position)}
              />
            );
          })}
        </ul>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
        <span>{claims ? `${rules.claimsPerHour} claim an hour.` : `Duplicates pay ${CURRENCY.name}.`}</span>
        <div className="flex items-center gap-1">
          <a href={HREF.how} className="btn btn-plain h-8 px-2 text-sm">
            How it works
          </a>
          <Button
            variant="plain"
            size="sm"
            aria-expanded={showRates}
            aria-controls="rates"
            onClick={() => setShowRates(!showRates)}
          >
            {showRates ? "Hide rates" : "Rates"}
          </Button>
        </div>
      </div>
      {showRates && <Rates rules={rules} entries={entries} />}
      {details && (
        <NameDetails
          key={details.position}
          entry={details}
          rules={rules}
          entries={entries}
          onClose={() => setOpened(null)}
        />
      )}
    </section>
  );
}

function canClaim(pull: HourPull, now: number, claimsLeft: number): boolean {
  return !pull.claimed && now < pull.claimUntil && claimsLeft > 0;
}

function PullItem({
  pull,
  entry,
  now,
  rules,
  claimsLeft,
  claiming,
  onClaim,
  onOpen,
}: {
  pull: HourPull;
  entry: Entry;
  now: number;
  rules: Rules;
  claimsLeft: number;
  claiming: number | null;
  onClaim: () => void;
  onOpen: () => void;
}) {
  const owned = entry.count > 0;
  const open = canClaim(pull, now, claimsLeft);
  const seconds = Math.max(0, Math.ceil((pull.claimUntil - now) / 1000));
  // Only a just-pulled card flips; ones loaded with the page are face up
  const [fresh] = useState(() => Date.now() < pull.claimUntil - (rules.claimSeconds - 2) * 1000);
  const card = <NameCard name={entry.name} rarity={entry.rarity} owned={owned || open} isNew={!owned} wished={entry.wished} />;

  return (
    <li className={cn("flex min-w-0 flex-col gap-1.5", !open && !pull.claimed && "opacity-55")}>
      <button type="button" aria-label={`${entry.name}, details`} onClick={onOpen} className="card-button block w-full">
        {fresh ? (
          <div className="flip">
            <div className="flip-inner">
              {card}
              <div aria-hidden className="card-back" />
            </div>
          </div>
        ) : (
          card
        )}
      </button>
      <p className="truncate text-sm">{entry.name}</p>
      {open ? (
        <Button size="sm" disabled={claiming !== null} onClick={onClaim} className="w-full tabular-nums">
          {claiming === pull.pullId ? "Claiming…" : owned ? `+${formatMoney(pull.reward)} · ${seconds}s` : `Claim · ${seconds}s`}
        </Button>
      ) : (
        <p className={cn("text-xs", pull.claimed ? "font-semibold" : "text-muted-foreground")}>
          {!rules.claimsPerHour
            ? pull.isNew
              ? "New"
              : `+${formatMoney(pull.reward)}`
            : pull.claimed
              ? pull.reward > 0
                ? `Claimed · +${formatMoney(pull.reward)}`
                : "Claimed"
              : now >= pull.claimUntil
                ? "Not claimed"
                : "No claim left"}
        </p>
      )}
    </li>
  );
}

function Rates({ rules, entries }: { rules: Rules; entries: Entry[] }) {
  const sizes = raritySizes(entries);
  const chances = rarityChances(rules, sizes);

  return (
    <div id="rates" className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        {rules.pullsPerHour} pulls per hour, refilled at minute 00. Unused pulls don't carry over.
        Every pull is just the odds, decided by the server.
        {rules.claimsPerHour > 0
          ? ` A pull is yours only if you claim it within ${rules.claimSeconds} seconds, with your ${rules.claimsPerHour} claim an hour. Claiming a name you already have pays ${CURRENCY.name}.`
          : ` A name you already have pays ${CURRENCY.name}.`}
      </p>
      <table className="rates-table">
        <thead>
          <tr>
            <th className="text-left">Rarity</th>
            <th className="text-right">Names</th>
            <th className="text-right">Chance</th>
            <th className="text-right">Each name</th>
            <th className="text-right">Duplicate</th>
          </tr>
        </thead>
        <tbody>
          {RARITIES.map((rarity, i) => (
            <tr key={rarity.name}>
              <td>
                <Stars rarity={i} /> <span className="ml-1 text-muted-foreground">{rarity.name}</span>
              </td>
              <td className="text-right tabular-nums">{sizes[i]}</td>
              <td className="text-right tabular-nums">{formatChance(chances[i])}</td>
              <td className="text-right tabular-nums">
                {sizes[i] > 0 ? formatChance(chances[i] / sizes[i]) : "–"}
              </td>
              <td className="text-right text-stars tabular-nums">+{formatMoney(rules.duplicateRewards[i])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
