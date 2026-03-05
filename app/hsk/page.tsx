"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSidebar } from "@/components/ui/sidebar";
import { api } from "@/lib/api";
import { HskLevelSelector } from "@/components/hsk/hsk-level-selector";
import { HskVocabList } from "@/components/hsk/hsk-vocab-list";
import { HskWordModal } from "@/components/hsk/hsk-word-modal";
import { StrokeModal } from "@/components/shared/stroke-modal";
import { PickerDialog } from "@/components/shared/picker-dialog";
import type { HskVocab, HskLevelSummary, Vault } from "@/lib/types";

export default function HskPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-muted-foreground">Cargando...</div>}>
      <HskPageContent />
    </Suspense>
  );
}

function HskPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setOpen: setSidebarOpen, isMobile } = useSidebar();

  // Collapse sidebar once on mount (desktop only), restore on unmount
  const sidebarRef = useRef({ setOpen: setSidebarOpen, isMobile });
  sidebarRef.current = { setOpen: setSidebarOpen, isMobile };
  useEffect(() => {
    if (sidebarRef.current.isMobile) return;
    sidebarRef.current.setOpen(false);
    return () => {
      sidebarRef.current.setOpen(true);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const version = searchParams.get("v") ?? "3.0";
  const level = Number(searchParams.get("l") ?? "1");

  const [levels, setLevels] = useState<HskLevelSummary[]>([]);
  const [vocab, setVocab] = useState<HskVocab[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<HskVocab[] | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [openWord, setOpenWord] = useState<HskVocab | null>(null);
  const [singleCharModal, setSingleCharModal] = useState<HskVocab | null>(null);

  // Vault picker
  const [vaultTarget, setVaultTarget] = useState<string | null>(null);
  const [vaults, setVaults] = useState<Vault[]>([]);

  // Load levels
  useEffect(() => {
    api.hskLevels().then(setLevels).catch(() => {});
  }, []);

  // Load vocabulary for selected level
  useEffect(() => {
    setLoading(true);
    setSelectedIndex(0);
    setSearchQuery("");
    setSearchResults(null);
    api
      .hskVocabulary({ version, level, limit: 2000 })
      .then((data) => {
        setVocab(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [version, level]);

  const handleLevelSelect = useCallback(
    (v: string, l: number) => {
      router.push(`/hsk?v=${v}&l=${l}`);
    },
    [router],
  );

  // Search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(() => {
      api.hskSearch(searchQuery.trim(), 100).then(setSearchResults).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const displayItems = searchResults ?? vocab;

  const handleOpen = useCallback((v: HskVocab) => {
    if (v.simplified.length === 1) {
      setSingleCharModal(v);
    } else {
      setOpenWord(v);
    }
  }, []);

  const handleModalNavigate = useCallback(
    (direction: "prev" | "next") => {
      const current = openWord || singleCharModal;
      if (!current) return;
      const idx = displayItems.findIndex((v) => v.simplified === current.simplified);
      const next = direction === "next" ? idx + 1 : idx - 1;
      if (next >= 0 && next < displayItems.length) {
        const item = displayItems[next];
        setSelectedIndex(next);
        if (item.simplified.length === 1) {
          setOpenWord(null);
          setSingleCharModal(item);
        } else {
          setSingleCharModal(null);
          setOpenWord(item);
        }
      }
    },
    [openWord, singleCharModal, displayItems],
  );

  const currentModalIndex = (() => {
    const current = openWord || singleCharModal;
    if (!current) return -1;
    return displayItems.findIndex((v) => v.simplified === current.simplified);
  })();

  const handleResetProgress = useCallback(async () => {
    if (!confirm("¿Reiniciar todo el progreso de revisión? Esta acción no se puede deshacer.")) return;
    await api.hskResetProgress().catch(() => {});
    // Refresh levels and vocabulary
    api.hskLevels().then(setLevels).catch(() => {});
    api.hskVocabulary({ version, level, limit: 2000 }).then(setVocab).catch(() => {});
  }, [version, level]);

  const handleAddToVault = useCallback(() => {
    const target = openWord?.simplified || singleCharModal?.simplified;
    if (!target) return;
    setVaultTarget(target);
    api.listVaults().then(setVaults).catch(() => {});
  }, [openWord, singleCharModal]);

  const handleVaultSelect = useCallback(
    async (vaultId: number | string) => {
      if (!vaultTarget) return;
      try {
        await api.addToVault(Number(vaultId), vaultTarget);
      } catch { /* silent — likely duplicate */ }
      setVaultTarget(null);
    },
    [vaultTarget],
  );

  // Progress stats
  const currentLevel = levels.find((l) => l.version === version && l.level === level);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border flex flex-col gap-3">
        <h1 className="text-lg font-bold">HSK Vocabulario</h1>
        <HskLevelSelector
          levels={levels}
          selectedVersion={version}
          selectedLevel={level}
          onSelect={handleLevelSelect}
        />

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por carácter, pinyin o significado..."
            className="pl-9"
          />
        </div>

        {/* Stats bar */}
        {currentLevel && !searchResults && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              {currentLevel.total} palabras · {currentLevel.studied} estudiadas
              ({currentLevel.total > 0
                ? Math.round((currentLevel.studied / currentLevel.total) * 100)
                : 0}
              %)
            </span>
            {currentLevel.studied > 0 && (
              <>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-48">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{
                      width: `${Math.round(
                        (currentLevel.studied / currentLevel.total) * 100,
                      )}%`,
                    }}
                  />
                </div>
                <button
                  onClick={handleResetProgress}
                  className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                  title="Reiniciar progreso"
                >
                  Reiniciar
                </button>
              </>
            )}
          </div>
        )}
        {searchResults && (
          <p className="text-xs text-muted-foreground">
            {searchResults.length} resultados para &quot;{searchQuery}&quot;
          </p>
        )}
      </div>

      {/* Vocab list */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Cargando vocabulario...
        </div>
      ) : (
        <HskVocabList
          items={displayItems}
          selectedIndex={selectedIndex}
          onSelectIndex={setSelectedIndex}
          onOpen={handleOpen}
          keyboardDisabled={openWord !== null || singleCharModal !== null}
        />
      )}

      {/* Word modal (multi-char) */}
      <AnimatePresence>
        {openWord && (
          <HskWordModal
            key={openWord.simplified}
            simplified={openWord.simplified}
            onClose={() => setOpenWord(null)}
            onNavigate={handleModalNavigate}
            canNavigatePrev={currentModalIndex > 0}
            canNavigateNext={currentModalIndex < displayItems.length - 1}
            onAddToVault={handleAddToVault}
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
            onOpen={() => {
              api.hskMarkSeen(singleCharModal.simplified).catch(() => {});
            }}
            notes={singleCharModal.notes}
            onNotesChange={(notes) => {
              api.hskUpdateNotes(singleCharModal.simplified, notes).catch(() => {});
            }}
            onAddToVault={handleAddToVault}
          />
        )}
      </AnimatePresence>

      {/* Vault picker dialog */}
      <PickerDialog
        open={vaultTarget !== null}
        onOpenChange={(open) => !open && setVaultTarget(null)}
        title="Agregar a baúl"
        items={vaults.map((v) => ({ id: v.id, label: v.name }))}
        onSelect={handleVaultSelect}
        allowCreate
        createLabel="Nuevo baúl"
        onCreate={async (name) => {
          if (!vaultTarget) return;
          try {
            const vault = await api.createVault({ name });
            await api.addToVault(vault.id, vaultTarget);
          } catch { /* silent */ }
          setVaultTarget(null);
        }}
      />
    </div>
  );
}
