"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Shield,
  Users,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAreas, useUserGroups } from "@/hooks/use-user-groups";
import { useUsers } from "@/hooks/use-users";
import { cn } from "@/lib/utils";
import type { AreaInfo, AuthUser, UserGroup } from "@/lib/types";

interface OverviewPanelProps {
  /** Callback opcional para mudar a tab no parent (ex: ir para "users"). */
  onSwitchTab?: (tab: "overview" | "users" | "groups") => void;
}

export function OverviewPanel({ onSwitchTab }: OverviewPanelProps) {
  const { data: users, isLoading: loadingUsers } = useUsers();
  const { data: groups, isLoading: loadingGroups } = useUserGroups();
  const { data: areasResp, isLoading: loadingAreas } = useAreas();

  const areas = areasResp?.areas ?? [];
  const isLoading = loadingUsers || loadingGroups || loadingAreas;

  const summary = useMemo(() => {
    const list = users ?? [];
    return {
      activeUsers: list.filter((u) => u.is_active).length,
      admins: list.filter((u) => u.is_admin).length,
      groupsCount: groups?.length ?? 0,
      withoutAccess: list.filter(
        (u) => u.is_active && !u.is_admin && u.areas.length === 0,
      ).length,
    };
  }, [users, groups]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <SummaryCard
          icon={<Users className="h-4 w-4" />}
          label="Usuários ativos"
          value={summary.activeUsers}
        />
        <SummaryCard
          icon={<Shield className="h-4 w-4" />}
          label="Admins"
          value={summary.admins}
        />
        <SummaryCard
          icon={<UsersRound className="h-4 w-4" />}
          label="Grupos cadastrados"
          value={summary.groupsCount}
        />
        <SummaryCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Sem acesso"
          value={summary.withoutAccess}
          alert={summary.withoutAccess > 0}
        />
      </div>

      <PendingUsersCard
        users={users ?? []}
        onGoToUsers={() => onSwitchTab?.("users")}
      />

      <UserAreaMatrix users={users ?? []} areas={areas} />

      <GroupAreaMatrix groups={groups ?? []} areas={areas} />
    </div>
  );
}

// ----------------- Summary card -----------------

function SummaryCard({
  icon,
  label,
  value,
  alert = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  alert?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            "text-3xl font-bold",
            alert && value > 0 && "text-red-600",
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

// ----------------- Pendências -----------------

function PendingUsersCard({
  users,
  onGoToUsers,
}: {
  users: AuthUser[];
  onGoToUsers: () => void;
}) {
  const pending = users.filter(
    (u) => u.is_active && !u.is_admin && u.areas.length === 0,
  );

  if (pending.length === 0) {
    return null;
  }

  return (
    <Card className="border-red-200 bg-red-50/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-red-700">
          <AlertTriangle className="h-4 w-4" />
          Usuários sem acesso a nenhuma área
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-muted-foreground">
          Estes usuários estão ativos mas não pertencem a nenhum grupo —
          não conseguem ver nada no sistema. Adicione-os a um grupo.
        </p>
        <ul className="space-y-1">
          {pending.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between rounded border bg-background px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <span className="font-medium">{u.email}</span>
                {u.name && (
                  <span className="text-muted-foreground"> — {u.name}</span>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={onGoToUsers}
              >
                Editar grupos
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// ----------------- Matriz Usuário x Área -----------------

function UserAreaMatrix({
  users,
  areas,
}: {
  users: AuthUser[];
  areas: AreaInfo[];
}) {
  const [search, setSearch] = useState("");
  const [onlyActive, setOnlyActive] = useState(true);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users
      .filter((u) => (onlyActive ? u.is_active : true))
      .filter((u) => {
        if (!term) return true;
        return (
          u.email.toLowerCase().includes(term) ||
          (u.name || "").toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        const an = (a.name || a.email).toLowerCase();
        const bn = (b.name || b.email).toLowerCase();
        return an.localeCompare(bn);
      });
  }, [users, search, onlyActive]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of areas) map[a.key] = 0;
    for (const u of users) {
      if (onlyActive && !u.is_active) continue;
      if (u.is_admin) {
        for (const a of areas) map[a.key]++;
      } else {
        for (const k of u.areas) {
          if (k in map) map[k]++;
        }
      }
    }
    return map;
  }, [users, areas, onlyActive]);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle className="text-base">Acesso por usuário</CardTitle>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-56"
          />
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={onlyActive}
              onCheckedChange={(v) => setOnlyActive(v === true)}
            />
            Só ativos
          </label>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum usuário encontrado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background">
                    Usuário
                  </TableHead>
                  <TableHead className="text-center">Papel</TableHead>
                  {areas.map((a) => (
                    <TableHead
                      key={a.key}
                      className="text-center text-xs whitespace-nowrap"
                      title={`${a.key} — ${counts[a.key]} com acesso`}
                    >
                      {a.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow
                    key={u.id}
                    className={cn(u.is_admin && "bg-purple-50/40")}
                  >
                    <TableCell className="sticky left-0 bg-background">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {u.name || u.email}
                        </span>
                        {u.name && (
                          <span className="text-xs text-muted-foreground">
                            {u.email}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {u.is_admin ? (
                        <span className="rounded bg-purple-100 px-2 py-0.5 text-[11px] font-medium text-purple-800">
                          Admin
                        </span>
                      ) : !u.is_active ? (
                        <span className="rounded bg-red-100 px-2 py-0.5 text-[11px] text-red-800">
                          Inativo
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Usuário
                        </span>
                      )}
                    </TableCell>
                    {areas.map((a) => {
                      const has = u.is_admin || u.areas.includes(a.key);
                      return (
                        <TableCell
                          key={a.key}
                          className="text-center align-middle"
                        >
                          {has ? (
                            <Check className="mx-auto h-4 w-4 text-green-600" />
                          ) : (
                            <span className="text-muted-foreground/40">·</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ----------------- Matriz Grupo x Área -----------------

function GroupAreaMatrix({
  groups,
  areas,
}: {
  groups: UserGroup[];
  areas: AreaInfo[];
}) {
  const sorted = useMemo(() => {
    return [...groups].sort((a, b) => {
      if (a.name === "Acesso total") return -1;
      if (b.name === "Acesso total") return 1;
      return a.name.localeCompare(b.name);
    });
  }, [groups]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Áreas por grupo</CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum grupo.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background">
                    Grupo
                  </TableHead>
                  {areas.map((a) => (
                    <TableHead
                      key={a.key}
                      className="text-center text-xs whitespace-nowrap"
                      title={a.key}
                    >
                      {a.label}
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Membros</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="sticky left-0 bg-background font-medium">
                      {g.name}
                      {g.description && (
                        <p className="text-xs font-normal text-muted-foreground">
                          {g.description}
                        </p>
                      )}
                    </TableCell>
                    {areas.map((a) => {
                      const has = g.areas.includes(a.key);
                      return (
                        <TableCell
                          key={a.key}
                          className="text-center align-middle"
                        >
                          {has ? (
                            <Check className="mx-auto h-4 w-4 text-green-600" />
                          ) : (
                            <span className="text-muted-foreground/40">·</span>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right tabular-nums">
                      {g.member_count}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
