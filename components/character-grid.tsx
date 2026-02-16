"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HanziWriterComponent, type HanziWriterRef } from "./hanzi-writer";
import { X, ChevronLeft, ChevronRight, Play, Pencil } from "lucide-react";

interface CharacterData {
  char: string;
  isChinese: boolean;
  index: number;
}

interface CharacterGridProps {
  text: string;
}

function isChineseChar(char: string): boolean {
  const code = char.charCodeAt(0);
  return (
    (code >= 0x4e00 && code <= 0x9fff) ||
    (code >= 0x3400 && code <= 0x4dbf) ||
    (code >= 0x20000 && code <= 0x2a6df) ||
    (code >= 0x2a700 && code <= 0x2b73f) ||
    (code >= 0x2b740 && code <= 0x2b81f)
  );
}

function extractCharacters(text: string): CharacterData[] {
  const chars: CharacterData[] = [];
  let chineseIndex = 0;

  for (const char of text) {
    if (char === " " || char === "\n" || char === "\t") continue;

    const isChinese = isChineseChar(char);
    chars.push({
      char,
      isChinese,
      index: isChinese ? chineseIndex++ : -1,
    });
  }

  return chars;
}

function isTyping(e: KeyboardEvent): boolean {
  return (
    e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
  );
}

export function CharacterGrid({ text }: CharacterGridProps) {
  const [selectedChar, setSelectedChar] = useState<CharacterData | null>(null);
  const [mode, setMode] = useState<"view" | "quiz">("view");
  const [speedLevel, setSpeedLevel] = useState(5);
  const [strokeInfo, setStrokeInfo] = useState({ index: -1, total: 0 });
  const characters = extractCharacters(text);
  const writerRef = useRef<HanziWriterRef | null>(null);

  const handleCharacterClick = useCallback((charData: CharacterData) => {
    if (!charData.isChinese) return;
    setSelectedChar(charData);
    setMode("view");
  }, []);

  const handleClose = useCallback(() => {
    setSelectedChar(null);
  }, []);

  const handleNavigate = useCallback(
    (direction: "prev" | "next") => {
      if (!selectedChar) return;

      const currentIndex = characters.findIndex(
        (c) => c.index === selectedChar.index && c.isChinese,
      );
      if (currentIndex === -1) return;

      let newIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
      while (newIndex >= 0 && newIndex < characters.length) {
        if (characters[newIndex].isChinese) {
          setSelectedChar(characters[newIndex]);
          return;
        }
        newIndex = direction === "next" ? newIndex + 1 : newIndex - 1;
      }
    },
    [selectedChar, characters],
  );

  const handleStrokeIndexChange = useCallback(
    (index: number, total: number) => {
      setStrokeInfo({ index, total });
    },
    [],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedChar) return;

      const key = e.key;

      // --- Navigation between characters ---
      if (key === "ArrowLeft" || key === "a" || key === "A") {
        if (isTyping(e)) return;
        e.preventDefault();
        handleNavigate("prev");
        return;
      }
      if (key === "ArrowRight" || key === "d" || key === "D") {
        if (isTyping(e)) return;
        e.preventDefault();
        handleNavigate("next");
        return;
      }

      // --- Play / Stop ---
      if (key === " ") {
        e.preventDefault();
        if (mode === "view") {
          writerRef.current?.playStop();
        } else {
          handleNavigate("next");
        }
        return;
      }

      // --- Replay from 0 ---
      if (key === "r" || key === "R") {
        if (isTyping(e)) return;
        if (mode === "view") {
          e.preventDefault();
          writerRef.current?.replay();
        }
        return;
      }

      // --- Stroke stepping (↓/S = siguiente trazo, ↑/W = trazo anterior) ---
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

      // --- Mode switch ---
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

      // --- Speed 1-9 ---
      if (key >= "1" && key <= "9" && !isTyping(e)) {
        e.preventDefault();
        const level = parseInt(key, 10);
        setSpeedLevel(level);
        writerRef.current?.setSpeed(level);
        return;
      }

      // --- Close ---
      if (key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedChar, mode, handleClose, handleNavigate]);

  if (characters.length === 0) {
    return (
      <div className="text-center text-zinc-400 py-12">
        Escribe algo arriba para ver los caracteres
      </div>
    );
  }

  const totalChinese = characters.filter((c) => c.isChinese).length;

  return (
    <>
      {/* Grid de caracteres */}
      <div className="flex flex-wrap gap-2 justify-center p-4">
        {characters.map((charData, idx) => (
          <motion.button
            key={`${idx}-${charData.char}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.02 }}
            onClick={() => handleCharacterClick(charData)}
            className={`
              relative w-12 h-12 rounded-lg font-serif text-2xl flex items-center justify-center
              transition-all duration-200
              ${
                charData.isChinese
                  ? "bg-white hover:bg-zinc-50 shadow-sm border border-zinc-200 cursor-pointer hover:shadow-md hover:border-zinc-300 hover:scale-105"
                  : "bg-zinc-100 text-zinc-400 cursor-default"
              }
              ${
                selectedChar?.index === charData.index && selectedChar?.isChinese
                  ? "ring-2 ring-zinc-400 ring-offset-2"
                  : ""
              }
            `}
            title={charData.isChinese ? "Click para ver trazos" : undefined}
          >
            {charData.char}
          </motion.button>
        ))}
      </div>

      {/* Modal del escritor */}
      <AnimatePresence>
        {selectedChar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-serif">{selectedChar.char}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setMode("view")}
                      className={`p-2 rounded-lg transition-colors ${
                        mode === "view"
                          ? "bg-zinc-100 text-zinc-900"
                          : "text-zinc-400 hover:text-zinc-600"
                      }`}
                      title="Ver trazos (H)"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setMode("quiz")}
                      className={`p-2 rounded-lg transition-colors ${
                        mode === "quiz"
                          ? "bg-zinc-100 text-zinc-900"
                          : "text-zinc-400 hover:text-zinc-600"
                      }`}
                      title="Practicar escritura (T)"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Speed indicator */}
                  {mode === "view" && (
                    <div className="flex items-center gap-1 ml-2 text-xs text-zinc-400">
                      <span>Vel:</span>
                      <span className="font-mono font-bold text-zinc-600">{speedLevel}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              {/* Contenido */}
              <div className="p-6 flex flex-col items-center">
                <HanziWriterComponent
                  ref={writerRef}
                  key={`${selectedChar.char}-${mode}`}
                  character={selectedChar.char}
                  mode={mode}
                  width={280}
                  height={280}
                  padding={10}
                  speedLevel={speedLevel}
                  onComplete={
                    mode === "quiz"
                      ? () => {
                          /* TODO: feedback visual/sonoro */
                        }
                      : undefined
                  }
                  onStrokeIndexChange={handleStrokeIndexChange}
                  onSpeedChange={setSpeedLevel}
                />

                {/* Info adicional */}
                <div className="mt-4 text-center text-xs text-zinc-400 space-y-0.5">
                  <p className="text-sm text-zinc-500">
                    Carácter {selectedChar.index + 1} de {totalChinese}
                    {mode === "view" && strokeInfo.total > 0 && (
                      <span className="ml-2">
                        · Trazo {Math.max(0, strokeInfo.index + 1)}/{strokeInfo.total}
                      </span>
                    )}
                  </p>
                  <p>← → A D: caracteres · ↓ S: +trazo · ↑ W: −trazo</p>
                  <p>SPACE: play/stop · R: desde 0 · H: ver · T: practicar</p>
                  <p>1-9: velocidad · ESC: cerrar</p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-4 border-t border-zinc-100 bg-zinc-50">
                <button
                  onClick={() => handleNavigate("prev")}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg transition-colors"
                  disabled={selectedChar.index === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>
                <button
                  onClick={() => handleNavigate("next")}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg transition-colors"
                  disabled={selectedChar.index === totalChinese - 1}
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default CharacterGrid;
