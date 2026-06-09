"use client";

import { useEffect, useState } from "react";
import {
  KeyRound,
  Pencil,
  Plus,
  Shield,
  ShieldOff,
  Trash2,
  UserCheck,
  UserMinus,
} from "lucide-react";
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
import { useUserGroups } from "@/hooks/use-user-groups";
import { useUsers } from "@/hooks/use-users";
import { api, ApiError } from "@/lib/api";
import type { AuthUser, UserGroup } from "@/lib/types";

interface UsersPanelProps {
  /**
   * Mostra o PageHeader interno. Default `true` (uso standalone em /admin/users).
   * A página /admin usa `false` porque já renderiza um header próprio acima das tabs.
   */
  showHeader?: boolean;
}

export function UsersPanel({ showHeader = true }: UsersPanelProps) {
  const { data: me } = useCurrentUser();
  const { data: users, mutate, isLoading } = useUsers();
  const { data: allGroups } = useUserGroups();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AuthUser | null>(null);
  const [resetting, setResetting] = useState<AuthUser | null>(null);
  const [error, setError] = useState("");

  const refresh = () => mutate();

  const toggleActive = async (user: AuthUser) => {
    setError("");
    try {
      await api.put(`/api/v1/auth/users/${user.id}`, {
        is_active: !user.is_active,
      });
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Erro");
    }
  };

  const toggleAdmin = async (user: AuthUser) => {
    setError("");
    try {
      await api.put(`/api/v1/auth/users/${user.id}`, {
        is_admin: !user.is_admin,
      });
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Erro");
    }
  };

  const deleteUser = async (user: AuthUser) => {
    if (
      !confirm(
        `Excluir ${user.email}? Essa ação é permanente. (Considere desativar.)`,
      )
    )
      return;
    setError("");
    try {
      await api.delete(`/api/v1/auth/users/${user.id}`);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Erro");
    }
  };

  const newUserButton = (
    <Button onClick={() => setCreateOpen(true)}>
      <Plus className="mr-2 h-4 w-4" />
      Novo usuário
    </Button>
  );

  return (
    <div className="space-y-6">
      {showHeader ? (
        <PageHeader
          title="Usuários"
          description="Gerenciamento de contas com acesso ao sistema"
          actions={newUserButton}
        />
      ) : (
        <div className="flex justify-end">{newUserButton}</div>
      )}

      {error && (
        <div className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usuários cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse h-32 bg-muted rounded" />
          ) : !users || users.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum usuário.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Grupos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.email}</TableCell>
                    <TableCell>{u.name || "—"}</TableCell>
                    <TableCell>
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          u.is_admin
                            ? "bg-purple-100 text-purple-800"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {u.is_admin ? "Admin" : "Usuário"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.groups.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          u.groups.map((g) => (
                            <span
                              key={g}
                              className="rounded bg-muted px-2 py-0.5 text-[11px]"
                            >
                              {g}
                            </span>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          u.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {u.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Editar nome"
                          onClick={() => setEditing(u)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Resetar senha"
                          onClick={() => setResetting(u)}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title={u.is_admin ? "Remover admin" : "Tornar admin"}
                          onClick={() => toggleAdmin(u)}
                          disabled={me?.id === u.id}
                        >
                          {u.is_admin ? (
                            <ShieldOff className="h-4 w-4" />
                          ) : (
                            <Shield className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title={u.is_active ? "Desativar" : "Reativar"}
                          onClick={() => toggleActive(u)}
                          disabled={me?.id === u.id}
                        >
                          {u.is_active ? (
                            <UserMinus className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Excluir"
                          onClick={() => deleteUser(u)}
                          disabled={me?.id === u.id}
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

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        groups={allGroups || []}
        onCreated={refresh}
      />
      <EditUserDialog
        user={editing}
        groups={allGroups || []}
        onClose={() => setEditing(null)}
        onSaved={refresh}
      />
      <ResetPasswordDialog
        user={resetting}
        onClose={() => setResetting(null)}
        onSaved={refresh}
      />
    </div>
  );
}

function CreateUserDialog({
  open,
  onOpenChange,
  groups,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  groups: UserGroup[];
  onCreated: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [groupIds, setGroupIds] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setEmail("");
      setPassword("");
      setName("");
      setIsAdmin(false);
      setGroupIds(new Set());
      setError("");
    }
  }, [open]);

  const toggleGroup = (id: number) => {
    setGroupIds((prev) => {
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
    try {
      await api.post("/api/v1/auth/users", {
        email,
        password,
        name: name || null,
        is_admin: isAdmin,
        group_ids: [...groupIds],
      });
      onCreated();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Erro");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo usuário</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="rounded bg-red-50 p-2 text-sm text-red-600">
              {error}
            </div>
          )}
          <div className="space-y-1">
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Senha inicial</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="space-y-1">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={isAdmin}
              onCheckedChange={(v) => setIsAdmin(v === true)}
            />
            Administrador
          </label>
          {!isAdmin && groups.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs uppercase">Grupos</Label>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded border p-2">
                {groups.map((g) => (
                  <label
                    key={g.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={groupIds.has(g.id)}
                      onCheckedChange={() => toggleGroup(g.id)}
                    />
                    {g.name}
                    <span className="text-[11px] text-muted-foreground">
                      ({g.areas.length} áreas)
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({
  user,
  groups,
  onClose,
  onSaved,
}: {
  user: AuthUser | null;
  groups: UserGroup[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [groupIds, setGroupIds] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      const userGroupIds = new Set<number>(
        groups.filter((g) => user.groups.includes(g.name)).map((g) => g.id),
      );
      setGroupIds(userGroupIds);
      setError("");
    }
  }, [user, groups]);

  const toggleGroup = (id: number) => {
    setGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      await api.put(`/api/v1/auth/users/${user.id}`, {
        name: name || null,
        group_ids: [...groupIds],
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Erro");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar {user?.email}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="rounded bg-red-50 p-2 text-sm text-red-600">
              {error}
            </div>
          )}
          <div className="space-y-1">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          {!user?.is_admin && groups.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs uppercase">Grupos</Label>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded border p-2">
                {groups.map((g) => (
                  <label
                    key={g.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={groupIds.has(g.id)}
                      onCheckedChange={() => toggleGroup(g.id)}
                    />
                    {g.name}
                    <span className="text-[11px] text-muted-foreground">
                      ({g.areas.length} áreas)
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
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

function ResetPasswordDialog({
  user,
  onClose,
  onSaved,
}: {
  user: AuthUser | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setPassword("");
      setError("");
    }
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      await api.post(`/api/v1/auth/users/${user.id}/reset-password`, {
        password,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Erro");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resetar senha de {user?.email}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="rounded bg-red-50 p-2 text-sm text-red-600">
              {error}
            </div>
          )}
          <div className="space-y-1">
            <Label>Nova senha</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <p className="text-xs text-muted-foreground">
              O usuário terá que entrar com esta senha. Avise depois.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Definir senha"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
