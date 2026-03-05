"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { HskVocabList } from "@/components/hsk/hsk-vocab-list";
import { HskWordModal } from "@/components/hsk/hsk-word-modal";
import { StrokeModal } from "@/components/shared/stroke-modal";
import type { HskVocab, Vault, VaultEntry } from "@/lib/types";

export default function VaultPage() {
  const params = useParams();
  const vaultId = Number(params.id);

  const [vault, setVault] = useState<Vault | null>(null);
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [openWord, setOpenWord] = useState<string | null>(null);
  const [singleCharModal, setSingleCharModal] = useState<VaultEntry | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [vaults, ents] = await Promise.all([
        api.listVaults(),
        api.vaultEntries(vaultId),
      ]);
      setVault(vaults.find((v) => v.id === vaultId) ?? null);
      setEntries(ents);
    } catch { /* silent */ }
    setLoading(false);
  }, [vaultId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Convert VaultEntry to HskVocab-like for the list component
  const displayItems: HskVocab[] = entries.map((e) => ({
    simplified: e.simplified,
    traditional: e.traditional,
    pinyin: e.pinyin,
    pinyin_numeric: "",
    radical: "",
    pos: "",
    entry_type: "",
    frequency_rank: null,
    meanings_en: e.meanings_en,
    classifiers: "",
    hsk_version: null,
    level: null,
    study_count: 0,
    last_studied_at: null,
    notes: "",
    has_notes: false,
  }));

  const handleOpen = useCallback((v: HskVocab) => {
    if (v.simplified.length === 1) {
      const entry = entries.find((e) => e.simplified === v.simplified);
      if (entry) setSingleCharModal(entry);
    } else {
      setOpenWord(v.simplified);
    }
  }, [entries]);

  const handleDelete = useCallback(
    async (v: HskVocab) => {
      try {
        await api.removeFromVault(vaultId, v.simplified);
        loadData();
      } catch { /* silent */ }
    },
    [vaultId, loadData],
  );

  const handleModalNavigate = useCallback(
    (direction: "prev" | "next") => {
      const current = openWord || singleCharModal?.simplified;
      if (!current) return;
      const idx = displayItems.findIndex((v) => v.simplified === current);
      const next = direction === "next" ? idx + 1 : idx - 1;
      if (next >= 0 && next < displayItems.length) {
        const item = displayItems[next];
        setSelectedIndex(next);
        if (item.simplified.length === 1) {
          setOpenWord(null);
          const entry = entries.find((e) => e.simplified === item.simplified);
          if (entry) setSingleCharModal(entry);
        } else {
          setSingleCharModal(null);
          setOpenWord(item.simplified);
        }
      }
    },
    [openWord, singleCharModal, displayItems, entries],
  );

  const currentModalIndex = (() => {
    const current = openWord || singleCharModal?.simplified;
    if (!current) return -1;
    return displayItems.findIndex((v) => v.simplified === current);
  })();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Cargando baúl...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          {vault && (
            <div
              className="w-4 h-4 rounded-full shrink-0"
              style={{ backgroundColor: vault.color }}
            />
          )}
          <h1 className="text-lg font-bold">{vault?.name ?? "Baúl"}</h1>
          <span className="text-xs text-muted-foreground">
            {entries.length} palabras
          </span>
        </div>
        {vault?.description && (
          <p className="text-sm text-muted-foreground mt-1">{vault.description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          <kbd className="font-mono bg-muted px-1 rounded border border-border">Delete</kbd> para quitar del baúl
        </p>
      </div>

      {/* List */}
      <HskVocabList
        items={displayItems}
        selectedIndex={selectedIndex}
        onSelectIndex={setSelectedIndex}
        onOpen={handleOpen}
        onDelete={handleDelete}
        keyboardDisabled={openWord !== null || singleCharModal !== null}
      />

      {/* Word modal */}
      <AnimatePresence>
        {openWord && (
          <HskWordModal
            key={openWord}
            simplified={openWord}
            onClose={() => setOpenWord(null)}
            onNavigate={handleModalNavigate}
            canNavigatePrev={currentModalIndex > 0}
            canNavigateNext={currentModalIndex < displayItems.length - 1}
          />
        )}
      </AnimatePresence>

      {/* Stroke modal (single char) */}
      <AnimatePresence>
        {singleCharModal && (
          <StrokeModal
            key={singleCharModal.simplified}
            character={singleCharModal.simplified}
            pinyin={singleCharModal.pinyin}
            definition={singleCharModal.meanings_en}
            onClose={() => setSingleCharModal(null)}
            onNavigate={handleModalNavigate}
            canNavigatePrev={currentModalIndex > 0}
            canNavigateNext={currentModalIndex < displayItems.length - 1}
            label={`Palabra ${currentModalIndex + 1}/${displayItems.length}`}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
