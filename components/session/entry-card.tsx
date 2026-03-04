"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { api } from "@/lib/api";
import type { Entry } from "@/lib/types";

interface EntryCardProps {
  entry: Entry;
  onCharClick?: (char: string) => void;
  onDelete?: (id: number) => void;
}

// Detect CJK characters
function isChineseChar(char: string): boolean {
  const code = char.codePointAt(0) ?? 0;
  return (
    (code >= 0x4e00 && code <= 0x9fff) ||
    (code >= 0x3400 && code <= 0x4dbf) ||
    (code >= 0x20000 && code <= 0x2a6df) ||
    (code >= 0xf900 && code <= 0xfaff)
  );
}

export function EntryCard({ entry, onCharClick, onDelete }: EntryCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await api.deleteEntry(entry.id);
      onDelete?.(entry.id);
    } catch {
      // silent
    }
  };

  return (
    <div className="group relative bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-shadow">
      {/* Delete button */}
      {onDelete && (
        <button
          className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmOpen(true);
          }}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Hanzi */}
      <div className="text-2xl font-serif mb-1 text-card-foreground">
        {[...entry.hanzi].map((char, i) =>
          isChineseChar(char) ? (
            <span
              key={i}
              className="cursor-pointer hover:text-indigo-500 hover:underline transition-colors"
              onClick={() => onCharClick?.(char)}
            >
              {char}
            </span>
          ) : (
            <span key={i}>{char}</span>
          )
        )}
      </div>

      {/* Pinyin */}
      {entry.pinyin && (
        <div className="text-sm text-cyan-500 dark:text-cyan-400 mb-1">{entry.pinyin}</div>
      )}

      {/* Translation */}
      {entry.translation && (
        <div className="text-sm text-muted-foreground">{entry.translation}</div>
      )}

      {/* Source badge */}
      <div className="mt-2 flex items-center gap-2">
        <span
          className={cn(
            "text-[10px] px-2 py-0.5 rounded-full",
            entry.source === "ocr"
              ? "bg-red-500/10 text-red-500"
              : entry.source === "echo"
                ? "bg-blue-500/10 text-blue-500"
                : "bg-muted text-muted-foreground"
          )}
        >
          {entry.source}
        </span>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar entrada"
        description={`Se eliminara la entrada "${entry.hanzi}". Esta accion no se puede deshacer.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
