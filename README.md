# Fraudopoly

A gacha game where you pull and collect names: members of a Discord server,
plus a list of random names. 10 pulls per hour, one at a time. Pulling a name
you already have pays Fraudbucks, and players with an account can trade names
with each other.

The game runs on the server. Every pull, the hourly limit, the Fraudbucks and
every trade are decided by functions in the Supabase database, so players can't
change the rules or their collection from the browser. The browser only shows
what the server sends.

## Run it

The project uses Yarn 1.22.22 (pinned in `package.json`):

```bash
yarn install
yarn dev
```

Then open http://localhost:5174. It needs the
server set up first (below); without it the page says what's missing.

## Server setup

Everything happens in one Supabase project. 640K's works too: Fraudopoly's
tables and functions have their own names.

1. **Settings.** Copy `.env.example` to `.env.local` and fill in the project URL
   and anon (publishable) key from **Project Settings > API**. The key is meant
   to be public; the database only lets players call the game's functions.
2. **Database.** In **SQL Editor**, run the files in `supabase/migrations/`,
   oldest first, then `supabase/seed.sql` (the names):
   - `20261025120000_fraudopoly.sql`: the game.
   - `20261026120000_latest_pulls.sql`: the history behind "Latest pulls".
     Until it's run, that list stays empty.
   - `20261027120000_fraudbucks.sql`: Fraudbucks, and takes pity out. Until
     it's run, duplicates pay nothing and pity still applies.
   - `20261028120000_one_of_each.sql`: one of each name, and trades that only
     bring new names. Extra copies players already have are paid out in
     Fraudbucks and removed.
   - `20261029120000_feed.sql`: "Latest pulls" from every player.
   - `20261030120000_full_names.sql`: shows every name in full, including
     the ones a player doesn't have yet. Until it's run they show as `M••••`.
     It also brings in everything the feed migration does, so running it
     without that one works too.
   - `20261031120000_categories_and_prices.sql`: gives every name a category
     and a price. It needs the full-names one first and says so if it's
     missing. Run `supabase/seed.sql` again after it, so each name gets the
     category and price from `names.ts`.
   - `20261101120000_claims_and_leaderboard.sql`: claims (a pull no longer
     adds a name by itself) and the leaderboard. Until it's run, pulls keep
     adding new names straight away and the leaderboard page says its
     function is missing.
   - `20261102120000_claim_duplicates.sql`: duplicates are claims too (a pull
     pays nothing by itself), and the state sends the hour's pulls for the
     pull panel to show.
   - `20261103120000_feed_split.sql`: "Latest pulls" in two, your own pulls
     and everyone's claims.
   - `20261104120000_leaderboards_and_profiles.sql`: a Fraudbucks leaderboard
     next to the collection one, and player profiles. Until it's run, only
     the collection leaderboard shows and profiles say their function is
     missing.
   - `20261105120000_wishlist.sql`: wishlists. Until it's run, the wishlist
     button and filter don't show.
   - `20261106120000_net_worth.sql`: the Fraudbucks leaderboard ranks by net
     worth (Fraudbucks plus what your frauds are worth) instead of the
     balance. Until it's run, it ranks by the balance.
   - `20261107120000_sell.sql`: selling a fraud for its price. Until it's run,
     the Sell button says its function is missing.
3. **Guests.** Under **Authentication > Sign In / Providers**, turn on **Allow
   anonymous sign-ins**. Every visitor without an account plays as an
   anonymous user.
4. **Accounts.** On the same page, under **Email**, keep Email on and turn
   **Confirm email** off. Usernames become hidden addresses that can't
   receive mail, so with it on every sign-up is refused.
5. Restart `yarn dev`.

