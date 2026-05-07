"use client";

import { Rocket, UserCheck, UserMinus } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useUtilization } from "@/hooks/use-dashboard";
import type { CapacityPlanningData } from "@/lib/types";

function fmtNum(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(1);
}

interface CapacitySummaryCardsProps {
  capacity: CapacityPlanningData | undefined;
  isLoading: boolean;
}

export function CapacitySummaryCards({
  capacity,
  isLoading,
}: CapacitySummaryCardsProps) {
  const { data: utilizationData } = useUtilization();
  const utilization = utilizationData?.data;
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (!capacity) {
    return null;
  }

  if (capacity.roles.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Nenhum dado de capacidade para este mes.
      </p>
    );
  }

  const totalUnfilled = capacity.roles.reduce(
    (sum, r) => sum + r.unfilled_slots,
    0,
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Precisamos
          </h3>
          <p className="text-2xl font-bold">
            {fmtNum(capacity.totals.total_demand)} vagas
          </p>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {capacity.roles
            .filter((r) => r.demand_slots > 0)
            .map((r) => (
              <div
                key={r.role_id}
                className="flex items-center justify-between text-sm"
              >
                <span>{r.role_name}</span>
                <span className="font-medium">{fmtNum(r.demand_slots)}</span>
              </div>
            ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Temos</h3>
          <p className="text-2xl font-bold">
            {capacity.totals.total_people} pessoas
          </p>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {capacity.roles.map((r) => {
            const total = r.supply_allocated + r.supply_available;
            if (total === 0) return null;
            return (
              <div
                key={r.role_id}
                className="flex items-center justify-between text-sm"
              >
                <span>{r.role_name}</span>
                <span className="font-medium">
                  <span>{r.supply_allocated} alocados</span>
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    + {r.supply_available} provisionados ={" "}
                  </span>
                  <span>{total}</span>
                </span>
              </div>
            );
          })}
          {utilization && (
            <div className="mt-3 grid grid-cols-3 gap-2 border-t pt-3">
              <div className="flex flex-col items-center gap-1 text-center">
                <UserCheck className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-semibold">
                  {utilization.fully_allocated}
                </span>
                <span className="text-[11px] text-muted-foreground leading-tight">
                  Totalmente alocados
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <Rocket className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-semibold">
                  {utilization.provisioned}
                </span>
                <span className="text-[11px] text-muted-foreground leading-tight">
                  Provisionadas
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <UserMinus className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-semibold">
                  {utilization.on_bench}
                </span>
                <span className="text-[11px] text-muted-foreground leading-tight">
                  No bench
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Vagas em aberto</h3>
          <p className="text-2xl font-bold">{fmtNum(totalUnfilled)}</p>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {capacity.roles.map((r) => {
            if (r.unfilled_slots === 0) return null;
            return (
              <div
                key={r.role_id}
                className="flex items-center justify-between text-sm"
              >
                <span>{r.role_name}</span>
                <span className="font-medium text-red-600">
                  {fmtNum(r.unfilled_slots)}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
