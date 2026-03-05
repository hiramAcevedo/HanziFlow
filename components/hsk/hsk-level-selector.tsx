"use client";

import type { HskLevelSummary } from "@/lib/types";

interface HskLevelSelectorProps {
  levels: HskLevelSummary[];
  selectedVersion: string;
  selectedLevel: number;
  onSelect: (version: string, level: number) => void;
}

export function HskLevelSelector({
  levels,
  selectedVersion,
  selectedLevel,
  onSelect,
}: HskLevelSelectorProps) {
  const versions = [...new Set(levels.map((l) => l.version))].sort();
  const levelsForVersion = levels
    .filter((l) => l.version === selectedVersion)
    .sort((a, b) => a.level - b.level);

  return (
    <div className="flex flex-col gap-3">
      {/* Version tabs */}
      <div className="flex gap-2">
        {versions.map((v) => (
          <button
            key={v}
            onClick={() => {
              const first = levels.find((l) => l.version === v);
              if (first) onSelect(v, first.level);
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedVersion === v
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            HSK {v}
          </button>
        ))}
      </div>

      {/* Level buttons */}
      <div className="flex flex-wrap gap-1.5">
        {levelsForVersion.map((l) => {
          const pct = l.total > 0 ? Math.round((l.studied / l.total) * 100) : 0;
          return (
            <button
              key={l.level}
              onClick={() => onSelect(selectedVersion, l.level)}
              className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors min-w-[2.5rem] ${
                selectedLevel === l.level
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
              title={`${l.total} palabras · ${l.studied} estudiadas (${pct}%)`}
            >
              {l.level}
              {pct > 0 && selectedLevel !== l.level && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
