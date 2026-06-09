"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFarolCellHistory } from "@/hooks/use-farol";
import { cn } from "@/lib/utils";
import { formatWeekLabel, parseYmd } from "@/lib/week";
import type { FarolColor, FarolCriterion, FarolScope } from "@/lib/types";

interface CellHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  criterion: FarolCriterion;
  scope: FarolScope;
  columnId: number;
  columnName: string;
}

const COLOR_BG: Record<FarolColor, string> = {
  none: "bg-muted",
  green: "bg-green-500",
  yellow: "bg-yellow-400",
  red: "bg-red-500",
};

const COLOR_LABEL: Record<FarolColor, string> = {
  none: "Vazio",
  green: "Verde",
  yellow: "Amarelo",
  red: "Vermelho",
};

const TARGET_KIND_LABEL: Record<"client" | "project", string> = {
  client: "Cliente",
  project: "Projeto",
};

export function CellHistoryDialog({
  open,
  onOpenChange,
  criterion,
  scope,
  columnId,
  columnName,
}: CellHistoryDialogProps) {
  const { data, isLoading } = useFarolCellHistory(
    open ? criterion.id : null,
    open ? scope : null,
    open ? columnId : null,
    12,
  );

  // Agrupa entries por semana pra exibir cliente + projetos juntos.
  const byWeek = new Map<string, typeof data>();
  data?.forEach((entry) => {
    const list = byWeek.get(entry.week_start) ?? [];
    list.push(entry);
    byWeek.set(entry.week_start, list);
  });
  const weeksDesc = Array.from(byWeek.keys()).sort().reverse();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {criterion.label} · {columnName}
          </DialogTitle>
          <DialogDescription>
            Histórico do cliente e dos projetos relacionados.
          </DialogDescription>
        </DialogHeader>
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-muted" />
            ))}
          </div>
        )}
        {data && weeksDesc.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Sem histórico nas últimas 12 semanas.
          </p>
        )}
        {data && weeksDesc.length > 0 && (
          <ol className="space-y-2 max-h-[60vh] overflow-y-auto">
            {weeksDesc.map((weekStart) => {
              const entries = byWeek.get(weekStart) ?? [];
              return (
                <li
                  key={weekStart}
                  className="space-y-1 rounded border p-2 text-sm"
                >
                  <div className="text-xs font-semibold tabular-nums">
                    {formatWeekLabel(parseYmd(weekStart))}
                  </div>
                  {entries.map((entry) => (
                    <div
                      key={`${entry.target_kind}-${entry.target_id}`}
                      className="flex items-start gap-2"
                    >
                      <div
                        className={cn(
                          "mt-1 h-3 w-3 shrink-0 rounded-full border border-black/10",
                          COLOR_BG[entry.color],
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs">
                            <span className="text-muted-foreground">
                              {TARGET_KIND_LABEL[entry.target_kind]}:
                            </span>{" "}
                            <span className="font-medium">
                              {entry.target_name}
                            </span>
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {COLOR_LABEL[entry.color]}
                          </span>
                        </div>
                        {entry.text_value && (
                          <p className="text-xs text-muted-foreground truncate">
                            {entry.text_value}
                          </p>
                        )}
                        {entry.notes && (
                          <p className="text-xs text-muted-foreground/80 mt-0.5">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </li>
              );
            })}
          </ol>
        )}
        {data && criterion.kind === "calculated_allocation" && (
          <p className="text-xs text-muted-foreground">
            Critério calculado: histórico exibe sempre o estado atual.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
