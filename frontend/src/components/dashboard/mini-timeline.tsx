"use client";

import { format, differenceInDays, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTimeline } from "@/hooks/use-dashboard";
import { getClientColor } from "@/lib/constants";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function MiniTimeline() {
  const today = new Date();
  const from = format(today, "yyyy-MM-dd");
  const to = format(addMonths(today, 4), "yyyy-MM-dd");
  const { data } = useTimeline(from, to);

  const people = data?.data?.people || [];
  const rangeStart = new Date(from);
  const rangeEnd = new Date(to);
  const totalDays = differenceInDays(rangeEnd, rangeStart);

  const months: { label: string; offset: number; width: number }[] = [];
  const cursor = new Date(rangeStart);
  while (cursor < rangeEnd) {
    const monthStart = cursor < rangeStart ? rangeStart : new Date(cursor);
    const nextMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    const monthEnd = nextMonth > rangeEnd ? rangeEnd : nextMonth;
    const offset =
      (differenceInDays(monthStart, rangeStart) / totalDays) * 100;
    const width = (differenceInDays(monthEnd, monthStart) / totalDays) * 100;
    months.push({
      label: format(monthStart, "MMM yyyy", { locale: ptBR }),
      offset,
      width,
    });
    cursor.setTime(nextMonth.getTime());
  }

  const todayOffset = (differenceInDays(today, rangeStart) / totalDays) * 100;
  const filteredPeople = people.filter((p) => p.allocations.length > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline de Alocacoes</CardTitle>
        <CardDescription>
          Proximos 4 meses ({format(rangeStart, "MMM yyyy", { locale: ptBR })} -{" "}
          {format(rangeEnd, "MMM yyyy", { locale: ptBR })})
        </CardDescription>
      </CardHeader>
      <CardContent>
        {filteredPeople.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma alocacao encontrada no periodo.
          </p>
        ) : (
          <TooltipProvider>
            <div className="space-y-0">
              <div className="relative mb-2 h-6">
                {months.map((m, i) => (
                  <div
                    key={i}
                    className="absolute text-xs font-medium text-muted-foreground capitalize"
                    style={{ left: `${m.offset}%`, width: `${m.width}%` }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>

              {filteredPeople.map((person) => (
                <div key={person.person_id} className="flex items-center gap-2">
                  <div className="w-32 flex-shrink-0 truncate text-sm">
                    {person.person_name}
                  </div>
                  <div className="relative h-7 flex-1 rounded bg-muted/50">
                    <div
                      className="absolute top-0 h-full w-px bg-red-400 z-10"
                      style={{ left: `${todayOffset}%` }}
                    />
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
                              className="absolute top-1 h-5 rounded text-[10px] text-white font-medium flex items-center px-1 overflow-hidden cursor-pointer"
                              style={{
                                left: `${start}%`,
                                width: `${barWidth}%`,
                                backgroundColor: getClientColor(
                                  alloc.client_name,
                                ),
                                opacity: alloc.percentage < 100 ? 0.7 : 1,
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
            </div>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}
