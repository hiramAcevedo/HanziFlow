"use client";

import { useState, useEffect, useCallback } from "react";
import { EntryCard } from "@/components/session/entry-card";
import { CharacterGrid } from "@/components/character-grid";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { emitRefresh } from "@/lib/events";
import { useToast } from "@/components/shared/toast";
import { PickerDialog } from "@/components/shared/picker-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { Entry, Session } from "@/lib/types";
import { FolderOpen, Trash2 } from "lucide-react";

export default function LimboPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [practiceText, setPracticeText] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      const [limbo, sess] = await Promise.all([
        api.listEntries({ limbo: true }),
        api.listSessions(),
      ]);
      setEntries(limbo);
      setSessions(sess);
    } catch {
      // server not available
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCharClick = useCallback((char: string) => {
    setPracticeText((prev) => prev + char);
  }, []);

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteEntry = useCallback((id: number) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const handleAssign = async (sessionId: number | string) => {
    if (selected.size === 0) return;
    const count = selected.size;
    try {
      await api.assignEntries([...selected], Number(sessionId));
      const sess = sessions.find((s) => s.id === Number(sessionId));
      setSelected(new Set());
      loadData();
      emitRefresh();
      toast(`${count} entrada${count !== 1 ? "s" : ""} movida${count !== 1 ? "s" : ""} a "${sess?.name ?? "sesion"}"`);
    } catch {
      toast("Error al asignar entradas", "error");
    }
  };

  const handleCreateAndAssign = async (name: string) => {
    if (selected.size === 0) return;
    const count = selected.size;
    try {
      const session = await api.createSession({ name });
      await api.assignEntries([...selected], session.id);
      setSelected(new Set());
      loadData();
      emitRefresh();
      toast(`${count} entrada${count !== 1 ? "s" : ""} movida${count !== 1 ? "s" : ""} a "${session.name}"`);
    } catch {
      toast("Error al crear sesion", "error");
    }
  };

  const handleBatchDelete = async () => {
    if (selected.size === 0) return;
    const count = selected.size;
    try {
      await Promise.all([...selected].map((id) => api.deleteEntry(id)));
      setSelected(new Set());
      loadData();
      emitRefresh();
      toast(`${count} entrada${count !== 1 ? "s" : ""} eliminada${count !== 1 ? "s" : ""}`);
    } catch {
      toast("Error al eliminar", "error");
    }
  };

  const sessionItems = sessions.map((s) => ({
    id: s.id,
    label: s.name,
    description: `${s.entry_count} entrada${s.entry_count !== 1 ? "s" : ""}`,
  }));

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-foreground">Limbo</h1>
            <p className="text-xs text-muted-foreground">
              Entradas sin sesion asignada
            </p>
          </div>
          {selected.size > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Eliminar {selected.size}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
                <FolderOpen className="w-4 h-4 mr-1" />
                Asignar {selected.size} a sesion
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-3 mb-8">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-3 cursor-pointer"
              onClick={() => toggleSelect(entry.id)}
            >
              <input
                type="checkbox"
                checked={selected.has(entry.id)}
                onChange={() => toggleSelect(entry.id)}
                className="mt-5 flex-shrink-0"
              />
              <div className="flex-1">
                <EntryCard
                  entry={entry}
                  onCharClick={handleCharClick}
                  onDelete={handleDeleteEntry}
                />
              </div>
            </div>
          ))}
          {entries.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-12">
              No hay entradas en el limbo.
            </div>
          )}
        </div>

        {practiceText && (
          <section>
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

      <PickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        title="Asignar a sesion"
        items={sessionItems}
        onSelect={handleAssign}
        allowCreate
        createLabel="Nueva sesion"
        onCreate={handleCreateAndAssign}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Eliminar entradas"
        description={`Se eliminaran ${selected.size} entrada${selected.size !== 1 ? "s" : ""} seleccionada${selected.size !== 1 ? "s" : ""}. Esta accion no se puede deshacer.`}
        onConfirm={handleBatchDelete}
      />
    </div>
  );
}
