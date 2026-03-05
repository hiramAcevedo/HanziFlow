"use client";

import type { HskVocab } from "@/lib/types";

interface HskVocabRowProps {
  vocab: HskVocab;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}

export function HskVocabRow({ vocab, index, isSelected, onClick }: HskVocabRowProps) {
  return (
    <button
      onClick={onClick}
      data-index={index}
      className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
        isSelected
          ? "bg-accent text-accent-foreground ring-1 ring-ring"
          : "hover:bg-muted"
      }`}
    >
      {/* Row number + seen indicator */}
      <span className="w-8 text-right text-xs text-muted-foreground font-mono shrink-0 flex items-center justify-end gap-1">
        {vocab.study_count > 0 && (
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
        )}
        {index + 1}
      </span>

      {/* Simplified */}
      <span className="font-serif text-lg w-16 shrink-0">{vocab.simplified}</span>

      {/* Pinyin */}
      <span className="text-sm text-muted-foreground w-24 shrink-0 truncate">
        {vocab.pinyin}
      </span>

      {/* Meaning */}
      <span className="text-sm text-foreground truncate flex-1 min-w-0">
        {vocab.meanings_en}
      </span>

      {/* Notes indicator */}
      {vocab.has_notes && (
        <span className="text-primary text-xs shrink-0">●</span>
      )}
    </button>
  );
}
