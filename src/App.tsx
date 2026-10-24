import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useGame, type GameState } from "@/game/store";
import { HREF, useRoute } from "@/lib/route";
import { AccountPage } from "@/screen/AccountPage";
import { Encyclopedia } from "@/screen/Encyclopedia";
import { Footer } from "@/screen/Footer";
import { Header } from "@/screen/Header";
import { HowItWorks } from "@/screen/HowItWorks";
import { LatestPulls } from "@/screen/LatestPulls";
import { Leaderboard } from "@/screen/Leaderboard";
import { PullPanel } from "@/screen/PullPanel";
import { Trades } from "@/screen/Trades";

export default function App() {
  const game = useGame();
  const route = useRoute();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  const ready = game.status === "ready" && game.player && game.rules;

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-8 px-4 py-6 sm:py-8 md:py-12">
      <Header route={route} />
      <main className="flex flex-col gap-4">
        {route === "account" ? (
          <AccountPage />
        ) : !ready ? (
          <Status game={game} />
        ) : route === "encyclopedia" ? (
          <Encyclopedia entries={game.entries} rules={game.rules!} />
        ) : route === "trades" ? (
          <Trades entries={game.entries} />
        ) : route === "leaderboard" ? (
          <Leaderboard />
        ) : route === "how" ? (
          <HowItWorks rules={game.rules!} />
        ) : (
          <>
            <PullPanel player={game.player!} rules={game.rules!} entries={game.entries} pulls={game.pulls} />
            <a href={HREF.encyclopedia} className="self-end text-sm text-muted-foreground hover:text-foreground">
              {game.entries.filter((entry) => entry.count > 0).length} of {game.entries.length} collected ·
              Encyclopedia →
            </a>
            <LatestPulls myPulls={game.myPulls} claims={game.claims} entries={game.entries} rules={game.rules!} />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Status({ game }: { game: GameState }) {
  if (game.status === "off") {
    return (
      <p className="text-muted-foreground">
        Fraudopoly needs its server. Put the Supabase settings in .env.local and set up the database
        (see the README).
      </p>
    );
  }
  if (game.status === "error") {
    return (
      <div className="flex flex-col items-start gap-3">
        <p role="alert" className="text-danger">
          {game.error}
        </p>
        <Button variant="outline" onClick={() => location.reload()}>
          Try again
        </Button>
      </div>
    );
  }
  return <p className="text-muted-foreground">Loading…</p>;
}
