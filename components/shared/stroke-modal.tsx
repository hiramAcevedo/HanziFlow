"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HanziWriterComponent, type HanziWriterRef } from "../hanzi-writer";
import { X, ChevronLeft, ChevronRight, Play, Pencil, Info } from "lucide-react";

interface StrokeModalProps {
  character: string;
  pinyin?: string;
  definition?: string;
  onClose: () => void;
  onNavigate?: (direction: "prev" | "next") => void;
  canNavigatePrev?: boolean;
  canNavigateNext?: boolean;
  label?: string; // e.g. "Carácter 3/10"
  /** Called when modal opens — for tracking */
  onOpen?: () => void;
  /** Notes section */
  notes?: string;
  onNotesChange?: (notes: string) => void;
  /** Add to vault */
  onAddToVault?: () => void;
}

function isTyping(e: KeyboardEvent): boolean {
  return (
    e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
  );
}

export function StrokeModal({
  character,
  pinyin,
  definition,
  onClose,
  onNavigate,
  canNavigatePrev = false,
  canNavigateNext = false,
  label,
  onOpen,
  notes,
  onNotesChange,
  onAddToVault,
}: StrokeModalProps) {
  const [mode, setMode] = useState<"view" | "quiz">("view");
  const [speedLevel, setSpeedLevel] = useState(5);
  const [strokeInfo, setStrokeInfo] = useState({ index: -1, total: 0 });
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [localNotes, setLocalNotes] = useState(notes ?? "");
  const writerRef = useRef<HanziWriterRef | null>(null);

  // Fire onOpen once
  const openedRef = useRef(false);
  useEffect(() => {
    if (!openedRef.current) {
      openedRef.current = true;
      onOpen?.();
    }
  }, [onOpen]);

  // Sync notes from props
  useEffect(() => {
    setLocalNotes(notes ?? "");
  }, [notes]);

  const handleStrokeIndexChange = useCallback(
    (index: number, total: number) => {
      setStrokeInfo({ index, total });
    },
    [],
  );

  const handleNotesBlur = useCallback(() => {
    if (localNotes !== (notes ?? "")) {
      onNotesChange?.(localNotes);
    }
  }, [localNotes, notes, onNotesChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;

      if (key === "ArrowLeft" || key === "a" || key === "A") {
        if (isTyping(e)) return;
        e.preventDefault();
        onNavigate?.("prev");
        return;
      }
      if (key === "ArrowRight" || key === "d" || key === "D") {
        if (isTyping(e)) return;
        e.preventDefault();
        onNavigate?.("next");
        return;
      }
      if (key === " ") {
        if (isTyping(e)) return;
        e.preventDefault();
        if (mode === "view") {
          writerRef.current?.playStop();
        } else {
          onNavigate?.("next");
        }
        return;
      }
      if (key === "r" || key === "R") {
        if (isTyping(e)) return;
        if (mode === "view") {
          e.preventDefault();
          writerRef.current?.replay();
        }
        return;
      }
      if (key === "ArrowDown" || key === "s" || key === "S") {
        if (key !== "ArrowDown" && isTyping(e)) return;
        if (mode === "view") {
          e.preventDefault();
          writerRef.current?.nextStroke();
        }
        return;
      }
      if (key === "ArrowUp" || key === "w" || key === "W") {
        if (key !== "ArrowUp" && isTyping(e)) return;
        if (mode === "view") {
          e.preventDefault();
          writerRef.current?.prevStroke();
        }
        return;
      }
      if (key === "h" || key === "H") {
        if (isTyping(e)) return;
        e.preventDefault();
        setMode("view");
        return;
      }
      if (key === "t" || key === "T") {
        if (isTyping(e)) return;
        e.preventDefault();
        setMode("quiz");
        return;
      }
      if (key >= "1" && key <= "9" && !isTyping(e)) {
        e.preventDefault();
        const level = parseInt(key, 10);
        setSpeedLevel(level);
        writerRef.current?.setSpeed(level);
        return;
      }
      if (key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, onClose, onNavigate]);

  return (
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
        className="bg-card text-card-foreground rounded-2xl shadow-2xl max-w-md md:max-w-2xl w-full overflow-hidden border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center leading-none">
              <span className="text-sm text-muted-foreground font-sans">
                {pinyin || ""}
              </span>
              <span className="text-3xl font-serif">{character}</span>
            </div>

            {/* Mode switch — desktop only */}
            <div className="hidden md:flex gap-1">
              <button
                onClick={() => setMode("view")}
                className={`p-2 rounded-lg transition-colors ${
                  mode === "view"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Ver trazos (H)"
              >
                <Play className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMode("quiz")}
                className={`p-2 rounded-lg transition-colors ${
                  mode === "quiz"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Practicar escritura (T)"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>

            {/* Speed — desktop only */}
            {mode === "view" && (
              <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
                <span>Vel:</span>
                <span className="font-mono font-bold text-foreground">{speedLevel}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowShortcuts((s) => !s)}
              className={`p-2 rounded-lg transition-colors ${
                showShortcuts
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Atajos de teclado"
            >
              <Info className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Keyboard shortcuts (collapsible) */}
        <AnimatePresence>
          {showShortcuts && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-b border-border"
            >
              <div className="px-4 py-3 bg-muted text-xs text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1">
                <span><kbd className="font-mono bg-card px-1 rounded border border-border">← →</kbd> <kbd className="font-mono bg-card px-1 rounded border border-border">A D</kbd> Caracteres</span>
                <span><kbd className="font-mono bg-card px-1 rounded border border-border">↓</kbd> <kbd className="font-mono bg-card px-1 rounded border border-border">S</kbd> +trazo</span>
                <span><kbd className="font-mono bg-card px-1 rounded border border-border">↑</kbd> <kbd className="font-mono bg-card px-1 rounded border border-border">W</kbd> −trazo</span>
                <span><kbd className="font-mono bg-card px-1 rounded border border-border">Space</kbd> Play/Stop</span>
                <span><kbd className="font-mono bg-card px-1 rounded border border-border">R</kbd> Desde inicio</span>
                <span><kbd className="font-mono bg-card px-1 rounded border border-border">H</kbd> Ver · <kbd className="font-mono bg-card px-1 rounded border border-border">T</kbd> Practicar</span>
                <span><kbd className="font-mono bg-card px-1 rounded border border-border">1-9</kbd> Velocidad</span>
                <span><kbd className="font-mono bg-card px-1 rounded border border-border">Esc</kbd> Cerrar</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content: col on mobile, row on desktop */}
        <div className="p-4 md:p-6 flex flex-col md:flex-row md:gap-6">
          {/* Writer + counter */}
          <div className="flex flex-col items-center shrink-0">
            <HanziWriterComponent
              ref={writerRef}
              key={`${character}-${mode}`}
              character={character}
              mode={mode}
              width={280}
              height={280}
              padding={10}
              speedLevel={speedLevel}
              onStrokeIndexChange={handleStrokeIndexChange}
              onSpeedChange={setSpeedLevel}
              slotBelowCanvas={
                definition ? (
                  <div className="block md:hidden w-full px-3 py-2.5 bg-muted rounded-lg mt-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Definition
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">
                      {definition}
                    </p>
                  </div>
                ) : undefined
              }
            />
            {label && (
              <p className="mt-2 text-sm text-muted-foreground text-center">
                {label}
                {mode === "view" && strokeInfo.total > 0 && (
                  <span className="ml-1">
                    · Trazo {Math.max(0, strokeInfo.index + 1)}/{strokeInfo.total}
                  </span>
                )}
              </p>
            )}
            {!label && mode === "view" && strokeInfo.total > 0 && (
              <p className="mt-2 text-sm text-muted-foreground text-center">
                Trazo {Math.max(0, strokeInfo.index + 1)}/{strokeInfo.total}
              </p>
            )}
          </div>

          {/* Definition + notes (desktop) + mobile mode controls */}
          <div className="flex flex-col mt-3 md:mt-0 md:min-w-0 md:flex-1 gap-3">
            {/* Definition — desktop only */}
            {definition && (
              <div className="hidden md:block px-3 py-2.5 bg-muted rounded-lg md:flex-1 md:overflow-y-auto">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Definition
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {definition}
                </p>
              </div>
            )}

            {/* Notes section */}
            {onNotesChange && (
              <div className="hidden md:block">
                <button
                  onClick={() => setShowNotes((s) => !s)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  {(localNotes?.length ?? 0) > 0 && <span className="text-primary">●</span>}
                  Notas {showNotes ? "▾" : "▸"}
                </button>
                {showNotes && (
                  <textarea
                    className="mt-1 w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                    rows={3}
                    value={localNotes}
                    onChange={(e) => setLocalNotes(e.target.value)}
                    onBlur={handleNotesBlur}
                    placeholder="Escribe notas sobre este carácter..."
                  />
                )}
              </div>
            )}

            {/* Add to vault button */}
            {onAddToVault && (
              <div className="hidden md:block">
                <button
                  onClick={onAddToVault}
                  className="text-xs text-muted-foreground hover:text-foreground hover:bg-accent px-2 py-1 rounded transition-colors"
                >
                  + Baúl
                </button>
              </div>
            )}

            {/* Mode controls — mobile only */}
            <div className="flex md:hidden items-center justify-center gap-2">
              <button
                onClick={() => setMode("view")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  mode === "view"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
                title="Ver trazos (H)"
              >
                <Play className="w-3.5 h-3.5" />
                Ver
              </button>
              <button
                onClick={() => setMode("quiz")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  mode === "quiz"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
                title="Practicar escritura (T)"
              >
                <Pencil className="w-3.5 h-3.5" />
                Practicar
              </button>
              {mode === "view" && (
                <span className="ml-1 text-xs text-muted-foreground">
                  Vel: <span className="font-mono font-bold text-foreground">{speedLevel}</span>
                </span>
              )}
            </div>
          </div>
        </div>

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
  );
}
