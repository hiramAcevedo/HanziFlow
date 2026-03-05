"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { StrokeModal } from "@/components/shared/stroke-modal";
import { api } from "@/lib/api";
import { getCharacterInfoBatch } from "@/lib/dictionary";
import type { HskVocabDetail, CharacterDecomposition } from "@/lib/types";

interface HskWordModalProps {
  simplified: string;
  onClose: () => void;
  onNavigate?: (direction: "prev" | "next") => void;
  canNavigatePrev?: boolean;
  canNavigateNext?: boolean;
  onAddToVault?: () => void;
}

export function HskWordModal({
  simplified,
  onClose,
  onNavigate,
  canNavigatePrev = false,
  canNavigateNext = false,
  onAddToVault,
}: HskWordModalProps) {
  const [detail, setDetail] = useState<HskVocabDetail | null>(null);
  const [selectedCharIndex, setSelectedCharIndex] = useState(0);
  const [showStrokeModal, setShowStrokeModal] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [localNotes, setLocalNotes] = useState("");

  // Load detail
  useEffect(() => {
    setDetail(null);
    setSelectedCharIndex(0);
    setShowStrokeModal(false);
    api.hskVocabDetail(simplified).then(async (d) => {
      // Enrich characters missing pinyin/definitions with CC-CEDICT
      const needEnrich = d.characters.some((ch) => !ch.pinyin && !ch.meanings_en);
      if (needEnrich) {
        const chars = d.characters.map((ch) => ch.simplified);
        const dictInfo = await getCharacterInfoBatch(chars);
        d.characters = d.characters.map((ch) => ({
          ...ch,
          pinyin: ch.pinyin || dictInfo[ch.simplified]?.pinyin || "",
          meanings_en: ch.meanings_en || dictInfo[ch.simplified]?.definition || "",
        }));
      }
      setDetail(d);
      setLocalNotes(d.notes ?? "");
    }).catch(() => {});
    // Mark as seen
    api.hskMarkSeen(simplified).catch(() => {});
  }, [simplified]);

  const handleNotesBlur = useCallback(() => {
    if (localNotes !== (detail?.notes ?? "")) {
      api.hskUpdateNotes(simplified, localNotes).catch(() => {});
    }
  }, [localNotes, detail?.notes, simplified]);

  // Keyboard handler (when stroke modal is NOT open)
  useEffect(() => {
    if (showStrokeModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      const key = e.key;

      if (key === "ArrowLeft" || key === "a" || key === "A") {
        e.preventDefault();
        setSelectedCharIndex((i) => Math.max(0, i - 1));
        return;
      }
      if (key === "ArrowRight" || key === "d" || key === "D") {
        e.preventDefault();
        if (detail) {
          setSelectedCharIndex((i) => Math.min(detail.characters.length - 1, i + 1));
        }
        return;
      }
      if (key === " " || key === "Enter") {
        e.preventDefault();
        setShowStrokeModal(true);
        return;
      }
      if (key === "ArrowUp" || key === "w" || key === "W") {
        e.preventDefault();
        onNavigate?.("prev");
        return;
      }
      if (key === "ArrowDown" || key === "s" || key === "S") {
        e.preventDefault();
        onNavigate?.("next");
        return;
      }
      if (key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showStrokeModal, detail, onClose, onNavigate]);

  const selectedChar: CharacterDecomposition | undefined =
    detail?.characters[selectedCharIndex];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-card text-card-foreground rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-border"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-serif">{simplified}</span>
              {detail && (
                <span className="text-sm text-muted-foreground">{detail.pinyin}</span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          {detail ? (
            <div className="p-4 flex flex-col gap-4">
              {/* Meaning */}
              <p className="text-sm text-foreground leading-relaxed">
                {detail.meanings_en}
              </p>

              {/* HSK levels */}
              {detail.levels.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {detail.levels.map((l, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                    >
                      HSK {l.hsk_version} · L{l.level}
                    </span>
                  ))}
                </div>
              )}

              {/* Character decomposition */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Componentes
                </p>
                <div className="flex gap-2">
                  {detail.characters.map((ch, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedCharIndex(i);
                        setShowStrokeModal(true);
                      }}
                      className={`flex flex-col items-center p-3 rounded-lg border transition-colors min-w-[4rem] ${
                        i === selectedCharIndex
                          ? "border-ring bg-accent"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <span className="text-2xl font-serif">{ch.simplified}</span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {ch.pinyin}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <button
                  onClick={() => setShowNotes((s) => !s)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  {localNotes.length > 0 && <span className="text-primary">●</span>}
                  Notas {showNotes ? "▾" : "▸"}
                </button>
                {showNotes && (
                  <textarea
                    className="mt-1 w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                    rows={3}
                    value={localNotes}
                    onChange={(e) => setLocalNotes(e.target.value)}
                    onBlur={handleNotesBlur}
                    placeholder="Escribe notas sobre esta palabra..."
                  />
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {onAddToVault && (
                  <button
                    onClick={onAddToVault}
                    className="text-xs text-muted-foreground hover:text-foreground hover:bg-accent px-2 py-1 rounded transition-colors"
                  >
                    + Baúl
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              Cargando...
            </div>
          )}

          {/* Footer: navigation */}
          {onNavigate && (
            <div className="flex items-center justify-between p-4 border-t border-border bg-muted">
              <button
                onClick={() => onNavigate("prev")}
                className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                disabled={!canNavigatePrev}
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
              <button
                onClick={() => onNavigate("next")}
                className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                disabled={!canNavigateNext}
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Nested StrokeModal for individual character */}
      <AnimatePresence>
        {showStrokeModal && selectedChar && (
          <StrokeModal
            character={selectedChar.simplified}
            pinyin={selectedChar.pinyin}
            definition={selectedChar.meanings_en}
            onClose={() => setShowStrokeModal(false)}
            onNavigate={(dir) => {
              if (!detail) return;
              const next =
                dir === "next"
                  ? selectedCharIndex + 1
                  : selectedCharIndex - 1;
              if (next >= 0 && next < detail.characters.length) {
                setSelectedCharIndex(next);
              }
            }}
            canNavigatePrev={selectedCharIndex > 0}
            canNavigateNext={
              detail ? selectedCharIndex < detail.characters.length - 1 : false
            }
            label={
              detail
                ? `Carácter ${selectedCharIndex + 1}/${detail.characters.length}`
                : undefined
            }
          />
        )}
      </AnimatePresence>
    </>
  );
}
