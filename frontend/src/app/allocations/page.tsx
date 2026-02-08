"use client";

import { useState } from "react";
import Link from "next/link";
import { format, differenceInDays, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PageHeader } from "@/components/layout/page-header";
import { useTimeline } from "@/hooks/use-dashboard";
import { getClientColor } from "@/lib/constants";

export default function AllocationsPage() {
  const [rangeMonths, setRangeMonths] = useState(6);
  const [offset, setOffset] = useState(0);

  const today = new Date();
  const rangeStart = addMonths(subMonths(today, 1), offset);
  const rangeEnd = addMonths(rangeStart, rangeMonths);

  const from = format(rangeStart, "yyyy-MM-dd");
  const to = format(rangeEnd, "yyyy-MM-dd");
  const { data } = useTimeline(from, to);

  const people = data?.data?.people || [];
  const totalDays = differenceInDays(rangeEnd, rangeStart);

  const months: { label: string; offset: number; width: number }[] = [];
  const cursor = new Date(rangeStart);
  while (cursor < rangeEnd) {
    const monthStart = cursor < rangeStart ? rangeStart : new Date(cursor);
    const nextMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    const monthEnd = nextMonth > rangeEnd ? rangeEnd : nextMonth;
    const mOffset =
      (differenceInDays(monthStart, rangeStart) / totalDays) * 100;
    const mWidth = (differenceInDays(monthEnd, monthStart) / totalDays) * 100;
    months.push({
      label: format(monthStart, "MMM yyyy", { locale: ptBR }),
      offset: mOffset,
      width: mWidth,
    });
    cursor.setTime(nextMonth.getTime());
  }

  const todayOffset =
    today >= rangeStart && today <= rangeEnd
      ? (differenceInDays(today, rangeStart) / totalDays) * 100
      : -1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timeline de Alocacoes"
        description="Visualizacao completa de alocacoes por periodo"
        actions={
          <div className="flex gap-2">
            <Link href="/allocations/people">
              <Button variant="outline">Por Pessoa</Button>
            </Link>
            <Link href="/allocations/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Alocacao
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOffset((o) => o - rangeMonths)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOffset(0)}
        >
          Hoje
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOffset((o) => o + rangeMonths)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="flex gap-1">
          {[3, 6, 12].map((m) => (
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
        <span className="text-sm text-muted-foreground">
          {format(rangeStart, "MMM yyyy", { locale: ptBR })} -{" "}
          {format(rangeEnd, "MMM yyyy", { locale: ptBR })}
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {people.length} pessoas | {people.reduce((s, p) => s + p.allocations.length, 0)} alocacoes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <div className="space-y-0">
              {/* Month headers */}
              <div className="relative mb-2 h-6 ml-36">
                {months.map((m, i) => (
                  <div
                    key={i}
                    className="absolute text-xs font-medium text-muted-foreground capitalize border-l border-border pl-1"
                    style={{ left: `${m.offset}%`, width: `${m.width}%` }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>

              {/* People rows */}
              {people.map((person) => (
                <div
                  key={person.person_id}
                  className="flex items-center gap-2 hover:bg-accent/50 rounded"
                >
                  <Link
                    href={`/people/${person.person_id}`}
                    className="w-36 flex-shrink-0 truncate text-sm hover:underline px-1"
                  >
                    {person.person_name}
                  </Link>
                  <div className="relative h-8 flex-1 rounded bg-muted/30 border-b border-border">
                    {todayOffset >= 0 && (
                      <div
                        className="absolute top-0 h-full w-px bg-red-400 z-10"
                        style={{ left: `${todayOffset}%` }}
                      />
                    )}
                    {person.allocations.map((alloc) => {
                      const allocStart = new Date(alloc.start_date);
                      const allocEnd = new Date(alloc.end_date);
                      const start = Math.max(
                        0,
                        (differenceInDays(allocStart, rangeStart) / totalDays) *
                          100,
                      );
                      const end = Math.min(
                        100,
                        (differenceInDays(allocEnd, rangeStart) / totalDays) *
                          100,
                      );
                      const barWidth = end - start;
                      if (barWidth <= 0) return null;

                      return (
                        <Tooltip key={alloc.allocation_id}>
                          <TooltipTrigger asChild>
                            <div
                              className="absolute top-1 h-6 rounded text-[10px] text-white font-medium flex items-center px-1.5 overflow-hidden cursor-pointer shadow-sm"
                              style={{
                                left: `${start}%`,
                                width: `${barWidth}%`,
                                backgroundColor: getClientColor(
                                  alloc.client_name,
                                ),
                                opacity: alloc.percentage < 100 ? 0.75 : 1,
                              }}
                            >
                              <span className="truncate">
                                {alloc.client_name}
                                {alloc.percentage < 100 &&
                                  ` (${alloc.percentage}%)`}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">
                              {alloc.contract_name}
                            </p>
                            <p>
                              {alloc.client_name} - {alloc.role_name}
                            </p>
                            <p>
                              {alloc.percentage}% |{" "}
                              {new Date(alloc.start_date).toLocaleDateString(
                                "pt-BR",
                              )}{" "}
                              -{" "}
                              {new Date(alloc.end_date).toLocaleDateString(
                                "pt-BR",
                              )}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              ))}

              {people.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhuma pessoa cadastrada.
                </p>
              )}
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  );
}
