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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { RoleBadge } from "@/components/shared/role-badge";
import { PercentageBadge } from "@/components/shared/percentage-badge";
import { useCapacityPlanning } from "@/hooks/use-dashboard";
import { getClientColor } from "@/lib/constants";
import type { CapacityRoleSummary } from "@/lib/types";

export default function CapacityPlanningPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const { data, isLoading } = useCapacityPlanning(year, month);
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

      {/* Month Navigation */}
      <div className="flex items-center gap-2">
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
        <span className="text-lg font-semibold ml-2">{capitalizedMonth}</span>
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
              title="Demanda Total"
              value={`${capacity.totals.total_demand} vagas`}
              icon={TrendingUp}
            />
            <StatsCard
              title="Pessoas Alocadas"
              value={capacity.totals.total_allocated}
              icon={UserCheck}
            />
            <StatsCard
              title="Pessoas Disponiveis"
              value={capacity.totals.total_available}
              icon={Users}
              description={`${capacity.totals.total_bench} no bench`}
            />
            <StatsCard
              title="Gap"
              value={
                capacity.totals.total_gap > 0
                  ? `+${capacity.totals.total_gap}`
                  : `${capacity.totals.total_gap}`
              }
              icon={AlertTriangle}
              description={
                capacity.totals.total_gap > 0
                  ? "Vagas abertas"
                  : "Equipe suficiente"
              }
            />
          </div>

          {/* Per-Role Sections */}
          <div className="space-y-4">
            {capacity.roles.map((role) => (
              <RoleCard key={role.role_id} role={role} />
            ))}
          </div>

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

function RoleCard({ role }: { role: CapacityRoleSummary }) {
  const gapColor =
    role.gap > 0
      ? "text-red-600"
      : role.gap < 0
        ? "text-green-600"
        : "text-muted-foreground";

  const becomingFreeCount = role.supply_details.filter(
    (p) => p.becoming_free,
  ).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <RoleBadge name={role.role_name} />
          <div className="flex flex-wrap gap-4 text-sm">
            <span>
              Demanda: <strong>{role.demand_slots}</strong>
            </span>
            <span>
              Alocados: <strong>{role.supply_allocated}</strong>
            </span>
            <span>
              Disponiveis: <strong>{role.supply_available}</strong>
            </span>
            <span className={gapColor}>
              Gap:{" "}
              <strong>{role.gap > 0 ? `+${role.gap}` : role.gap}</strong>
            </span>
            {becomingFreeCount > 0 && (
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                {becomingFreeCount} saindo
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="demanda">
          <TabsList>
            <TabsTrigger value="demanda">
              Demanda ({role.demand_details.length})
            </TabsTrigger>
            <TabsTrigger value="equipe">
              Equipe ({role.supply_details.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="demanda">
            {role.demand_details.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                Nenhuma demanda para esta role neste mes.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm mt-2">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-3 py-2 font-medium">
                        Contrato
                      </th>
                      <th className="text-left px-3 py-2 font-medium">
                        Cliente
                      </th>
                      <th className="text-center px-3 py-2 font-medium">
                        Vagas
                      </th>
                      <th className="text-center px-3 py-2 font-medium">
                        Preenchidas
                      </th>
                      <th className="text-center px-3 py-2 font-medium">
                        Abertas
                      </th>
                      <th className="text-left px-3 py-2 font-medium">
                        Fim do Contrato
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {role.demand_details.map((d) => (
                      <tr
                        key={`${d.contract_id}-${d.allocation_percentage}`}
                        className="border-b hover:bg-accent/30"
                      >
                        <td className="px-3 py-2">
                          <Link
                            href={`/contracts/${d.contract_id}`}
                            className="hover:underline"
                          >
                            {d.contract_name}
                          </Link>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {d.client_name}
                        </td>
                        <td className="px-3 py-2 text-center">{d.quantity}</td>
                        <td className="px-3 py-2 text-center">{d.filled}</td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={
                              d.unfilled > 0
                                ? "text-red-600 font-medium"
                                : "text-green-600"
                            }
                          >
                            {d.unfilled}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {new Date(d.contract_end).toLocaleDateString("pt-BR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="equipe">
            {role.supply_details.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                Nenhuma pessoa com esta role.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm mt-2">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-3 py-2 font-medium">
                        Pessoa
                      </th>
                      <th className="text-left px-3 py-2 font-medium">
                        Empresa
                      </th>
                      <th className="text-center px-3 py-2 font-medium">
                        Alocacao
                      </th>
                      <th className="text-left px-3 py-2 font-medium">
                        Contratos no Mes
                      </th>
                      <th className="text-center px-3 py-2 font-medium">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {role.supply_details.map((p) => (
                      <tr
                        key={p.person_id}
                        className={`border-b hover:bg-accent/30 ${p.becoming_free ? "bg-amber-50/50" : ""}`}
                      >
                        <td className="px-3 py-2">
                          <Link
                            href={`/people/${p.person_id}`}
                            className="hover:underline"
                          >
                            {p.person_name}
                          </Link>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {p.person_company}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <PercentageBadge percentage={p.allocation_in_month} />
                        </td>
                        <td className="px-3 py-2">
                          {p.current_contracts.length === 0 ? (
                            <span className="text-muted-foreground">-</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {p.current_contracts.map((c, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded text-white"
                                  style={{
                                    backgroundColor: getClientColor(
                                      c.client_name,
                                    ),
                                  }}
                                >
                                  {c.client_name} ({c.percentage}%)
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {p.becoming_free ? (
                            <Badge
                              variant="outline"
                              className="text-amber-600 border-amber-300"
                            >
                              Saindo{" "}
                              {p.allocation_ends &&
                                new Date(
                                  p.allocation_ends,
                                ).toLocaleDateString("pt-BR")}
                            </Badge>
                          ) : p.status === "allocated" ? (
                            <Badge
                              variant="outline"
                              className="text-green-600 border-green-300"
                            >
                              Alocado
                            </Badge>
                          ) : p.status === "partial" ? (
                            <Badge
                              variant="outline"
                              className="text-blue-600 border-blue-300"
                            >
                              Parcial
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-gray-600 border-gray-300"
                            >
                              Bench
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
