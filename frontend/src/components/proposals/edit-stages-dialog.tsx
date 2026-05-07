"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, Lock, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useProposalStages } from "@/hooks/use-proposal-stages";
import { api, ApiError } from "@/lib/api";
import type { ProposalStageDef } from "@/lib/types";

interface EditStagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

interface SortableRowProps {
  stage: ProposalStageDef;
  onSave: (label: string) => Promise<void>;
  onDelete: () => Promise<void>;
}

function SortableRow({ stage, onSave, onDelete }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: stage.id, disabled: stage.is_protected });

  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(stage.label);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLabel(stage.label);
  }, [stage.label]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleSave = async () => {
    if (!label.trim()) return;
    setBusy(true);
    try {
      await onSave(label.trim());
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Excluir coluna "${stage.label}"? Propostas serão movidas para a coluna anterior.`))
      return;
    setBusy(true);
    try {
      await onDelete();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded border bg-card px-2 py-1.5"
    >
      {stage.is_protected ? (
        <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
      ) : (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label="Arrastar"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}

      {editing ? (
        <Input
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") {
              setLabel(stage.label);
              setEditing(false);
            }
          }}
          className="h-8"
        />
      ) : (
        <span className="flex-1 truncate text-sm">{stage.label}</span>
      )}

      {stage.is_terminal && (
        <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
          {stage.key === "won" ? "Ganho" : "Perdido"}
        </span>
      )}

      {!stage.is_protected && (
        <>
          {editing ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleSave}
                disabled={busy}
                className="h-7 w-7 p-0"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setLabel(stage.label);
                  setEditing(false);
                }}
                className="h-7 w-7 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setEditing(true)}
              className="h-7 w-7 p-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            disabled={busy}
            className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}

export function EditStagesDialog({
  open,
  onOpenChange,
  onChanged,
}: EditStagesDialogProps) {
  const { data: stages, mutate } = useProposalStages();
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const editable = (stages || []).filter((s) => !s.is_protected);
  const terminals = (stages || []).filter((s) => s.is_protected);

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    setAdding(true);
    setError("");
    try {
      await api.post("/api/v1/proposal-stages", { label: newLabel.trim() });
      setNewLabel("");
      await mutate();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Erro ao criar coluna");
    } finally {
      setAdding(false);
    }
  };

  const handleSave = async (id: number, label: string) => {
    setError("");
    try {
      await api.put(`/api/v1/proposal-stages/${id}`, { label });
      await mutate();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Erro ao salvar");
    }
  };

  const handleDelete = async (id: number) => {
    setError("");
    try {
      await api.delete(`/api/v1/proposal-stages/${id}`);
      await mutate();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Erro ao excluir");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !stages) return;
    const oldIndex = editable.findIndex((s) => s.id === Number(active.id));
    const newIndex = editable.findIndex((s) => s.id === Number(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(editable, oldIndex, newIndex);
    const items = reordered.map((s, i) => ({ id: s.id, position: i + 1 }));
    const optimistic = [
      ...reordered.map((s, i) => ({ ...s, position: i + 1 })),
      ...terminals,
    ];
    mutate(optimistic, false);
    try {
      await api.post("/api/v1/proposal-stages/reorder", { items });
      await mutate();
      onChanged();
    } catch (err) {
      mutate();
      setError(err instanceof ApiError ? err.detail : "Erro ao reordenar");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Colunas</DialogTitle>
          <DialogDescription>
            Crie, renomeie, reordene ou exclua colunas. Ganho e Perdido são fixos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {error && (
            <div className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</div>
          )}

          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <SortableContext
              items={editable.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1.5">
                {editable.map((stage) => (
                  <SortableRow
                    key={stage.id}
                    stage={stage}
                    onSave={(label) => handleSave(stage.id, label)}
                    onDelete={() => handleDelete(stage.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {terminals.length > 0 && (
            <>
              <div className="pt-2 text-xs uppercase text-muted-foreground">
                Fixas
              </div>
              <div className="space-y-1.5">
                {terminals.map((stage) => (
                  <div
                    key={stage.id}
                    className="flex items-center gap-2 rounded border bg-muted/30 px-2 py-1.5"
                  >
                    <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate text-sm text-muted-foreground">
                      {stage.label}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex gap-2 border-t pt-3">
            <Input
              placeholder="Nome da nova coluna"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
            />
            <Button onClick={handleAdd} disabled={adding || !newLabel.trim()}>
              <Plus className="mr-1 h-4 w-4" />
              Adicionar
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
