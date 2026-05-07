"use client";

import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type DateField = "expected_close_date" | "created_at" | "none";
export type DatePreset =
  | "all"
  | "this_month"
  | "next_month"
  | "this_quarter"
  | "custom";

export interface BoardFilters {
  showWon: boolean;
  showLost: boolean;
  dateField: DateField;
  preset: DatePreset;
  customStart: string;
  customEnd: string;
}

export const DEFAULT_FILTERS: BoardFilters = {
  showWon: true,
  showLost: true,
  dateField: "none",
  preset: "all",
  customStart: "",
  customEnd: "",
};

const STORAGE_KEY = "distrito.proposals.filters";

export function loadFilters(): BoardFilters {
  if (typeof window === "undefined") return DEFAULT_FILTERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FILTERS;
    return { ...DEFAULT_FILTERS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_FILTERS;
  }
}

function saveFilters(filters: BoardFilters) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function fmt(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function computeDateRange(
  preset: DatePreset,
  customStart: string,
  customEnd: string,
): { start: string | null; end: string | null } {
  if (preset === "all") return { start: null, end: null };
  if (preset === "custom") {
    return {
      start: customStart || null,
      end: customEnd || null,
    };
  }
  const now = new Date();
  if (preset === "this_month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start: fmt(start), end: fmt(end) };
  }
  if (preset === "next_month") {
    const start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    return { start: fmt(start), end: fmt(end) };
  }
  if (preset === "this_quarter") {
    const q = Math.floor(now.getMonth() / 3);
    const start = new Date(now.getFullYear(), q * 3, 1);
    const end = new Date(now.getFullYear(), q * 3 + 3, 0);
    return { start: fmt(start), end: fmt(end) };
  }
  return { start: null, end: null };
}

interface BoardFiltersBarProps {
  filters: BoardFilters;
  onChange: (filters: BoardFilters) => void;
}

const PRESETS: { key: DatePreset; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "this_month", label: "Este mês" },
  { key: "next_month", label: "Próximo mês" },
  { key: "this_quarter", label: "Trimestre" },
  { key: "custom", label: "Customizado" },
];

export function BoardFiltersBar({ filters, onChange }: BoardFiltersBarProps) {
  useEffect(() => {
    saveFilters(filters);
  }, [filters]);

  const range = useMemo(
    () => computeDateRange(filters.preset, filters.customStart, filters.customEnd),
    [filters.preset, filters.customStart, filters.customEnd],
  );

  const update = (patch: Partial<BoardFilters>) =>
    onChange({ ...filters, ...patch });

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-card p-3">
      <div className="space-y-1">
        <Label className="text-xs uppercase text-muted-foreground">
          Colunas finais
        </Label>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={filters.showWon ? "default" : "outline"}
            onClick={() => update({ showWon: !filters.showWon })}
          >
            {filters.showWon ? "✓ " : ""}Ganho
          </Button>
          <Button
            type="button"
            size="sm"
            variant={filters.showLost ? "default" : "outline"}
            onClick={() => update({ showLost: !filters.showLost })}
          >
            {filters.showLost ? "✓ " : ""}Perdido
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs uppercase text-muted-foreground">Filtrar por</Label>
        <select
          className="rounded-md border px-2 py-1.5 text-sm"
          value={filters.dateField}
          onChange={(e) => update({ dateField: e.target.value as DateField })}
        >
          <option value="none">Sem filtro de data</option>
          <option value="expected_close_date">Data prevista de fechamento</option>
          <option value="created_at">Data de criação</option>
        </select>
      </div>

      {filters.dateField !== "none" && (
        <>
          <div className="space-y-1">
            <Label className="text-xs uppercase text-muted-foreground">Período</Label>
            <div className="flex flex-wrap gap-1">
              {PRESETS.map((p) => (
                <Button
                  key={p.key}
                  type="button"
                  size="sm"
                  variant={filters.preset === p.key ? "default" : "outline"}
                  onClick={() => update({ preset: p.key })}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          {filters.preset === "custom" && (
            <>
              <div className="space-y-1">
                <Label className="text-xs uppercase text-muted-foreground">De</Label>
                <Input
                  type="date"
                  className="h-9"
                  value={filters.customStart}
                  onChange={(e) => update({ customStart: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs uppercase text-muted-foreground">Até</Label>
                <Input
                  type="date"
                  className="h-9"
                  value={filters.customEnd}
                  onChange={(e) => update({ customEnd: e.target.value })}
                />
              </div>
            </>
          )}

          {filters.preset !== "custom" && filters.preset !== "all" && (
            <div className="self-center text-xs text-muted-foreground">
              {range.start} → {range.end}
            </div>
          )}
        </>
      )}
    </div>
  );
}
