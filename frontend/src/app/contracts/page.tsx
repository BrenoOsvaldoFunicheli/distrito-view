"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { useContracts } from "@/hooks/use-contracts";
import { api } from "@/lib/api";

const STATUS_FILTERS = [
  { label: "Todos", value: "all" },
  { label: "Ativo", value: "active" },
  { label: "Pipeline", value: "pipeline" },
  { label: "Rascunho", value: "draft" },
  { label: "Concluído", value: "completed" },
  { label: "Cancelado", value: "cancelled" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]["value"];

export default function ContractsPage() {
  const { data: contracts, isLoading, mutate } = useContracts();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!contracts) return [];
    let result = contracts;
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.client.name.toLowerCase().includes(q),
      );
    }
    return result;
  }, [contracts, statusFilter, search]);

  const counts = useMemo(() => {
    if (!contracts) return {} as Record<string, number>;
    const map: Record<string, number> = { all: contracts.length };
    for (const c of contracts) {
      map[c.status] = (map[c.status] ?? 0) + 1;
    }
    return map;
  }, [contracts]);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Excluir contrato "${name}"?`)) return;
    await api.delete(`/api/v1/contracts/${id}`);
    mutate();
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contratos"
        description="Contratos ativos e historico"
        actions={
          <Link href="/contracts/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Contrato
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por contrato ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map(({ label, value }) => (
            <Button
              key={value}
              variant={statusFilter === value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(value)}
            >
              {label}
              {counts[value] != null && (
                <span className="ml-1 text-xs opacity-70">({counts[value] ?? 0})</span>
              )}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contrato</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>MRR</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum contrato encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((contract) => {
                  const totalSlots = contract.contract_roles.reduce(
                    (sum, cr) => sum + cr.quantity,
                    0,
                  );
                  return (
                    <TableRow key={contract.id}>
                      <TableCell>
                        <Link
                          href={`/contracts/${contract.id}`}
                          className="font-medium hover:underline"
                        >
                          {contract.name}
                        </Link>
                        {contract.plan_type && (
                          <p className="text-xs text-muted-foreground">
                            {contract.plan_type}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>{contract.client.name}</TableCell>
                      <TableCell>
                        <StatusBadge status={contract.status} />
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(contract.start_date).toLocaleDateString("pt-BR")}{" "}
                        -{" "}
                        {new Date(contract.end_date).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>{formatCurrency(contract.mrr)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {totalSlots} vaga{totalSlots !== 1 ? "s" : ""}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Link href={`/contracts/${contract.id}/edit`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-600"
                            onClick={() => handleDelete(contract.id, contract.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
