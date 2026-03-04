"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { LiveFeed, type LiveFeedRef } from "@/components/session/live-feed";
import { CharacterGrid } from "@/components/character-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { emitRefresh } from "@/lib/events";
import { useToast } from "@/components/shared/toast";
import { PromptDialog } from "@/components/shared/prompt-dialog";
import type { Session, Folder } from "@/lib/types";
import { Save } from "lucide-react";

type TargetMode = "limbo" | "session" | "new";

export default function CurrentSessionPage() {
  const [practiceText, setPracticeText] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const feedRef = useRef<LiveFeedRef>(null);

  // Routing state
  const [targetMode, setTargetMode] = useState<TargetMode>("limbo");
  const [targetSessionId, setTargetSessionId] = useState<number | "">("");
  const [newSessionName, setNewSessionName] = useState("");
  const [newSessionFolderId, setNewSessionFolderId] = useState<number | "">("");

  // Data for selectors
  const [sessions, setSessions] = useState<Session[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [newFolderOpen, setNewFolderOpen] = useState(false);

  const loadSelectors = useCallback(async () => {
    try {
      const [s, f] = await Promise.all([
        api.listSessions(),
        api.listFolders(),
      ]);
      setSessions(s);
      setFolders(f);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    loadSelectors();
  }, [loadSelectors]);

  const handleCharClick = useCallback((char: string) => {
    setPracticeText((prev) => prev + char);
  }, []);

  const handleCreateFolder = async (name: string) => {
    try {
      const folder = await api.createFolder({ name });
      setNewSessionFolderId(folder.id);
      loadSelectors();
      emitRefresh();
      toast(`Carpeta "${name}" creada`);
    } catch {
      toast("Error al crear carpeta", "error");
    }
  };

  const handleSave = async () => {
    const ids = feedRef.current?.getEntryIds() ?? [];
    if (ids.length === 0 && targetMode !== "new") {
      toast("No hay capturas para guardar", "info");
      return;
    }

    setSaving(true);
    try {
      let destName = "";

      if (targetMode === "session" && targetSessionId) {
        await api.assignEntries(ids, Number(targetSessionId));
        const sess = sessions.find((s) => s.id === Number(targetSessionId));
        destName = sess?.name ?? "sesion";
      } else if (targetMode === "new" && newSessionName.trim()) {
        const session = await api.createSession({
          name: newSessionName.trim(),
          folder_id: newSessionFolderId || undefined,
          source: "ocr",
        });
        if (ids.length > 0) {
          await api.assignEntries(ids, session.id);
        }
        destName = session.name;
        // After creating, switch to "existing session" mode pointing to the new one
        setTargetMode("session");
        setTargetSessionId(session.id);
        setNewSessionName("");
        // Reload selectors to include the new session
        loadSelectors();
      } else {
        // limbo — nothing to assign, just acknowledge
        toast(`${ids.length} captura${ids.length !== 1 ? "s" : ""} en limbo`, "info");
        feedRef.current?.clear();
        emitRefresh();
        setSaving(false);
        return;
      }

      // Clear the feed and notify
      feedRef.current?.clear();
      emitRefresh();
      toast(`${ids.length} entrada${ids.length !== 1 ? "s" : ""} movida${ids.length !== 1 ? "s" : ""} a "${destName}"`);
    } catch {
      toast("Error al guardar", "error");
    } finally {
      setSaving(false);
    }
  };

  // Resolve target name for the save button label
  const targetLabel = (() => {
    if (targetMode === "session" && targetSessionId) {
      const s = sessions.find((s) => s.id === Number(targetSessionId));
      return s ? `Guardar en "${s.name}"` : "Guardar";
    }
    if (targetMode === "new" && newSessionName.trim()) {
      return `Crear y guardar en "${newSessionName.trim()}"`;
    }
    return "Guardar en limbo";
  })();

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-foreground mb-6">Captura en vivo</h1>

        {/* Capture destination selector */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6 space-y-3">
          <p className="text-sm font-medium text-foreground">Destino de captura:</p>

          {/* Limbo */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="targetMode"
              checked={targetMode === "limbo"}
              onChange={() => setTargetMode("limbo")}
              className="accent-primary"
            />
            <span className="text-sm">Limbo (sin sesion)</span>
          </label>

          {/* Existing session */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="targetMode"
              checked={targetMode === "session"}
              onChange={() => setTargetMode("session")}
              className="accent-primary"
            />
            <span className="text-sm">Sesion existente:</span>
            <select
              className="flex-1 text-sm bg-background border border-border rounded-md px-2 py-1"
              value={targetSessionId}
              onChange={(e) => {
                setTargetSessionId(e.target.value ? Number(e.target.value) : "");
                setTargetMode("session");
              }}
              disabled={targetMode !== "session"}
            >
              <option value="">Seleccionar...</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          {/* New session */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="targetMode"
              checked={targetMode === "new"}
              onChange={() => setTargetMode("new")}
              className="accent-primary"
            />
            <span className="text-sm whitespace-nowrap">Nueva sesion:</span>
            <Input
              value={newSessionName}
              onChange={(e) => {
                setNewSessionName(e.target.value);
                setTargetMode("new");
              }}
              placeholder="Nombre"
              className="h-8 text-sm flex-1"
              disabled={targetMode !== "new"}
            />
            <span className="text-sm whitespace-nowrap">en</span>
            <select
              className="text-sm bg-background border border-border rounded-md px-2 py-1"
              value={newSessionFolderId}
              onChange={(e) => {
                if (e.target.value === "__new__") {
                  setNewFolderOpen(true);
                  // Reset select to previous value
                  e.target.value = String(newSessionFolderId);
                } else {
                  setNewSessionFolderId(e.target.value ? Number(e.target.value) : "");
                }
              }}
              disabled={targetMode !== "new"}
            >
              <option value="">Sin carpeta</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
              <option value="__new__">+ Nueva carpeta...</option>
            </select>
          </label>

          <div className="flex justify-end pt-1">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={
                saving ||
                (targetMode === "session" && !targetSessionId) ||
                (targetMode === "new" && !newSessionName.trim())
              }
            >
              <Save className="w-4 h-4 mr-1" />
              {saving ? "Guardando..." : targetLabel}
            </Button>
          </div>
        </div>

        {/* Live feed */}
        <LiveFeed ref={feedRef} onCharClick={handleCharClick} />

        {/* Practice area */}
        {practiceText && (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Practicar</h2>
              <button
                onClick={() => setPracticeText("")}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Limpiar
              </button>
            </div>
            <div className="bg-card rounded-2xl shadow-sm border border-border min-h-[200px]">
              <CharacterGrid text={practiceText} />
            </div>
          </section>
        )}
      </div>

      <PromptDialog
        open={newFolderOpen}
        onOpenChange={setNewFolderOpen}
        title="Nueva carpeta"
        placeholder="Nombre de la carpeta"
        onSubmit={handleCreateFolder}
      />
    </div>
  );
}
