"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFarolCriteria } from "@/hooks/use-farol";
import { api, ApiError } from "@/lib/api";
import type { FarolCriterion, FarolKind } from "@/lib/types";

interface EditCriteriaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

const KIND_LABELS: Record<FarolKind, string> = {
  manual: "Manual",
  calculated_allocation: "Calculado: Alocação",
};

export function EditCriteriaDialog({
  open,
  onOpenChange,
  onChanged,
}: EditCriteriaDialogProps) {
  const { data: criteria, mutate } = useFarolCriteria();
  const [newLabel, setNewLabel] = useState("");
  const [newKind, setNewKind] = useState<FarolKind>("manual");
  const [newShowColor, setNewShowColor] = useState(true);
  const [newShowText, setNewShowText] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const refresh = async () => {
    await mutate();
    onChanged();
  };

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    setAdding(true);
    setError("");
    try {
      await api.post("/api/v1/farol/criteria", {
        label: newLabel.trim(),
        kind: newKind,
        show_color: newKind === "calculated_allocation" ? true : newShowColor,
        show_text: newKind === "calculated_allocation" ? false : newShowText,
      });
      setNewLabel("");
      setNewKind("manual");
      setNewShowColor(true);
      setNewShowText(false);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Erro ao criar");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Excluir este critério? Os valores vinculados serão apagados."))
      return;
    try {
      await api.delete(`/api/v1/farol/criteria/${id}`);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Erro ao excluir");
    }
  };

  const list = criteria || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Critérios do Farol</DialogTitle>
          <DialogDescription>
            Crie critérios manuais (cor e/ou texto livre) ou use o critério
            calculado automático.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {error && (
            <div className="rounded bg-red-50 p-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            {list.map((c) => (
              <CriterionRow
                key={c.id}
                criterion={c}
                onChanged={refresh}
                onDelete={() => handleDelete(c.id)}
              />
            ))}
            {list.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum critério ainda.
              </p>
            )}
          </div>

          <div className="space-y-3 border-t pt-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Novo critério
            </p>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Nome</Label>
                <Input
                  placeholder="Ex: Influência Executiva"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tipo</Label>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={newKind}
                  onChange={(e) => setNewKind(e.target.value as FarolKind)}
                >
                  <option value="manual">Manual</option>
                  <option value="calculated_allocation">
                    Calculado: Alocação
                  </option>
                </select>
              </div>
            </div>
            {newKind === "manual" && (
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={newShowColor}
                    onCheckedChange={(v) => setNewShowColor(v === true)}
                  />
                  Mostrar farol (cor)
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={newShowText}
                    onCheckedChange={(v) => setNewShowText(v === true)}
                  />
                  Aceitar texto livre
                </label>
              </div>
            )}
            <div className="flex justify-end">
              <Button
                onClick={handleAdd}
                disabled={
                  adding ||
                  !newLabel.trim() ||
                  (newKind === "manual" && !newShowColor && !newShowText)
                }
              >
                <Plus className="mr-1 h-4 w-4" />
                Adicionar
              </Button>
            </div>
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

interface CriterionRowProps {
  criterion: FarolCriterion;
  onChanged: () => void;
  onDelete: () => void;
}

function CriterionRow({ criterion, onChanged, onDelete }: CriterionRowProps) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(criterion.label);
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    if (!label.trim()) return;
    setBusy(true);
    try {
      await api.put(`/api/v1/farol/criteria/${criterion.id}`, {
        label: label.trim(),
      });
      setEditing(false);
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const isCalculated = criterion.kind === "calculated_allocation";

  return (
    <div className="flex items-center gap-2 rounded border bg-card px-2 py-1.5">
      {editing ? (
        <Input
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") {
              setLabel(criterion.label);
              setEditing(false);
            }
          }}
          className="h-8"
        />
      ) : (
        <span className="flex-1 truncate text-sm">{criterion.label}</span>
      )}
      <span className="rounded bg-muted px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
        {KIND_LABELS[criterion.kind]}
      </span>
      {!isCalculated && (
        <span className="text-[10px] text-muted-foreground">
          {criterion.show_color && "🚦"}
          {criterion.show_text && " 📝"}
        </span>
      )}
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
              setLabel(criterion.label);
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
        onClick={onDelete}
        className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
