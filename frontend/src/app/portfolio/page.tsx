"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { useProjects } from "@/hooks/use-projects";
import type { ProjectStatus } from "@/lib/types";

export default function PortfolioPage() {
  const { data: projects, isLoading } = useProjects();
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">(
    "all",
  );
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!projects) return [];
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (q) {
        const haystack =
          `${p.name} ${p.client_name} ${p.contract_name}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [projects, statusFilter, search]);

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("pt-BR") : "-";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portfólio de Projetos"
        description="Todos os projetos cadastrados nos contratos"
      />

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Buscar por projeto, cliente ou contrato..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as ProjectStatus | "all")}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="paused">Pausado</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
          </SelectContent>
        </Select>
        {projects && (
          <span className="text-sm text-muted-foreground">
            {filtered.length} de {projects.length}
          </span>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="h-48 animate-pulse rounded bg-muted" />
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum projeto encontrado.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      <Link
                        href={`/clients/${p.client_id}`}
                        className="hover:underline"
                      >
                        {p.client_name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/contracts/${p.contract_id}`}
                        className="hover:underline"
                      >
                        {p.contract_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">
                      {p.start_date || p.end_date ? (
                        <>
                          {fmtDate(p.start_date)} → {fmtDate(p.end_date)}
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Não definido
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ProjectStatusBadge status={p.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