Builds (`yarn build`, and Cloudflare's) read the settings from
`.env.production`, which is committed so Cloudflare has them. That's safe
because the publishable key is public by design: it ships in the site's code.
Never put a secret or `service_role` key in it. The build stops if the
settings are missing.

## Deploy to Cloudflare

The game is a static site, served by Cloudflare Workers (`wrangler.jsonc`).

```bash
npx wrangler login
```

```bash
yarn deploy
```

`yarn deploy` builds into `dist/` and uploads it as the `fraudopoly`
Worker. The first deploy prints its address
(`https://fraudopoly.<your-subdomain>.workers.dev`). To use your own domain,
add it under the Worker's **Settings > Domains & Routes** in the Cloudflare
dashboard. Nothing in Supabase needs to change: accounts use passwords, with
no emails or redirect links.

`yarn preview` builds and serves the site locally the way Cloudflare will,
at http://localhost:8787.

The build also writes `dist/_headers`, which Cloudflare sends with every page:
a content security policy that only lets the page call its own Supabase
project (taken from `VITE_SUPABASE_URL`) and run its own scripts, plus the
usual hardening headers, and long caching for the hashed files in
`/assets`. It's made by the `productionHeaders` plugin in `vite.config.ts`, so
it follows the settings when they change.

## Adding names

The names live in `src/game/names.ts`, in groups. Every name in a group has
the group's category: a type (Discord, Random, Anime, Game, anything) and, if
it has one, the name of where it's from, like the server or the series.

- `DISCORD`: people from the server. Starts empty.
- `RANDOM`: 50 made-up names that fill out the pool.

```ts
const DISCORD: NameGroup = {
  category: { type: "Discord", name: "The Server" },
  names: [
    "someone",
    "someone else",
    { name: "the server owner", rarity: "Legendary" },
  ],
};
```

Characters from a series get a group of their own, added to `NAME_GROUPS` at
the bottom of the file:

```ts
const SOME_SERIES: NameGroup = {
  category: { type: "Anime", name: "Some Series" },
  names: ["The Hero", { name: "The Rival", rarity: "Legendary", price: 5000 }],
};

export const NAME_GROUPS: NameGroup[] = [DISCORD, SOME_SERIES, RANDOM];
```

After changing it, run `yarn seed`, then run the new `supabase/seed.sql` in
the SQL Editor. The game picks the names up on the next page load.

Each name gets a rarity from its spelling: about half Common, 30% Rare, 15%
Epic and 5% Legendary. Each also gets its own price in Fraudbucks, picked at
random from its spelling (so it stays the same every seed) inside its rarity's
range: Common F$50–145, Rare F$150–445, Epic F$450–1,495, Legendary
F$1,500–5,000, in steps of 5 (`PRICE_RANGES` in `src/game/catalog.ts`). The
ranges don't overlap, so a rarer name is always worth more than a commoner
one. Write a name as `{ name, rarity }`, `{ name, price }` or both to pick
them yourself; a price outside its rarity's range stops the seed. Names are
matched ignoring case, and a name in two groups counts once, in the first. The
order of the groups is the encyclopedia's order within each rarity. A name
taken out of the list leaves the game and every collection.

## How it works

- **10 pulls an hour**, one at a time. Pulls refill at minute 00 of every hour
  on the server's clock (UTC), so in time zones half an hour off UTC it's at
  minute 30. Unused pulls don't carry over.
- **1 claim an hour, 30 seconds to use it.** A pull only shows a name. It can
  be claimed for 30 seconds after the pull (`claim`): a name you don't have is
  added, and one you have pays its Fraudbucks. Each player has 1 claim per
  hour, refilled with the pulls, so they pick the one they want most. The
  pull panel lines up the hour's pulls (`hour_pulls`), newest first, each with
  its claim button and seconds left, or what became of it (claimed, not
  claimed, no claim left). The server checks the pull is the player's, still
  in time, not claimed, and that the hour's claim is left. The numbers are in
  `claims_per_hour()` and `claim_seconds()` in the claims migration.
- **Rarities** show as stars: Common ★★ 60%, Rare ★★★ 28%, Epic ★★★★ 10%,
  Legendary ★★★★★ 2%, then any name of that rarity. A rarity with no names is
  skipped and its chance shared out. Nothing is guaranteed: every pull is just
  the odds. "Rates" in the pull panel shows them. The numbers are in
  `pulls_per_hour()` and `rarity_chances()` in the first migration.
- **One of each name.** A player either has a name or doesn't; there are no
  copies.
- **Fraudbucks (F$)**, the game's money. Claiming a name you already have
  doesn't add a copy: it pays F$10, F$25, F$60 or F$200 by rarity instead. A
  new name pays nothing. The balance shows in the header, and the payouts are
  in `duplicate_rewards()` in the Fraudbucks migration. Only the server
  changes it. A fraud you own can be sold for its price from its details
  (`sell`, with a second click to confirm); it leaves the collection, so it
  counts as new when pulled again.
- **Latest pulls and claims.** Under the pull panel, two lists (`get_feed`):
  "Your latest pulls", the player's own 20 newest pulls with whether each
  was claimed and what a duplicate paid, and "Latest claims", the 20 newest
  claims from every player, with who claimed what (or "A guest"). The pull
  panel itself only shows the pulls that can still be claimed and the one
  that was; the rest are in "Your latest pulls". The lists check for new ones
  every 20 seconds. The
  server keeps each player's last 50 pulls in `pull_log`, and a guest's
  history comes along into a new account.
- **Encyclopedia.** Every name as a card, priciest first (so rarest first
  too), with where it's from and its price. Names you don't have yet show in
  full, on a gray card.
  Search looks through names and categories, and once there's more than one
  category, a menu shows one at a time.
- **Details.** Clicking a card (in the encyclopedia, the latest pulls, or the
  one just pulled) opens it in a pop-up: a big card, its rarity, type, where
  it's from, price, what a duplicate pays, its chance per pull, and since when
  you've had it. Esc, Close or a click outside closes it.
- **Categories and prices.** Each name has a category (a type, and the name of
  where it's from when there is one), shown with the name everywhere, and a
  price in Fraudbucks. Both come from `names.ts` through the seed. The price
  is only shown for now; nothing buys or sells at it yet.
- **Trades.** A player with an account finds another by username, picks names
  from their own collection and from the other's, and sends the offer. Each
  side can only get names they don't have, so the picker leaves out names the
  other side already owns, and a name you give leaves your collection. One
  side can be empty, for a gift or a request. The other player accepts or
  declines; accepting swaps the names in one go, and fails without changing
  anything if either side no longer has a name they give, or has since got
  one they'd receive. The server checks this when the offer is made and again
  when it's accepted (`trade_problem`). Senders can cancel while it's
  pending. The Trades page checks for new offers every 15 seconds.
- **Guests and accounts.** A visitor plays as a guest straight away, with
  their names on the server. Creating an account brings the guest's names
  along (a one-time code from `start_guest_transfer`, claimed by the brand new
  account with `claim_guest`). Signing in to an existing account leaves the
  guest's names behind. Signing out starts a new guest.
- **Accounts** sign in with a username and password. Each username becomes a
  hidden address like `diogo@players.fraudopoly.invalid`, which the server
  reads the username back from. There's no email, so a forgotten password can
  only be reset by you, under **Authentication > Users**.
- **Leaderboards.** Two, switched at the top of the page (`get_leaderboard`):
  **Collection**, the 20 players whose frauds are worth the most (the sum of
  their prices), with how many frauds they have, and **Fraudbucks**, the 20
  with the highest net worth: the Fraudbucks they hold plus what their frauds
  are worth, with the balance shown beside it. Your own place shows under the 20 when you aren't
  in it. Only players with an account are ranked, and nobody at zero.
  The page checks again every 30 seconds.
- **Wishlist.** Up to 5 names you don't have (`wishlist_limit()` in the
  wishlist migration), added and removed from a name's details (`set_wish`).
  Wished names get a ♥ on their card, in the encyclopedia and in the hour's
  pulls, and the encyclopedia has a Wishlist filter. A name leaves the list
  once you get it, by claim or trade, and a guest's list moves into a new
  account. Profiles show other players' wishlists.
- **Profiles.** A player's name on the leaderboard opens their profile
  (`#/player/<username>`, `get_profile`): their ranks, frauds, worth and
  Fraudbucks, and their encyclopedia, with what they own in color.
- **Pages.** Pull (`#/`), Encyclopedia (`#/encyclopedia`), Trades (`#/trades`),
  Leaderboard (`#/leaderboard`), profiles (`#/player/<username>`), Account
  (`#/account`) and How it works (`#/how-it-works`, linked from the
  pull panel and the footer), which explains the rules to players with the
  server's own numbers. The page is in the address's `#`, so it works on any
  static host and the back button moves between pages.

### What the server stops, and what it doesn't

Players can only call the game's functions; the tables have row level
security on with no policies, and the helper functions can't be called
directly. So nobody can give themselves names, skip the hourly limits, claim
late or take
names in a trade that wasn't accepted. What it can't stop is one person using
several accounts or guests, which is true of any game with free accounts and
trading. Supabase's rate limits on sign-ups and anonymous sign-ins slow that
down; a captcha (Supabase supports one) would slow it more.

### Testing the database

The database code was tested on PGlite, a Postgres that runs in Node, with
stand-ins for Supabase's auth: pulls, the hourly limit, a new hour refilling,
the odds over 4,000 pulls, Fraudbucks for duplicates, guests moving into
accounts, offers, accepts, declines, cancels, trades that fail, the feed, and
that players can't reach the tables or helpers.

## Stack

- React 19, Vite 7, TypeScript
- Supabase (`@supabase/supabase-js`): Postgres functions for the game, auth for
  guests and accounts
- Tailwind CSS v4 for layout, with shadcn/ui's button (`src/components/ui`)
- Inter (`@fontsource/inter`) for text
- Cloudflare Workers static assets, deployed with Wrangler

## Look

Simple on purpose: one column, in light (white and gray, black buttons) or
dark (near-black, white buttons). The header has the name, the player's
Fraudbucks, the theme and the account on one row and the pages under it. On a
phone it's a single row with the name, the Fraudbucks and a button showing
the page you're on, which drops down a menu with the pages, the account and
the theme (`.menu`), fading in and out. The latest pulls and claims lists keep a set height and
scroll inside. It follows the system's setting until the
player picks Light or Dark; `src/lib/theme.ts` keeps the choice,
and a small script in `index.html` applies it before the page draws. Cards are
flat in their rarity's color (gray, blue, purple, amber). The only motion is a
card turning over when it's pulled, and the details pop-up rising in and
fading (0.2s) and dropping away when it closes (0.14s; `NameDetails` waits for
it before closing). Both are off for players whose system asks for reduced
motion. Every color is a token in `:root`
(light) and `.dark` in `src/index.css`, so changing one place changes the
whole theme. The few surfaces are the classes in its `@layer components`.

## Files

- `supabase/migrations/20261025120000_fraudopoly.sql`: the game. Tables,
  rules, and the functions players call: `get_state`, `pull`,
  `start_guest_transfer`, `claim_guest`, `find_player`, `create_trade`,
  `respond_trade`, `cancel_trade` and `get_trades`.
- `supabase/migrations/20261026120000_latest_pulls.sql`: the pull history, and
  new versions of `pull`, `get_state` and `claim_guest` that use it.
- `supabase/migrations/20261027120000_fraudbucks.sql`: the Fraudbucks balance
  and payouts, and new versions of `pull`, `rules`, `player_json`,
  `latest_pulls` and `claim_guest` without pity.
- `supabase/migrations/20261028120000_one_of_each.sql`: one of each name, and
  new versions of `pull`, `create_trade` and `respond_trade`, which check
  trades with `trade_problem`.
- `supabase/migrations/20261029120000_feed.sql`: `get_feed`, the latest pulls
  from every player.
- `supabase/migrations/20261030120000_full_names.sql`: new versions of
  `get_state` and `get_feed` that send every name in full.
- `supabase/migrations/20261031120000_categories_and_prices.sql`: the
  category and price columns in place of source, and a new `card_json` that
  sends them.
- `supabase/migrations/20261101120000_claims_and_leaderboard.sql`: `claim`,
  `get_leaderboard`, and new versions of `pull`, `get_state` (with the pulls
  still claimable), `get_feed`, `rules` and `player_json`.
- `supabase/migrations/20261102120000_claim_duplicates.sql`: `hour_pulls`,
  and new versions of `pull`, `claim` and `get_state` with duplicates as
  claims.
- `supabase/seed.sql`: the names, made by `yarn seed` (`scripts/seed.ts`)
  from `src/game/names.ts` and `src/game/catalog.ts` (default rarities and
  prices).
- `src/game` has the browser's side, with no React: `store.ts` (the copy of
  the game from the server, pulling and claiming), `trades.ts`,
  `leaderboard.ts`, `account.ts` (guests,
  sign in, sign up), `state.ts` (the server's data as types), `errors.ts`,
  `content.ts` (rarity names, and what a category is), `odds.ts` (the chances
  shown in Rates and the details) and `format.ts`.
- `src/screen` has the UI: `Header`, `PullPanel` (the button, the card just
  pulled, claiming and the rates), `LatestPulls` (everyone's pulls),
  `Encyclopedia`, `Trades`, `Leaderboard`, `Profile`, `AboutDev`, `AccountPage`, `HowItWorks`, `NameCard`, `NameDetails` (the
  pop-up a card opens), `Rarity` (stars and the
  "New" label) and `Footer`.
- `src/lib` has `route.ts` (which page is showing), `supabase.ts`, `theme.ts`
  and `useNow.ts` (a clock for the countdown).
