"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { useCurrentUser } from "@/hooks/use-auth";
import { useUsers } from "@/hooks/use-users";
import {
  useAreas,
  useGroupMemberCandidates,
  useUserGroups,
} from "@/hooks/use-user-groups";
import { api, ApiError } from "@/lib/api";
import type { AreaInfo, UserGroup } from "@/lib/types";

/** Forma mínima de usuário usada na seleção de membros. */
interface MemberOption {
  id: number;
  email: string;
  name: string | null;
}

interface GroupsPanelProps {
  /** Mostra o PageHeader interno. Default `true` (uso standalone em /admin/groups). */
  showHeader?: boolean;
}

export function GroupsPanel({ showHeader = true }: GroupsPanelProps) {
  const { data: currentUser } = useCurrentUser();
  const isAdmin = !!currentUser?.is_admin;
  const { data: groups, mutate, isLoading } = useUserGroups();
  const { data: areasResp } = useAreas();
  // Admin usa o endpoint completo de usuários; quem só gerencia grupos usa o
  // endpoint mínimo de candidatos (auth/users é restrito a admin).
  const { data: adminUsers } = useUsers(isAdmin);
  const { data: candidateUsers } = useGroupMemberCandidates(!isAdmin);
  const users: MemberOption[] = isAdmin
    ? adminUsers ?? []
    : candidateUsers ?? [];

  // Áreas que o usuário atual pode conceder. Admin concede todas.
  const grantableAreas = useMemo<AreaInfo[]>(() => {
    const all = areasResp?.areas ?? [];
    if (isAdmin) return all;
    const own = new Set(currentUser?.areas ?? []);
    return all.filter((a) => own.has(a.key));
  }, [areasResp, isAdmin, currentUser]);
  const [editing, setEditing] = useState<UserGroup | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState("");

  const refresh = () => mutate();

  const handleDelete = async (g: UserGroup) => {
    if (!confirm(`Excluir grupo "${g.name}"? Membros perdem essas permissões.`))
      return;
    setError("");
    try {
      await api.delete(`/api/v1/admin/groups/${g.id}`);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Erro");
    }
  };

  const newGroupButton = (
    <Button onClick={() => setCreateOpen(true)}>
      <Plus className="mr-2 h-4 w-4" />
      Novo grupo
    </Button>
  );

  return (
    <div className="space-y-6">
      {showHeader ? (
        <PageHeader
          title="Grupos de usuários"
          description="Cada grupo libera um conjunto de áreas para seus membros"
          actions={newGroupButton}
        />
      ) : (
        <div className="flex justify-end">{newGroupButton}</div>
      )}

      {error && (
        <div className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Grupos cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse h-32 bg-muted rounded" />
          ) : !groups || groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum grupo.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Áreas</TableHead>
                  <TableHead className="text-right">Membros</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {g.description || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {g.areas.length === 0 ? (
                          <span className="text-xs text-muted-foreground">
                            (sem áreas)
                          </span>
                        ) : (
                          g.areas.map((a) => (
                            <span
                              key={a}
                              className="rounded bg-muted px-2 py-0.5 text-[11px]"
                            >
                              {areaLabel(areasResp?.areas, a)}
                            </span>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {g.member_count}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Editar"
                          onClick={() => setEditing(g)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Excluir"
                          onClick={() => handleDelete(g)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <GroupDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        group={null}
        areas={areasResp?.areas || []}
        grantableAreas={grantableAreas}
        users={users}
        onSaved={refresh}
      />
      <GroupDialog
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        group={editing}
        areas={areasResp?.areas || []}
        grantableAreas={grantableAreas}
        users={users}
        onSaved={refresh}
      />
    </div>
  );
}

function areaLabel(areas: AreaInfo[] | undefined, key: string): string {
  return areas?.find((a) => a.key === key)?.label || key;
}

interface GroupDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  group: UserGroup | null;
  /** Catálogo completo de áreas (para rotular áreas preexistentes). */
  areas: AreaInfo[];
  /** Áreas que o usuário atual pode conceder/alterar. */
  grantableAreas: AreaInfo[];
  users: MemberOption[];
  onSaved: () => void;
}

function GroupDialog({
  open,
  onOpenChange,
  group,
  areas,
  grantableAreas,
  users,
  onSaved,
}: GroupDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(new Set());
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(group?.name || "");
      setDescription(group?.description || "");
      setSelectedAreas(new Set(group?.areas || []));
      setSelectedUsers(new Set(group?.member_ids || []));
      setSearch("");
      setError("");
    }
  }, [open, group]);

  // Áreas exibidas: as que o usuário pode conceder + as preexistentes do grupo
  // que ele NÃO pode alterar (mostradas marcadas e travadas, preservadas ao salvar).
  const grantableKeys = useMemo(
    () => new Set(grantableAreas.map((a) => a.key)),
    [grantableAreas],
  );
  const lockedAreas = useMemo<AreaInfo[]>(() => {
    const preexisting = group?.areas ?? [];
    return preexisting
      .filter((key) => !grantableKeys.has(key))
      .map((key) => areas.find((a) => a.key === key) ?? { key, label: key });
  }, [group, grantableKeys, areas]);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const term = search.toLowerCase();
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(term) ||
        (u.name || "").toLowerCase().includes(term),
    );
  }, [users, search]);

  const toggleArea = (key: string) => {
    setSelectedAreas((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleUser = (id: number) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    // Preserva áreas travadas (concedidas por admin) que o usuário não controla.
    const lockedKeys = lockedAreas.map((a) => a.key);
    const body = {
      name,
      description: description || null,
      areas: [...new Set([...selectedAreas, ...lockedKeys])],
      member_ids: [...selectedUsers],
    };
    try {
      if (group) {
        await api.put(`/api/v1/admin/groups/${group.id}`, body);
      } else {
        await api.post("/api/v1/admin/groups", body);
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{group ? `Editar ${group.name}` : "Novo grupo"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="rounded bg-red-50 p-2 text-sm text-red-600">
              {error}
            </div>
          )}
          <div className="space-y-1">
            <Label>Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Descrição</Label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Áreas liberadas</Label>
            <div className="grid grid-cols-2 gap-2 rounded border p-3">
              {grantableAreas.map((a) => (
                <label key={a.key} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={selectedAreas.has(a.key)}
                    onCheckedChange={() => toggleArea(a.key)}
                  />
                  {a.label}
                </label>
              ))}
              {lockedAreas.map((a) => (
                <label
                  key={a.key}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                  title="Área concedida por um administrador — você não pode alterá-la"
                >
                  <Checkbox checked disabled />
                  {a.label}
                </label>
              ))}
            </div>
            {grantableAreas.length === 0 && lockedAreas.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Você não possui áreas para conceder.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Membros ({selectedUsers.size})</Label>
            <Input
              placeholder="Filtrar por email ou nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="max-h-48 overflow-y-auto rounded border">
              {filteredUsers.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">
                  Nenhum usuário.
                </p>
              ) : (
                filteredUsers.map((u) => (
                  <label
                    key={u.id}
                    className="flex items-center gap-2 border-b px-3 py-2 text-sm last:border-b-0"
                  >
                    <Checkbox
                      checked={selectedUsers.has(u.id)}
                      onCheckedChange={() => toggleUser(u.id)}
                    />
                    <span className="font-medium">{u.email}</span>
                    {u.name && (
                      <span className="text-muted-foreground">
                        — {u.name}
                      </span>
                    )}
                  </label>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
