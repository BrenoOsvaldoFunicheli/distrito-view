"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CapacityFilter {
  year: number;
  month: number;
  company: string;
}

interface CapacityFilterBarProps {
  value: CapacityFilter;
  onChange: (v: CapacityFilter) => void;
}

export function CapacityFilterBar({ value, onChange }: CapacityFilterBarProps) {
  const goToMonth = (delta: number) => {
    const d = new Date(value.year, value.month - 1 + delta, 1);
    onChange({ ...value, year: d.getFullYear(), month: d.getMonth() + 1 });
  };

  const resetToToday = () => {
    const today = new Date();
    onChange({
      ...value,
      year: today.getFullYear(),
      month: today.getMonth() + 1,
    });
  };

  const monthLabel = format(
    new Date(value.year, value.month - 1),
    "MMMM yyyy",
    { locale: ptBR },
  );
  const capitalizedMonth =
    monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  return (
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
        value={value.company}
        onChange={(e) => onChange({ ...value, company: e.target.value })}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">Todas empresas</option>
        <option value="Distrito">Distrito</option>
        <option value="Dojo">Dojo</option>
        <option value="FCamara">FCamara</option>
      </select>
    </div>
  );
}
