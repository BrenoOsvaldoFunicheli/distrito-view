"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  format,
  differenceInDays,
  addMonths,
  subMonths,
  startOfMonth,
  isWithinInterval,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { RoleBadge } from "@/components/shared/role-badge";
import { useContracts } from "@/hooks/use-contracts";
import { getClientColor } from "@/lib/constants";
import type { Contract } from "@/lib/types";

type GroupBy = "client" | "none" | "status" | "unified";
type SortBy = "start" | "end" | "client" | "value";

export default function ProjectsGanttPage() {
  const [rangeMonths, setRangeMonths] = useState(12);
  const [offset, setOffset] = useState(0);
  const [groupBy, setGroupBy] = useState<GroupBy>("client");
  const [sortBy, setSortBy] = useState<SortBy>("start");
  const [showEnded, setShowEnded] = useState(false);

  const { data: contracts, isLoading } = useContracts();

  const today = new Date();
  const rangeStart = startOfMonth(addMonths(subMonths(today, 2), offset));
  const rangeEnd = addMonths(rangeStart, rangeMonths);
  const totalDays = differenceInDays(rangeEnd, rangeStart);

  // Build month columns
  const months = useMemo(() => {
    const result: {
      label: string;
      shortLabel: string;
      offset: number;
      width: number;
      isCurrentMonth: boolean;
    }[] = [];
    const cursor = new Date(rangeStart);
    while (cursor < rangeEnd) {
      const monthStart = cursor < rangeStart ? rangeStart : new Date(cursor);
      const nextMonth = new Date(
        cursor.getFullYear(),
        cursor.getMonth() + 1,
        1,
      );
      const monthEnd = nextMonth > rangeEnd ? rangeEnd : nextMonth;
      const mOffset =
        (differenceInDays(monthStart, rangeStart) / totalDays) * 100;
      const mWidth =
        (differenceInDays(monthEnd, monthStart) / totalDays) * 100;
      const isCurrentMonth =
        today.getMonth() === cursor.getMonth() &&
        today.getFullYear() === cursor.getFullYear();
      result.push({
        label: format(monthStart, "MMM yyyy", { locale: ptBR }),
        shortLabel: format(monthStart, "MMM", { locale: ptBR }),
        offset: mOffset,
        width: mWidth,
        isCurrentMonth,
      });
      cursor.setTime(nextMonth.getTime());
    }
    return result;
  }, [rangeStart, rangeEnd, totalDays, today]);

  const todayOffset =
    today >= rangeStart && today <= rangeEnd
      ? (differenceInDays(today, rangeStart) / totalDays) * 100
      : -1;

  // Filter and sort contracts
  const filteredContracts = useMemo(() => {
    if (!contracts) return [];
    let result = contracts.filter((c) => {
      const cStart = new Date(c.start_date);
      const cEnd = new Date(c.end_date);
      // Must overlap with visible range
      if (cEnd < rangeStart || cStart > rangeEnd) return false;
      // Filter ended
      if (!showEnded && cEnd < today && c.status !== "active") return false;
      if (c.status === "cancelled") return false;
      return true;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case "start":
          return a.start_date.localeCompare(b.start_date);
        case "end":
          return a.end_date.localeCompare(b.end_date);
        case "client":
          return a.client.name.localeCompare(b.client.name);
        case "value":
          return (b.mrr || 0) - (a.mrr || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [contracts, rangeStart, rangeEnd, showEnded, sortBy, today]);

  // Group contracts
  const groups = useMemo(() => {
    if (groupBy === "none") {
      return [{ label: "", contracts: filteredContracts }];
    }

    const map = new Map<string, Contract[]>();
    for (const c of filteredContracts) {
      const key = groupBy === "client" ? c.client.name : c.status;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, contracts]) => ({ label, contracts }));
  }, [filteredContracts, groupBy]);

  // Unified client timeline
  const unifiedClients = useMemo(() => {
    if (groupBy !== "unified") return [];
    const map = new Map<
      string,
      {
        clientName: string;
        minStart: string;
        maxEnd: string;
        contractCount: number;
        totalMrr: number;
        totalSlots: number;
        contracts: Contract[];
      }
    >();
    for (const c of filteredContracts) {
      const name = c.client.name;
      const existing = map.get(name);
      if (!existing) {
        map.set(name, {
          clientName: name,
          minStart: c.start_date,
          maxEnd: c.end_date,
          contractCount: 1,
          totalMrr: c.mrr || 0,
          totalSlots: c.contract_roles.reduce((s, cr) => s + cr.quantity, 0),
          contracts: [c],
        });
      } else {
        if (c.start_date < existing.minStart) existing.minStart = c.start_date;
        if (c.end_date > existing.maxEnd) existing.maxEnd = c.end_date;
        existing.contractCount++;
        existing.totalMrr += c.mrr || 0;
        existing.totalSlots += c.contract_roles.reduce(
          (s, cr) => s + cr.quantity,
          0,
        );
        existing.contracts.push(c);
      }
    }
    const result = Array.from(map.values());
    result.sort((a, b) => {
      switch (sortBy) {
        case "start":
          return a.minStart.localeCompare(b.minStart);
        case "end":
          return a.maxEnd.localeCompare(b.maxEnd);
        case "client":
          return a.clientName.localeCompare(b.clientName);
        case "value":
          return b.totalMrr - a.totalMrr;
        default:
          return 0;
      }
    });
    return result;
  }, [filteredContracts, groupBy, sortBy]);

  const formatCurrency = (value: number | null) => {
    if (!value) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getContractBarStyle = (contract: Contract) => {
    const cStart = new Date(contract.start_date);
    const cEnd = new Date(contract.end_date);
    const start = Math.max(
      0,
      (differenceInDays(cStart, rangeStart) / totalDays) * 100,
    );
    const end = Math.min(
      100,
      (differenceInDays(cEnd, rangeStart) / totalDays) * 100,
    );
    const width = end - start;
    const isActive = isWithinInterval(today, {
      start: cStart,
      end: cEnd,
    });
    const isPast = cEnd < today;
    const isPipeline = contract.status === "pipeline";

    return { start, width, isActive, isPast, isPipeline };
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gantt de Projetos"
        description="Visualizacao temporal de todos os contratos"
      />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOffset((o) => o - rangeMonths)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setOffset(0)}>
            Hoje
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOffset((o) => o + rangeMonths)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Zoom */}
        <div className="flex gap-1">
          {[6, 12, 18, 24].map((m) => (
            <Button
              key={m}
              variant={rangeMonths === m ? "default" : "outline"}
              size="sm"
              onClick={() => setRangeMonths(m)}
            >
              {m}M
            </Button>
          ))}
        </div>

        {/* Group by */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Agrupar:</span>
          {(
            [
              ["client", "Cliente"],
              ["status", "Status"],
              ["none", "Nenhum"],
              ["unified", "Unificado"],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              variant={groupBy === value ? "default" : "outline"}
              size="sm"
              onClick={() => setGroupBy(value)}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Ordenar:</span>
          {(
            [
              ["start", "Inicio"],
              ["end", "Fim"],
              ["value", "Valor"],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              variant={sortBy === value ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy(value)}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Show ended */}
        <Button
          variant={showEnded ? "default" : "outline"}
          size="sm"
          onClick={() => setShowEnded(!showEnded)}
        >
          {showEnded ? "Ocultar encerrados" : "Mostrar encerrados"}
        </Button>

        <span className="text-sm text-muted-foreground ml-auto">
          {format(rangeStart, "MMM yyyy", { locale: ptBR })} -{" "}
          {format(rangeEnd, "MMM yyyy", { locale: ptBR })} |{" "}
          {filteredContracts.length} contratos
        </span>
      </div>

      {/* Gantt Chart */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <TooltipProvider delayDuration={100}>
              <div>
                {/* Month header */}
                <div className="flex items-center border-b pb-1 mb-1">
                  <div className="w-64 flex-shrink-0" />
                  <div className="relative h-8 flex-1">
                    {months.map((m, i) => (
                      <div
                        key={i}
                        className={`absolute text-xs font-medium capitalize border-l pl-1 flex items-end pb-1 ${
                          m.isCurrentMonth
                            ? "text-primary font-bold border-primary/30 bg-primary/5"
                            : "text-muted-foreground border-border"
                        }`}
                        style={{
                          left: `${m.offset}%`,
                          width: `${m.width}%`,
                          height: "100%",
                        }}
                      >
                        {rangeMonths <= 12 ? m.label : m.shortLabel}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Unified client rows */}
                {groupBy === "unified" &&
                  unifiedClients.map((uc) => {
                    const ucStart = new Date(uc.minStart);
                    const ucEnd = new Date(uc.maxEnd);
                    const start = Math.max(
                      0,
                      (differenceInDays(ucStart, rangeStart) / totalDays) * 100,
                    );
                    const end = Math.min(
                      100,
                      (differenceInDays(ucEnd, rangeStart) / totalDays) * 100,
                    );
                    const barWidth = end - start;
                    const color = getClientColor(uc.clientName);
                    const isPast = ucEnd < today;
                    const isActive = ucStart <= today && ucEnd >= today;

                    return (
                      <div
                        key={uc.clientName}
                        className="flex items-center hover:bg-accent/30 rounded transition-colors group"
                      >
                        <div className="w-64 flex-shrink-0 px-2 py-1">
                          <span className="text-sm font-medium truncate block">
                            {uc.clientName}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] text-muted-foreground">
                              {uc.contractCount} contrato
                              {uc.contractCount !== 1 ? "s" : ""}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              ·
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {formatCurrency(uc.totalMrr)}/mes
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              ·
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {uc.totalSlots} vaga
                              {uc.totalSlots !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>

                        <div className="relative h-10 flex-1">
                          {months.map((m, i) => (
                            <div
                              key={i}
                              className="absolute top-0 h-full border-l border-border/30"
                              style={{ left: `${m.offset}%` }}
                            />
                          ))}
                          {todayOffset >= 0 && (
                            <div
                              className="absolute top-0 h-full w-px bg-red-500/60 z-20"
                              style={{ left: `${todayOffset}%` }}
                            />
                          )}
                          {barWidth > 0 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className="absolute top-1.5 h-7 rounded-md flex items-center px-2 overflow-hidden cursor-default transition-shadow hover:shadow-md z-10"
                                  style={{
                                    left: `${start}%`,
                                    width: `${barWidth}%`,
                                    backgroundColor: color,
                                    opacity: isPast ? 0.45 : 1,
                                  }}
                                >
                                  {isActive && (
                                    <div
                                      className="absolute inset-0 bg-black/10 rounded-l-md"
                                      style={{
                                        width: `${Math.min(100, ((todayOffset - start) / barWidth) * 100)}%`,
                                      }}
                                    />
                                  )}
                                  <span className="relative text-[11px] text-white font-medium truncate">
                                    {uc.clientName}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent
                                side="bottom"
                                className="max-w-xs"
                              >
                                <div className="space-y-1.5">
                                  <p className="font-bold">{uc.clientName}</p>
                                  <p className="text-xs">
                                    {new Date(uc.minStart).toLocaleDateString(
                                      "pt-BR",
                                    )}{" "}
                                    -{" "}
                                    {new Date(uc.maxEnd).toLocaleDateString(
                                      "pt-BR",
                                    )}
                                  </p>
                                  <p className="text-xs">
                                    {uc.contractCount} contrato
                                    {uc.contractCount !== 1 ? "s" : ""} | MRR
                                    total: {formatCurrency(uc.totalMrr)} |{" "}
                                    {uc.totalSlots} vaga
                                    {uc.totalSlots !== 1 ? "s" : ""}
                                  </p>
                                  <div className="pt-1 border-t space-y-0.5">
                                    {uc.contracts.map((c) => (
                                      <p key={c.id} className="text-[11px]">
                                        {c.name} (
                                        {new Date(
                                          c.start_date,
                                        ).toLocaleDateString("pt-BR")}{" "}
                                        -{" "}
                                        {new Date(
                                          c.end_date,
                                        ).toLocaleDateString("pt-BR")}
                                        )
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    );
                  })}

                {/* Groups & Rows */}
                {groupBy !== "unified" &&
                  groups.map((group) => (
                    <div key={group.label || "__all"}>
                      {/* Group header */}
                      {group.label && (
                        <div className="flex items-center mt-3 mb-1">
                          <div className="w-64 flex-shrink-0 px-2">
                            <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                              {group.label}
                            </span>
                          </div>
                          <div className="flex-1 border-b border-dashed" />
                        </div>
                      )}

                      {/* Contract rows */}
                      {group.contracts.map((contract) => {
                        const bar = getContractBarStyle(contract);
                        const totalSlots = contract.contract_roles.reduce(
                          (sum, cr) => sum + cr.quantity,
                          0,
                        );
                        const color = getClientColor(contract.client.name);

                        return (
                          <div
                            key={contract.id}
                            className="flex items-center hover:bg-accent/30 rounded transition-colors group"
                          >
                            {/* Contract label */}
                            <div className="w-64 flex-shrink-0 px-2 py-1">
                              <Link
                                href={`/contracts/${contract.id}`}
                                className="text-sm font-medium hover:underline truncate block"
                              >
                                {contract.name}
                              </Link>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[11px] text-muted-foreground">
                                  {formatCurrency(contract.mrr)}/mes
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  ·
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  {totalSlots} vaga
                                  {totalSlots !== 1 ? "s" : ""}
                                </span>
                              </div>
                            </div>

                            {/* Bar area */}
                            <div className="relative h-10 flex-1">
                              {/* Grid lines */}
                              {months.map((m, i) => (
                                <div
                                  key={i}
                                  className="absolute top-0 h-full border-l border-border/30"
                                  style={{ left: `${m.offset}%` }}
                                />
                              ))}

                              {/* Today line */}
                              {todayOffset >= 0 && (
                                <div
                                  className="absolute top-0 h-full w-px bg-red-500/60 z-20"
                                  style={{ left: `${todayOffset}%` }}
                                />
                              )}

                              {/* Contract bar */}
                              {bar.width > 0 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Link
                                      href={`/contracts/${contract.id}`}
                                      className={`absolute top-1.5 h-7 rounded-md flex items-center px-2 overflow-hidden cursor-pointer transition-shadow hover:shadow-md z-10 ${bar.isPipeline ? "border-2 border-dashed" : ""}`}
                                      style={{
                                        left: `${bar.start}%`,
                                        width: `${bar.width}%`,
                                        backgroundColor: bar.isPipeline ? "transparent" : color,
                                        borderColor: bar.isPipeline ? color : undefined,
                                        opacity: bar.isPast ? 0.45 : bar.isPipeline ? 0.7 : 1,
                                      }}
                                    >
                                      {/* Progress indicator: filled portion up to today */}
                                      {bar.isActive && (
                                        <div
                                          className="absolute inset-0 bg-black/10 rounded-l-md"
                                          style={{
                                            width: `${Math.min(100, ((todayOffset - bar.start) / bar.width) * 100)}%`,
                                          }}
                                        />
                                      )}
                                      <span
                                        className="relative text-[11px] font-medium truncate"
                                        style={{ color: bar.isPipeline ? color : "white" }}
                                      >
                                        {contract.name}
                                      </span>
                                    </Link>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="bottom"
                                    className="max-w-xs"
                                  >
                                    <div className="space-y-1.5">
                                      <p className="font-bold">
                                        {contract.name}
                                      </p>
                                      <p className="text-xs">
                                        {contract.client.name} |{" "}
                                        <StatusBadge
                                          status={contract.status}
                                        />
                                      </p>
                                      <p className="text-xs">
                                        {new Date(
                                          contract.start_date,
                                        ).toLocaleDateString("pt-BR")}{" "}
                                        -{" "}
                                        {new Date(
                                          contract.end_date,
                                        ).toLocaleDateString("pt-BR")}{" "}
                                        ({contract.duration_months} meses)
                                      </p>
                                      <p className="text-xs">
                                        MRR: {formatCurrency(contract.mrr)} |
                                        Total:{" "}
                                        {formatCurrency(contract.total_value)}
                                      </p>
                                      {contract.contract_roles.length > 0 && (
                                        <div className="flex flex-wrap gap-1 pt-1">
                                          {contract.contract_roles.map(
                                            (cr) => (
                                              <RoleBadge
                                                key={cr.id}
                                                name={cr.role.name}
                                              />
                                            ),
                                          )}
                                        </div>
                                      )}
                                      {contract.plan_type && (
                                        <p className="text-[10px] text-muted-foreground">
                                          {contract.plan_type}
                                        </p>
                                      )}
                                      {contract.notes && (
                                        <p className="text-[10px] text-muted-foreground italic">
                                          {contract.notes}
                                        </p>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}

                {filteredContracts.length === 0 && (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    Nenhum contrato encontrado no periodo selecionado.
                  </p>
                )}

                {/* Legend */}
                <div className="flex items-center gap-4 mt-6 pt-4 border-t text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-red-500/60 rounded-sm" />
                    <span>Hoje</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-8 h-3 rounded-sm bg-primary opacity-45" />
                    <span>Encerrado</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-8 h-3 rounded-sm bg-primary relative overflow-hidden">
                      <div className="absolute inset-0 w-1/2 bg-black/10" />
                    </div>
                    <span>Em andamento (parte escura = progresso)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-8 h-3 rounded-sm bg-primary" />
                    <span>Futuro</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-8 h-3 rounded-sm border-2 border-dashed border-purple-500 opacity-70" />
                    <span>Pipeline</span>
                  </div>
                </div>
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
