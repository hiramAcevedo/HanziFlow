"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { CharacterGrid } from "@/components/character-grid";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Pencil, Eraser, BookOpen, Info } from "lucide-react";

// Textos de ejemplo
const EXAMPLE_TEXTS = [
  {
    name: "Saludos básicos",
    text: "你好，很高兴认识你。你叫什么名字？",
  },
  {
    name: "Presentación",
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

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [showInfo, setShowInfo] = useState(false);

  const handleClear = useCallback(() => {
    setInputText("");
  }, []);

  const handleExample = useCallback((text: string) => {
    setInputText(text);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
              <Pencil className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900">HanziFlow</h1>
              <p className="text-xs text-zinc-500">Práctica de escritura china</p>
            </div>
          </div>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <Info className="w-5 h-5 text-zinc-500" />
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Info Panel */}
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800"
          >
            <h3 className="font-semibold mb-2">¿Cómo usar HanziFlow?</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>Escribe o pega un texto en chino en el área de abajo</li>
              <li>Haz clic en cualquier carácter para ver su orden de trazos</li>
              <li>← → o A D: caracteres · ↓ S: +trazo · ↑ W: −trazo</li>
              <li>SPACE: play/stop · R: reproducir desde 0 · ESC: cerrar</li>
              <li>H: modo ver · T: modo practicar · 1-9: velocidad</li>
            </ul>
          </motion.div>
        )}

        {/* Input Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-zinc-700">
              Escribe tu texto en chino
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={!inputText}
              className="text-zinc-500"
            >
              <Eraser className="w-4 h-4 mr-1" />
              Limpiar
            </Button>
          </div>
          
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="你好！在这里写中文... (Escribe en chino aquí)"
            className="min-h-[120px] text-lg resize-none font-sans"
          />

          {/* Ejemplos rápidos */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-zinc-400 py-1">Ejemplos:</span>
            {EXAMPLE_TEXTS.map((example) => (
              <button
                key={example.name}
                onClick={() => handleExample(example.text)}
                className="text-xs px-3 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-full transition-colors"
              >
                {example.name}
              </button>
            ))}
          </div>
        </section>

        {/* Character Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-800">
              Caracteres
            </h2>
            {inputText && (
              <span className="text-sm text-zinc-500">
                {inputText.replace(/\s/g, "").length} caracteres
              </span>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 min-h-[200px]">
            <CharacterGrid text={inputText} />
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-zinc-400">
          <p>Hecho con ❤️ para estudiantes de chino</p>
          <p className="mt-1">
            Powered by{" "}
            <a
              href="https://hanziwriter.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-zinc-600"
            >
              Hanzi Writer
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
