"use client";

import { useCallback, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HskVocabRow } from "./hsk-vocab-row";
import type { HskVocab } from "@/lib/types";

interface HskVocabListProps {
  items: HskVocab[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onOpen: (vocab: HskVocab) => void;
  /** Called when Delete is pressed (for vault mode) */
  onDelete?: (vocab: HskVocab) => void;
  /** Disable keyboard navigation (e.g. when modal is open) */
  keyboardDisabled?: boolean;
}

export function HskVocabList({
  items,
  selectedIndex,
  onSelectIndex,
  onOpen,
  onDelete,
  keyboardDisabled = false,
}: HskVocabListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll selected into view
  useEffect(() => {
    if (selectedIndex < 0) return;
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedIndex]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (keyboardDisabled) return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      const key = e.key;

      if (key === "ArrowUp" || key === "w" || key === "W") {
        e.preventDefault();
        onSelectIndex(Math.max(0, selectedIndex - 1));
        return;
      }
      if (key === "ArrowDown" || key === "s" || key === "S") {
        e.preventDefault();
        onSelectIndex(Math.min(items.length - 1, selectedIndex + 1));
        return;
      }
      if (key === "PageUp") {
        e.preventDefault();
        onSelectIndex(Math.max(0, selectedIndex - 20));
        return;
      }
      if (key === "PageDown") {
        e.preventDefault();
        onSelectIndex(Math.min(items.length - 1, selectedIndex + 20));
        return;
      }
      if (key === "Home") {
        e.preventDefault();
        onSelectIndex(0);
        return;
      }
      if (key === "End") {
        e.preventDefault();
        onSelectIndex(items.length - 1);
        return;
      }
      if (key === " " || key === "Enter") {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          onOpen(items[selectedIndex]);
        }
        return;
      }
      if (key === "Delete" || key === "Backspace") {
        if (onDelete && selectedIndex >= 0 && selectedIndex < items.length) {
          e.preventDefault();
          onDelete(items[selectedIndex]);
        }
        return;
      }
      if (key === "Escape") {
        onSelectIndex(-1);
      }
    },
    [items, selectedIndex, onSelectIndex, onOpen, onDelete, keyboardDisabled],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (items.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        No hay vocabulario para mostrar
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-280px)]" ref={listRef}>
      <div className="flex flex-col gap-0.5 p-1">
        {items.map((vocab, i) => (
          <HskVocabRow
            key={vocab.simplified}
            vocab={vocab}
            index={i}
            isSelected={i === selectedIndex}
            onClick={() => {
              onSelectIndex(i);
              onOpen(vocab);
            }}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
