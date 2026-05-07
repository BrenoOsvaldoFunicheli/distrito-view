"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useFarolCriteria, useFarolGroups } from "@/hooks/use-farol";
import { api, ApiError } from "@/lib/api";
import type { FarolCriterion, FarolGroup, FarolKind } from "@/lib/types";

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
  const { data: criteria, mutate: mutateCriteria } = useFarolCriteria();
  const { data: groups, mutate: mutateGroups } = useFarolGroups();
  const [error, setError] = useState("");

  const refresh = async () => {
    await Promise.all([mutateCriteria(), mutateGroups()]);
    onChanged();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Farol</DialogTitle>
          <DialogDescription>
            Gerencie critérios e seus grupos.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded bg-red-50 p-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <Tabs defaultValue="criteria">
          <TabsList>
            <TabsTrigger value="criteria">Critérios</TabsTrigger>
            <TabsTrigger value="groups">Grupos</TabsTrigger>
          </TabsList>
          <TabsContent value="criteria" className="space-y-4 pt-3">
            <CriteriaSection
              criteria={criteria ?? []}
              groups={groups ?? []}
              onChanged={refresh}
              onError={setError}
            />
          </TabsContent>
          <TabsContent value="groups" className="space-y-4 pt-3">
            <GroupsSection
              groups={groups ?? []}
              onChanged={refresh}
              onError={setError}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ----------------- Criteria -----------------

interface CriteriaSectionProps {
  criteria: FarolCriterion[];
  groups: FarolGroup[];
  onChanged: () => void;
  onError: (msg: string) => void;
}

function CriteriaSection({
  criteria,
  groups,
  onChanged,
  onError,
}: CriteriaSectionProps) {
  const [newLabel, setNewLabel] = useState("");
  const [newKind, setNewKind] = useState<FarolKind>("manual");
  const [newShowColor, setNewShowColor] = useState(true);
  const [newShowText, setNewShowText] = useState(false);
  const [newGroupId, setNewGroupId] = useState<string>("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    setAdding(true);
    onError("");
    try {
      await api.post("/api/v1/farol/criteria", {
        label: newLabel.trim(),
        kind: newKind,
        show_color: newKind === "calculated_allocation" ? true : newShowColor,
        show_text: newKind === "calculated_allocation" ? false : newShowText,
        group_id: newGroupId === "" ? null : Number(newGroupId),
      });
      setNewLabel("");
      setNewKind("manual");
      setNewShowColor(true);
      setNewShowText(false);
      setNewGroupId("");
      onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.detail : "Erro ao criar");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (
      !confirm("Excluir este critério? Os valores vinculados serão apagados.")
    )
      return;
    try {
      await api.delete(`/api/v1/farol/criteria/${id}`);
      onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.detail : "Erro ao excluir");
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        {criteria.map((c) => (
          <CriterionRow
            key={c.id}
            criterion={c}
            groups={groups}
            onChanged={onChanged}
            onDelete={() => handleDelete(c.id)}
            onError={onError}
          />
        ))}
        {criteria.length === 0 && (
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
              placeholder="Ex: Margem"
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
          <div className="space-y-1 md:col-span-2">
            <Label className="text-xs">Grupo</Label>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={newGroupId}
              onChange={(e) => setNewGroupId(e.target.value)}
            >
              <option value="">Sem grupo</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
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
  );
}

interface CriterionRowProps {
  criterion: FarolCriterion;
  groups: FarolGroup[];
  onChanged: () => void;
  onDelete: () => void;
  onError: (msg: string) => void;
}

function CriterionRow({
  criterion,
  groups,
  onChanged,
  onDelete,
  onError,
}: CriterionRowProps) {
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

  const handleGroupChange = async (value: string) => {
    setBusy(true);
    onError("");
    try {
      await api.put(`/api/v1/farol/criteria/${criterion.id}`, {
        group_id: value === "" ? null : Number(value),
      });
      onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.detail : "Erro ao mover");
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
      <select
        className="h-8 rounded-md border bg-background px-1 text-xs"
        value={criterion.group_id ?? ""}
        onChange={(e) => handleGroupChange(e.target.value)}
        disabled={busy}
        title="Grupo"
      >
        <option value="">— Sem grupo —</option>
        {groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.label}
          </option>
        ))}
      </select>
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

// ----------------- Groups -----------------

interface GroupsSectionProps {
  groups: FarolGroup[];
  onChanged: () => void;
  onError: (msg: string) => void;
}

function GroupsSection({ groups, onChanged, onError }: GroupsSectionProps) {
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    setAdding(true);
    onError("");
    try {
      await api.post("/api/v1/farol/groups", { label: newLabel.trim() });
      setNewLabel("");
      onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.detail : "Erro ao criar grupo");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (
      !confirm(
        "Excluir este grupo? Os critérios voltam para 'Sem grupo'.",
      )
    )
      return;
    try {
      await api.delete(`/api/v1/farol/groups/${id}`);
      onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.detail : "Erro ao excluir");
    }
  };

  const move = async (id: number, delta: number) => {
    const sorted = [...groups].sort((a, b) => a.position - b.position);
    const idx = sorted.findIndex((g) => g.id === id);
    const target = idx + delta;
    if (idx < 0 || target < 0 || target >= sorted.length) return;
    [sorted[idx], sorted[target]] = [sorted[target], sorted[idx]];
    const items = sorted.map((g, i) => ({ id: g.id, position: i + 1 }));
    try {
      await api.post("/api/v1/farol/groups/reorder", { items });
      onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.detail : "Erro ao reordenar");
    }
  };

  const sorted = [...groups].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        {sorted.map((g, i) => (
          <GroupRow
            key={g.id}
            group={g}
            isFirst={i === 0}
            isLast={i === sorted.length - 1}
            onChanged={onChanged}
            onDelete={() => handleDelete(g.id)}
            onMoveUp={() => move(g.id, -1)}
            onMoveDown={() => move(g.id, 1)}
            onError={onError}
          />
        ))}
        {sorted.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum grupo ainda.</p>
        )}
      </div>

      <div className="flex items-end gap-2 border-t pt-3">
        <div className="flex-1 space-y-1">
          <Label className="text-xs">Novo grupo</Label>
          <Input
            placeholder="Ex: Financeiro"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
        </div>
        <Button onClick={handleAdd} disabled={adding || !newLabel.trim()}>
          <Plus className="mr-1 h-4 w-4" />
          Adicionar
        </Button>
      </div>
    </div>
  );
}

interface GroupRowProps {
  group: FarolGroup;
  isFirst: boolean;
  isLast: boolean;
  onChanged: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onError: (msg: string) => void;
}

function GroupRow({
  group,
  isFirst,
  isLast,
  onChanged,
  onDelete,
  onMoveUp,
  onMoveDown,
  onError,
}: GroupRowProps) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(group.label);
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    if (!label.trim()) return;
    setBusy(true);
    onError("");
    try {
      await api.put(`/api/v1/farol/groups/${group.id}`, {
        label: label.trim(),
      });
      setEditing(false);
      onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.detail : "Erro ao salvar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2 rounded border bg-card px-2 py-1.5">
      <div className="flex flex-col gap-0.5">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onMoveUp}
          disabled={isFirst}
          className="h-4 w-5 p-0"
        >
          <ArrowUp className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onMoveDown}
          disabled={isLast}
          className="h-4 w-5 p-0"
        >
          <ArrowDown className="h-3 w-3" />
        </Button>
      </div>
      {editing ? (
        <Input
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") {
              setLabel(group.label);
              setEditing(false);
            }
          }}
          className="h-8"
        />
      ) : (
        <span className="flex-1 truncate text-sm font-medium">
          {group.label}
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
              setLabel(group.label);
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
