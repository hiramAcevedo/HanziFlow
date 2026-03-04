"use client";

import { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { connectCapture } from "@/lib/ws";
import { EntryCard } from "./entry-card";
import type { Entry } from "@/lib/types";

interface LiveFeedProps {
  onCharClick?: (char: string) => void;
}

export interface LiveFeedRef {
  clear: () => void;
  getEntryIds: () => number[];
}

export const LiveFeed = forwardRef<LiveFeedRef, LiveFeedProps>(
  function LiveFeed({ onCharClick }, ref) {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [connected, setConnected] = useState(false);

    const handleDelete = useCallback((id: number) => {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    }, []);

    useImperativeHandle(ref, () => ({
      clear: () => setEntries([]),
      getEntryIds: () => entries.map((e) => e.id),
    }), [entries]);

    useEffect(() => {
      setConnected(true);
      const disconnect = connectCapture({
        onEntry: (entry) => {
          setEntries((prev) => [entry, ...prev]);
        },
        onUpdate: (entry) => {
          setEntries((prev) =>
            prev.map((e) => (e.id === entry.id ? entry : e))
          );
        },
        onDelete: (entryId) => {
          setEntries((prev) => prev.filter((e) => e.id !== entryId));
        },
      });
      return () => {
        disconnect();
        setConnected(false);
      };
    }, []);

    return (
      <div>
        {/* Connection status */}
        <div className="flex items-center gap-2 mb-4">
          <span
            className={`w-2 h-2 rounded-full ${connected ? "bg-red-500 animate-pulse" : "bg-muted-foreground/30"}`}
          />
          <span className="text-sm text-muted-foreground">
            {connected ? "Esperando capturas..." : "Desconectado"}
          </span>
          {entries.length > 0 && (
            <span className="text-xs text-muted-foreground ml-auto">
              {entries.length} captura{entries.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Feed */}
        <div className="space-y-3">
          <AnimatePresence>
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <EntryCard
                  entry={entry}
                  onCharClick={onCharClick}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {entries.length === 0 && (
          <div className="text-center text-sm text-muted-foreground mt-12">
            <p>Las capturas de OCR apareceran aqui en tiempo real.</p>
            <p className="mt-1 text-xs">Asegurate de que hanziflow-server y hanziflow-ocr estan corriendo.</p>
          </div>
        )}
      </div>
    );
  }
);
