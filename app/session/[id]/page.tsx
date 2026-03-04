"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { CharacterGrid } from "@/components/character-grid";
import { EntryCard } from "@/components/session/entry-card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { api } from "@/lib/api";
import { emitRefresh } from "@/lib/events";
import { useToast } from "@/components/shared/toast";
import type { SessionWithEntries } from "@/lib/types";
import { BookOpen, Trash2 } from "lucide-react";

export default function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [session, setSession] = useState<SessionWithEntries | null>(null);
  const [practiceText, setPracticeText] = useState("");
  const [error, setError] = useState("");
  const [deleteSessionOpen, setDeleteSessionOpen] = useState(false);

  const loadSession = useCallback(() => {
    api.getSession(Number(id))
      .then(setSession)
      .catch(() => setError("No se pudo cargar la sesion."));
  }, [id]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const handleCharClick = useCallback((char: string) => {
    setPracticeText((prev) => prev + char);
  }, []);

  const handlePracticeAll = () => {
    if (!session) return;
    const allHanzi = session.entries.map((e) => e.hanzi).join("");
    setPracticeText(allHanzi);
  };

  const handleDeleteEntry = useCallback((entryId: number) => {
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        entries: prev.entries.filter((e) => e.id !== entryId),
      };
    });
  }, []);

  const handleDeleteSession = async () => {
    try {
      const name = session?.name ?? "sesion";
      await api.deleteSession(Number(id));
      emitRefresh();
      toast(`Sesion "${name}" eliminada`);
      router.push("/writer");
    } catch {
      toast("Error al eliminar sesion", "error");
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Session header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-foreground">{session.name}</h1>
            <p className="text-xs text-muted-foreground">
              {session.entries.length} entrada{session.entries.length !== 1 ? "s" : ""} · {session.source}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteSessionOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Eliminar sesion
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePracticeAll}
              disabled={session.entries.length === 0}
            >
              <BookOpen className="w-4 h-4 mr-1" />
              Practicar todo
            </Button>
          </div>
        </div>

        {/* Entries */}
        <div className="space-y-3 mb-8">
          {session.entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onCharClick={handleCharClick}
              onDelete={handleDeleteEntry}
            />
          ))}
          {session.entries.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-12">
              Esta sesion no tiene entradas todavia.
            </div>
          )}
        </div>

        {/* Practice area */}
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

      <ConfirmDialog
        open={deleteSessionOpen}
        onOpenChange={setDeleteSessionOpen}
        title="Eliminar sesion"
        description={`Se eliminara la sesion "${session.name}" y todas sus entradas. Esta accion no se puede deshacer.`}
        onConfirm={handleDeleteSession}
      />
    </div>
  );
}
