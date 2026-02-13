"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Users,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { RoleBadge } from "@/components/shared/role-badge";
import { useCapacityPlanning } from "@/hooks/use-dashboard";
import type { CapacityRoleSummary } from "@/lib/types";

function fmtNum(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(1);
}

export default function CapacityPlanningPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [company, setCompany] = useState<string>("");

  const { data, isLoading } = useCapacityPlanning(year, month, company || undefined);
  const capacity = data?.data;

  const goToMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  };

  const resetToToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
  };

  const monthLabel = format(new Date(year, month - 1), "MMMM yyyy", {
    locale: ptBR,
  });
  const capitalizedMonth =
    monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planejamento de Capacidade"
        description="Confronto entre demanda dos contratos e oferta de pessoas"
      />

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => goToMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={resetToToday}>
            Hoje
          </Button>
          <Button variant="outline" size="sm" onClick={() => goToMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <span className="text-lg font-semibold">{capitalizedMonth}</span>
        <select
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Todas empresas</option>
          <option value="Distrito">Distrito</option>
          <option value="Dojo">Dojo</option>
          <option value="FCamara">FCamara</option>
        </select>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      )}

      {/* Summary Cards */}
      {capacity && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Precisamos"
              value={`${fmtNum(capacity.totals.total_demand)} vagas`}
              icon={TrendingUp}
            />
            <StatsCard
              title="Temos"
              value={`${capacity.totals.total_people} pessoas`}
              icon={Users}
            />
            <StatsCard
              title="Alocados"
              value={capacity.totals.total_allocated}
              icon={UserCheck}
              description={`${capacity.totals.total_bench} no bench`}
            />
            <StatsCard
              title="Gap"
              value={(() => {
                const gap = capacity.totals.total_demand - capacity.totals.total_people;
                return gap > 0 ? `+${fmtNum(gap)}` : fmtNum(gap);
              })()}
              icon={AlertTriangle}
              description={
                capacity.totals.total_demand - capacity.totals.total_people > 0
                  ? "Faltam pessoas"
                  : "Equipe suficiente"
              }
            />
          </div>

          {/* Demand by Contract */}
          <ContractDemandTable roles={capacity.roles} />

          {capacity.roles.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nenhum dado de capacidade para este mes.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function ContractDemandTable({ roles }: { roles: CapacityRoleSummary[] }) {
  // Reagrupa demand_details de todas as roles por contrato
  const contractMap = new Map<
    number,
    {
      contract_id: number;
      contract_name: string;
      client_name: string;
      contract_end: string;
      contract_status: string;
      roles: { role_name: string; fte: number; allocation_percentage: number; filled: number; unfilled: number }[];
    }
  >();

  for (const role of roles) {
    for (const d of role.demand_details) {
      if (!contractMap.has(d.contract_id)) {
        contractMap.set(d.contract_id, {
          contract_id: d.contract_id,
          contract_name: d.contract_name,
          client_name: d.client_name,
          contract_end: d.contract_end,
          contract_status: d.contract_status,
          roles: [],
        });
      }
      const fte = d.fte ?? (d.quantity * d.allocation_percentage / 100);
      contractMap.get(d.contract_id)!.roles.push({
        role_name: role.role_name,
        fte,
        allocation_percentage: d.allocation_percentage,
        filled: d.filled,
        unfilled: d.unfilled,
      });
    }
  }

  const contracts = Array.from(contractMap.values()).sort((a, b) =>
    a.contract_name.localeCompare(b.contract_name),
  );

  if (contracts.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <h3 className="text-sm font-semibold">Vagas por Contrato</h3>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-3 py-2 font-medium">Contrato</th>
                <th className="text-left px-3 py-2 font-medium">Cliente</th>
                <th className="text-left px-3 py-2 font-medium">Vagas</th>
                <th className="text-center px-3 py-2 font-medium">Total</th>
                <th className="text-left px-3 py-2 font-medium">Fim</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => {
                const totalFte = c.roles.reduce((s, r) => s + r.fte, 0);
                return (
                  <tr key={c.contract_id} className="border-b hover:bg-accent/30">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <Link href={`/contracts/${c.contract_id}`} className="hover:underline">
                          {c.contract_name}
                        </Link>
                        {c.contract_status === "pipeline" && (
                          <Badge variant="outline" className="text-purple-600 border-purple-300 text-[10px] px-1 py-0">
                            Pipeline
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{c.client_name}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {c.roles.map((r) => (
                          <RoleBadge
                            key={r.role_name}
                            name={`${r.role_name} (${fmtNum(r.fte)})`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">{fmtNum(totalFte)}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {new Date(c.contract_end).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

