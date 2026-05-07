"use client";

import { useMemo } from "react";
import type { FarolTrend } from "@/lib/types";
import { isoWeekNumber, parseYmd } from "@/lib/week";

interface TrendChartProps {
  data: FarolTrend;
}

const COLORS = {
  green: "#22c55e",
  yellow: "#facc15",
  red: "#ef4444",
  none: "#d4d4d8",
};

export function TrendChart({ data }: TrendChartProps) {
  const { weeks } = data;

  const max = useMemo(
    () =>
      Math.max(
        1,
        ...weeks.map((w) => w.green + w.yellow + w.red + w.none),
      ),
    [weeks],
  );

  const totals = useMemo(() => {
    const t = { green: 0, yellow: 0, red: 0, none: 0 };
    weeks.forEach((w) => {
      t.green += w.green;
      t.yellow += w.yellow;
      t.red += w.red;
      t.none += w.none;
    });
    return t;
  }, [weeks]);

  if (weeks.length === 0)
    return (
      <p className="text-sm text-muted-foreground">Sem dados no período.</p>
    );

  const barWidthPct = 100 / weeks.length;

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap gap-4 text-xs">
        <Legend color={COLORS.green} label="Verde" total={totals.green} />
        <Legend color={COLORS.yellow} label="Amarelo" total={totals.yellow} />
        <Legend color={COLORS.red} label="Vermelho" total={totals.red} />
        <Legend color={COLORS.none} label="Vazio" total={totals.none} />
      </div>
      <div className="relative">
        <div className="flex h-64 items-end gap-1">
          {weeks.map((w) => {
            const total = w.green + w.yellow + w.red + w.none;
            const heightPct = (total / max) * 100;
            return (
              <div
                key={w.week_start}
                className="flex flex-col items-center"
                style={{ width: `${barWidthPct}%` }}
                title={`Verde ${w.green} · Amarelo ${w.yellow} · Vermelho ${w.red} · Vazio ${w.none}`}
              >
                <div
                  className="flex w-full flex-col-reverse overflow-hidden rounded-t"
                  style={{ height: `${heightPct}%` }}
                >
                  <Segment count={w.green} total={total} color={COLORS.green} />
                  <Segment
                    count={w.yellow}
                    total={total}
                    color={COLORS.yellow}
                  />
                  <Segment count={w.red} total={total} color={COLORS.red} />
                  <Segment count={w.none} total={total} color={COLORS.none} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex gap-1">
          {weeks.map((w) => (
            <div
              key={w.week_start}
              className="text-center text-[10px] text-muted-foreground tabular-nums"
              style={{ width: `${barWidthPct}%` }}
            >
              S{String(isoWeekNumber(parseYmd(w.week_start))).padStart(2, "0")}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Segment({
  count,
  total,
  color,
}: {
  count: number;
  total: number;
  color: string;
}) {
  if (count === 0 || total === 0) return null;
  const pct = (count / total) * 100;
  return <div style={{ height: `${pct}%`, backgroundColor: color }} />;
}

function Legend({
  color,
  label,
  total,
}: {
  color: string;
  label: string;
  total: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="h-3 w-3 rounded-sm"
        style={{ backgroundColor: color }}
      />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{total}</span>
    </div>
  );
}
