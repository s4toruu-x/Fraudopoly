import type { ReactNode } from "react";
import { CURRENCY, RARITIES } from "@/game/content";
import { formatChance, formatMoney } from "@/game/format";
import type { Rules } from "@/game/state";
import { HREF } from "@/lib/route";
import { Stars } from "./Rarity";

export function HowItWorks({ rules }: { rules: Rules }) {
  return (
    <section aria-labelledby="how-title" className="flex max-w-2xl flex-col gap-6">
      <h2 id="how-title" className="text-xl font-semibold">
        How it works
      </h2>

      <Part title="Pulling">
        <p>
          You get {rules.pullsPerHour} pulls every hour, one at a time. They refill at the start of each
          hour, on the server's clock (UTC), and unused pulls don't carry over. Each pull shows you one
          name, and the server decides which.
        </p>
      </Part>

      {rules.claimsPerHour > 0 && (
        <Part title="Claiming">
          <p>
            A pull gives you nothing by itself. You can claim it for {rules.claimSeconds} seconds after
            the pull, and then it's gone. Claiming a name you don't have adds it to your collection;
            claiming one you have pays {CURRENCY.name}. You get {rules.claimsPerHour}{" "}
            {rules.claimsPerHour === 1 ? "claim" : "claims"} an hour, refilled with the pulls. The hour's
            pulls stay lined up under the pull button, each with its seconds left, so you can pull a few
            and claim the one you want most.
          </p>
        </Part>
      )}

      <Part title="Rarity">
        <p>Every name has a rarity. A pull lands on:</p>
        <ul className="flex flex-col gap-1">
          {RARITIES.map((rarity, i) => (
            <li key={rarity.name} className="flex gap-2">
              <Stars rarity={i} />
              <span>
                {rarity.name}, {formatChance(rules.chances[i])}
              </span>
            </li>
          ))}
        </ul>
        <p>
          Then on any name of that rarity, all equally likely. Nothing is guaranteed: every pull is just
          the odds.
        </p>
      </Part>

      <Part title={CURRENCY.name}>
        <p>
          You have one of each name. {rules.claimsPerHour > 0 ? "Claiming" : "Pulling"} a name you already
          have gives {CURRENCY.name} instead:{" "}
          {RARITIES.map((rarity, i) => `${formatMoney(rules.duplicateRewards[i])} for ${rarity.name}`).join(", ")}.
          You can also sell a fraud you own for its price, from its details; it leaves your
          collection, so pulling it again counts as new.
        </p>
      </Part>

      <Part title="Encyclopedia">
        <p>
          <a href={HREF.encyclopedia} className="underline underline-offset-2">
            The encyclopedia
          </a>{" "}
          lists every name in the game, with its category (what it is and where it's from, like the
          Discord server) and its price in {CURRENCY.name}. Names you don't have yet are grayed out.
        </p>
      </Part>

      {rules.wishlistLimit > 0 && (
        <Part title="Wishlist">
          <p>
            Open a name you don't have and add it to your wishlist, up to {rules.wishlistLimit} names.
            Wished names get a ♥, so you can spot them in your pulls. A name leaves the list once
            you get it. Other players can see your wishlist on your profile.
          </p>
        </Part>
      )}

      <Part title="Latest pulls and claims">
        <p>
          The pull panel shows only what you can still claim, and what you claimed. Under it, Your
          latest pulls lists everything you pulled and whether you claimed it, and Latest claims shows
          what every player claimed.
        </p>
      </Part>

      <Part title="Leaderboard">
        <p>
          <a href={HREF.leaderboard} className="underline underline-offset-2">
            The leaderboard
          </a>{" "}
          ranks players with an account two ways: by what their collection is worth (the prices of
          all their frauds added up), and by how many {CURRENCY.name} they hold. Tap a player to see
          their profile and encyclopedia.
        </p>
      </Part>

      <Part title="Trading">
        <p>
          Trading needs an account. On{" "}
          <a href={HREF.trades} className="underline underline-offset-2">
            Trades
          </a>
          , find a player by username, then pick names to give and names to get. You can only get names
          you don't have, and the names you give leave your collection. One side can be empty, for a
          gift. The other player accepts or declines. A trade fails if either of you no longer has a name
          you're giving, or already has one you'd get.
        </p>
      </Part>

      <Part title="Guests and accounts">
        <p>
          You start as a guest, and your names are kept on the server for this browser. Create an{" "}
          <a href={HREF.account} className="underline underline-offset-2">
            account
          </a>{" "}
          to keep them, play on other devices and trade; your guest names move into it. Signing in to an
          account you already have leaves the guest's names behind.
        </p>
      </Part>
    </section>
  );
}

function Part({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold">{title}</h3>
      <div className="flex flex-col gap-2 text-muted-foreground">{children}</div>
    </div>
  );
}
