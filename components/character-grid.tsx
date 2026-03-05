"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getPinyin, getCharacterInfoBatch, type CharacterInfo } from "@/lib/dictionary";
import { StrokeModal } from "@/components/shared/stroke-modal";

interface CharacterData {
  char: string;
  isChinese: boolean;
  index: number;
  pinyin?: string;
  definition?: string;
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
      pinyin: isChinese ? getPinyin(char) : undefined,
    });
  }

  return chars;
}

export function CharacterGrid({ text }: CharacterGridProps) {
  const [selectedChar, setSelectedChar] = useState<CharacterData | null>(null);
  const [definitions, setDefinitions] = useState<Record<string, CharacterInfo>>({});
  const characters = extractCharacters(text);

  // Load definitions asynchronously
  useEffect(() => {
    const chineseChars = characters
      .filter((c) => c.isChinese)
      .map((c) => c.char);

    if (chineseChars.length === 0) return;

    const unique = [...new Set(chineseChars)];
    getCharacterInfoBatch(unique).then((info) => {
      setDefinitions(info);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const handleCharacterClick = useCallback((charData: CharacterData) => {
    if (!charData.isChinese) return;
    setSelectedChar(charData);
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

  if (characters.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
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
              relative w-12 rounded-lg font-serif flex flex-col items-center justify-center
              transition-all duration-200
              ${
                charData.isChinese
                  ? "bg-card hover:bg-accent shadow-sm border border-border cursor-pointer hover:shadow-md hover:border-ring hover:scale-105 pb-1 pt-0.5"
                  : "bg-muted text-muted-foreground cursor-default h-12"
              }
              ${
                selectedChar?.index === charData.index && selectedChar?.isChinese
                  ? "ring-2 ring-ring ring-offset-2 ring-offset-background"
                  : ""
              }
            `}
            title={charData.isChinese ? charData.pinyin : undefined}
          >
            {charData.isChinese && charData.pinyin && (
              <span className="text-[10px] leading-tight text-muted-foreground font-sans">
                {charData.pinyin}
              </span>
            )}
            <span className={charData.isChinese ? "text-2xl leading-tight" : "text-2xl"}>
              {charData.char}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Stroke modal */}
      <AnimatePresence>
        {selectedChar && (
          <StrokeModal
            character={selectedChar.char}
            pinyin={selectedChar.pinyin}
            definition={definitions[selectedChar.char]?.definition}
            onClose={handleClose}
            onNavigate={handleNavigate}
            canNavigatePrev={selectedChar.index > 0}
            canNavigateNext={selectedChar.index < totalChinese - 1}
            label={`Carácter ${selectedChar.index + 1}/${totalChinese}`}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default CharacterGrid;
