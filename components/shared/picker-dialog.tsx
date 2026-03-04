"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

export interface PickerItem {
  id: number | string;
  label: string;
  description?: string;
}

interface PickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  items: PickerItem[];
  onSelect: (id: number | string) => void;
  allowCreate?: boolean;
  createLabel?: string;
  onCreate?: (name: string) => void;
}

export function PickerDialog({
  open,
  onOpenChange,
  title,
  items,
  onSelect,
  allowCreate = false,
  createLabel = "Crear nuevo",
  onCreate,
}: PickerDialogProps) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const handleSelect = (id: number | string) => {
    onSelect(id);
    onOpenChange(false);
    setCreating(false);
    setNewName("");
  };

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onCreate?.(trimmed);
    onOpenChange(false);
    setCreating(false);
    setNewName("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setCreating(false);
          setNewName("");
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="max-h-64 overflow-y-auto -mx-2">
          {items.map((item) => (
            <button
              key={item.id}
              className="w-full text-left px-4 py-2.5 hover:bg-accent rounded-md transition-colors"
              onClick={() => handleSelect(item.id)}
            >
              <div className="text-sm font-medium">{item.label}</div>
              {item.description && (
                <div className="text-xs text-muted-foreground">{item.description}</div>
              )}
            </button>
          ))}
          {items.length === 0 && !allowCreate && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay opciones disponibles.
            </p>
          )}
        </div>
        {allowCreate && (
          <div className="border-t pt-3">
            {creating ? (
              <div className="flex gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nombre..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                  }}
                />
                <Button size="sm" onClick={handleCreate} disabled={!newName.trim()}>
                  Crear
                </Button>
              </div>
            ) : (
              <button
                className="w-full text-left px-4 py-2.5 hover:bg-accent rounded-md transition-colors flex items-center gap-2 text-sm text-muted-foreground"
                onClick={() => setCreating(true)}
              >
                <Plus className="w-4 h-4" />
                {createLabel}
              </button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
