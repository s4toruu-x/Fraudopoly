import { useState } from "react";
import { formatCategory, formatMoney } from "@/game/format";
import type { Entry, Rules } from "@/game/state";
import { NameCard } from "./NameCard";
import { NameDetails } from "./NameDetails";

type Show = "all" | "owned" | "missing";

const SHOWS: { id: Show; label: string }[] = [
  { id: "all", label: "All" },
  { id: "owned", label: "Owned" },
  { id: "missing", label: "Missing" },
];

const ALL_CATEGORIES = "";

export function Encyclopedia({ entries, rules }: { entries: Entry[]; rules: Rules }) {
  const [show, setShow] = useState<Show>("all");
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [query, setQuery] = useState("");
  // By position, so the details follow the name when the list changes
  const [opened, setOpened] = useState<number | null>(null);
  const details = entries.find((entry) => entry.position === opened);

  const categories = [...new Set(entries.map((entry) => formatCategory(entry.category)))];
  const search = query.trim().toLowerCase();
  const visible = [...entries]
    // Priciest first, then rarest
    .sort((a, b) => (b.price ?? 0) - (a.price ?? 0) || b.rarity - a.rarity || a.position - b.position)
    .filter(
      (entry) =>
        (show === "all" || (show === "owned") === entry.count > 0) &&
        (category === ALL_CATEGORIES || formatCategory(entry.category) === category) &&
        (search === "" ||
          entry.name.toLowerCase().includes(search) ||
          formatCategory(entry.category).toLowerCase().includes(search)),
    );
  const found = entries.filter((entry) => entry.count > 0).length;

  return (
    <section aria-labelledby="encyclopedia-title" className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="encyclopedia-title" className="text-xl font-semibold">
          Encyclopedia
        </h2>
        <p className="text-sm text-muted-foreground">
          {found} of {entries.length} collected
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Show" className="segmented">
          {SHOWS.map(({ id, label }) => (
            <button key={id} type="button" aria-pressed={show === id} onClick={() => setShow(id)}>
              {label}
            </button>
          ))}
        </div>
        {categories.length > 1 && (
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="Category"
            className="search"
          >
            <option value={ALL_CATEGORIES}>All categories</option>
            {categories.map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
        )}
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search names"
          aria-label="Search names"
          className="search w-full sm:ml-auto sm:w-56"
        />
      </div>

      {visible.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          {search ? "No matches." : show === "missing" ? "You have every name." : "No names yet."}
        </p>
      ) : (
        <ul className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-5 md:grid-cols-6">
          {visible.map((entry) => (
            <li key={entry.position} className="min-w-0">
              <button
                type="button"
                onClick={() => setOpened(entry.position)}
                className="card-button flex w-full min-w-0 flex-col gap-1.5 text-left"
              >
                <NameCard name={entry.name} rarity={entry.rarity} owned={entry.count > 0} />
                <span className="flex min-w-0 flex-col">
                  <span className={entry.count > 0 ? "truncate text-sm" : "truncate text-sm text-muted-foreground"}>
                    {entry.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {entry.category.name ?? entry.category.type}
                  </span>
                  {entry.price !== null && (
                    <span className="truncate text-xs text-muted-foreground tabular-nums">
                      {formatMoney(entry.price)}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
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
