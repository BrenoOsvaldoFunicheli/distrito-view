"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarPlus,
  Check,
  ChevronDown,
  ChevronUp,
  Maximize2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpcomingNeeds } from "@/hooks/use-dashboard";
import { RoleBadge } from "@/components/shared/role-badge";
import type { UpcomingNeed } from "@/lib/types";

interface ContractGroup {
  contract_name: string;
  client_name: string;
  start_date: string;
  end_date: string;
  is_future_contract: boolean;
  needs: UpcomingNeed[];
}

function renderContractGroup([contractId, group]: [string, ContractGroup]) {
  const allFilled = group.needs.every(
    (n) => n.filled_quantity >= n.needed_quantity,
  );
  const allEmpty = group.needs.every((n) => n.filled_quantity === 0);
  const hasLate = group.needs.some((n) => n.days_until_start < 0);
  let statusBadge: React.ReactNode = null;
  if (hasLate) {
    statusBadge = (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-800">
        <AlertTriangle className="h-3 w-3" />
        Atrasado
      </span>
    );
  } else if (allFilled) {
    statusBadge = (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-800">
        <Check className="h-3 w-3" />
        Certo
      </span>
    );
  } else if (allEmpty) {
    statusBadge = (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-medium text-yellow-800">
        <AlertTriangle className="h-3 w-3" />
        Alocação em andamento
      </span>
    );
  }
  return (
    <div
      key={contractId}
      className="rounded-lg border p-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link
            href={`/contracts/${contractId}`}
            className="block font-medium hover:underline"
          >
            {group.contract_name}
          </Link>
          <p className="text-xs text-muted-foreground">
            {group.client_name} |{" "}
            {new Date(group.start_date).toLocaleDateString("pt-BR")} -{" "}
            {new Date(group.end_date).toLocaleDateString("pt-BR")}
          </p>
        </div>
        {statusBadge}
      </div>
      <div className="mt-2 space-y-1">
        {group.needs.map((need) => {
          const days = need.days_until_start;
          const isLate = days < 0;
          const startsToday = days === 0;
          const startBadgeClass = isLate
            ? "bg-red-100 text-red-800"
            : startsToday
              ? "bg-orange-100 text-orange-800"
              : days <= 14
                ? "bg-yellow-100 text-yellow-800"
                : days <= 20
                  ? "bg-blue-100 text-blue-800"
                  : "bg-green-100 text-green-800";
          const startLabel = isLate
            ? `• Atrasado ${Math.abs(days)} dia${Math.abs(days) === 1 ? "" : "s"}`
            : startsToday
              ? "• Começa hoje"
              : `• Início em ${days} dia${days === 1 ? "" : "s"}`;
          return (
            <div
              key={need.contract_role_id}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <RoleBadge name={need.role_name} muted />
                <span className="text-muted-foreground">
                  {need.filled_quantity}/{need.needed_quantity} (
                  {need.allocation_percentage}%)
                </span>
                {!allFilled && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${startBadgeClass}`}
                  >
                    {startLabel}
                  </span>
                )}
              </div>
              {need.filled_quantity < need.needed_quantity && (
                <Link
                  href={`/allocations/new?contract_role_id=${need.contract_role_id}`}
                >
                  <Button size="sm" variant="outline">
                    Alocar
                  </Button>
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface UpcomingNeedsProps {
  expanded?: boolean;
  onToggleExpand?: (v: boolean) => void;
}

export function UpcomingNeeds({ expanded: expandedProp, onToggleExpand }: UpcomingNeedsProps = {}) {
  const { data } = useUpcomingNeeds(365);
  const needs = data?.data || [];
  const [expandedLocal, setExpandedLocal] = useState(false);
  const expanded = expandedProp ?? expandedLocal;
  const setExpanded = onToggleExpand ?? setExpandedLocal;
  const [fullscreen, setFullscreen] = useState(false);

  const grouped = needs.reduce(
    (acc, need) => {
      const key = need.contract_id;
      if (!acc[key]) {
        acc[key] = {
          contract_name: need.contract_name,
          client_name: need.client_name,
          start_date: need.start_date,
          end_date: need.end_date,
          is_future_contract: need.is_future_contract,
          needs: [],
        };
      }
      acc[key].needs.push(need);
      return acc;
    },
    {} as Record<
      number,
      {
        contract_name: string;
        client_name: string;
        start_date: string;
        end_date: string;
        is_future_contract: boolean;
        needs: typeof needs;
      }
    >,
  );

  const allEntries = Object.entries(grouped);

  const groupRank = (g: ContractGroup): number => {
    // 0 = atrasado | 1 = sem alocação | 2 = parcial | 3 = totalmente preenchido
    if (g.needs.some((n) => n.days_until_start < 0)) return 0;
    if (g.needs.every((n) => n.filled_quantity === 0)) return 1;
    if (g.needs.every((n) => n.filled_quantity >= n.needed_quantity)) return 3;
    return 2;
  };

  // 3 buckets: em atraso | contratos pra alocar | contratos futuros
  const lateEntries = allEntries.filter(
    ([, g]) => groupRank(g) === 0,
  );
  const toAllocateEntries = allEntries
    .filter(([, g]) => {
      if (groupRank(g) === 0) return false;
      if (!g.is_future_contract) return true;
      // futuros sem ninguém alocado também precisam de atenção aqui
      return groupRank(g) === 1;
    })
    .sort((a, b) => groupRank(a[1]) - groupRank(b[1]));
  const futureEntries = allEntries.filter(([, g]) => {
    if (!g.is_future_contract) return false;
    if (groupRank(g) === 0) return false;
    const rank = groupRank(g);
    return rank === 2 || rank === 3;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarPlus className="h-5 w-5" />
          Necessidades de Alocacao
        </CardTitle>
        <CardDescription>Vagas abertas em contratos</CardDescription>
      </CardHeader>
      <CardContent>
        {allEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todas as vagas estao preenchidas.
          </p>
        ) : (
          <div
            className={`space-y-4 ${expanded ? "" : "max-h-96 overflow-y-auto"}`}
          >
            {lateEntries.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-red-700">
                  Em atraso
                </p>
                {(expanded ? lateEntries : lateEntries.slice(0, 5)).map(
                  renderContractGroup,
                )}
              </div>
            )}
            {toAllocateEntries.length > 0 && (
              <div
                className={`space-y-2 ${lateEntries.length > 0 ? "border-t pt-3" : ""}`}
              >
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Contratos pra alocar
                </p>
                {(expanded
                  ? toAllocateEntries
                  : toAllocateEntries.slice(0, 8)
                ).map(renderContractGroup)}
              </div>
            )}
            {futureEntries.length > 0 && (
              <div className="space-y-2 border-t pt-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Contratos futuros
                </p>
                {(expanded
                  ? futureEntries
                  : futureEntries.slice(0, 5)
                ).map(renderContractGroup)}
              </div>
            )}
          </div>
        )}
        {Object.keys(grouped).length > 1 && (
          <div className="mt-3 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="mr-1 h-4 w-4" />
                  Recolher
                </>
              ) : (
                <>
                  <ChevronDown className="mr-1 h-4 w-4" />
                  Expandir ({Object.keys(grouped).length} contratos)
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFullscreen(true)}
              title="Ver amplo"
            >
              <Maximize2 className="mr-1 h-4 w-4" />
              Ver amplo
            </Button>
          </div>
        )}
      </CardContent>
      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5" />
              Necessidades de Alocação — {Object.keys(grouped).length} contratos
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {lateEntries.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-red-700">
                  Em atraso
                </p>
                {lateEntries.map(renderContractGroup)}
              </div>
            )}
            {toAllocateEntries.length > 0 && (
              <div
                className={`space-y-2 ${lateEntries.length > 0 ? "border-t pt-3" : ""}`}
              >
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Contratos pra alocar
                </p>
                {toAllocateEntries.map(renderContractGroup)}
              </div>
            )}
            {futureEntries.length > 0 && (
              <div className="space-y-2 border-t pt-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Contratos futuros
                </p>
                {futureEntries.map(renderContractGroup)}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
