"use client";

import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  addWeeks,
  formatWeekLabel,
  formatYmd,
  parseYmd,
  todayWeekStart,
} from "@/lib/week";

interface WeekSelectorProps {
  week: string; // YYYY-MM-DD (Monday)
  onChange: (week: string) => void;
}

export function WeekSelector({ week, onChange }: WeekSelectorProps) {
  const current = parseYmd(week);
  const today = todayWeekStart();
  const isCurrent = formatYmd(current) === formatYmd(today);

  const shift = (delta: number) =>
    onChange(formatYmd(addWeeks(current, delta)));

  return (
    <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => shift(-1)}
        aria-label="Semana anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-2 px-2">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium tabular-nums">
          {formatWeekLabel(current)}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => shift(1)}
        aria-label="Próxima semana"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      {!isCurrent && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() => onChange(formatYmd(today))}
        >
          Hoje
        </Button>
      )}
    </div>
  );
}
