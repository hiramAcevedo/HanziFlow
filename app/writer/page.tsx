"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { CharacterGrid } from "@/components/character-grid";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Eraser, Info } from "lucide-react";

const EXAMPLE_TEXTS = [
  {
    name: "Saludos basicos",
    text: "你好，很高兴认识你。你叫什么名字？",
  },
  {
    name: "Presentacion",
    text: "我是学生，我在大学学习中文。",
  },
  {
    name: "Familia",
    text: "我家有四口人：爸爸、妈妈、哥哥和我。",
  },
  {
    name: "Comida",
    text: "我喜欢吃中国菜，尤其是北京烤鸭。",
  },
];

export default function WriterPage() {
  const [inputText, setInputText] = useState("");
  const [showInfo, setShowInfo] = useState(false);

  const handleClear = useCallback(() => {
    setInputText("");
  }, []);

  const handleExample = useCallback((text: string) => {
    setInputText(text);
  }, []);

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Title + Info */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-foreground">Practicar trazos</h1>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <Info className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {showInfo && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-blue-700 dark:text-blue-300"
          >
            <h3 className="font-semibold mb-2">Atajos de teclado</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>← → o A D: caracteres · ↓ S: +trazo · ↑ W: -trazo</li>
              <li>SPACE: play/stop · R: reproducir desde 0 · ESC: cerrar</li>
              <li>H: modo ver · T: modo practicar · 1-9: velocidad</li>
            </ul>
          </motion.div>
        )}

        {/* Input */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-foreground">
              Escribe tu texto en chino
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={!inputText}
            >
              <Eraser className="w-4 h-4 mr-1" />
              Limpiar
            </Button>
          </div>

          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="你好！在这里写中文... (Escribe en chino aqui)"
            className="min-h-[120px] text-lg resize-none font-sans"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground py-1">Ejemplos:</span>
            {EXAMPLE_TEXTS.map((example) => (
              <button
                key={example.name}
                onClick={() => handleExample(example.text)}
                className="text-xs px-3 py-1 bg-secondary hover:bg-accent text-secondary-foreground rounded-full transition-colors"
              >
                {example.name}
              </button>
            ))}
          </div>
        </section>

        {/* Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Caracteres</h2>
            {inputText && (
              <span className="text-sm text-muted-foreground">
                {inputText.replace(/\s/g, "").length} caracteres
              </span>
            )}
          </div>
          <div className="bg-card rounded-2xl shadow-sm border border-border min-h-[200px]">
            <CharacterGrid text={inputText} />
          </div>
        </section>
      </div>
    </div>
  );
}
