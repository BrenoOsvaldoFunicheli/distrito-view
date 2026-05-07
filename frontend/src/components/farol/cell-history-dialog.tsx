"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFarolCellHistory } from "@/hooks/use-farol";
import { cn } from "@/lib/utils";
import { formatWeekLabel, parseYmd } from "@/lib/week";
import type { FarolColor, FarolCriterion } from "@/lib/types";

interface CellHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  criterion: FarolCriterion;
  clientId: number;
  clientName: string;
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

export function CellHistoryDialog({
  open,
  onOpenChange,
  criterion,
  clientId,
  clientName,
}: CellHistoryDialogProps) {
  const { data, isLoading } = useFarolCellHistory(
    open ? criterion.id : null,
    open ? clientId : null,
    12,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {criterion.label} · {clientName}
          </DialogTitle>
        </DialogHeader>
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-muted" />
            ))}
          </div>
        )}
        {data && (
          <ol className="space-y-1 max-h-[60vh] overflow-y-auto">
            {[...data].reverse().map((entry) => (
              <li
                key={entry.week_start}
                className="flex items-start gap-3 rounded border p-2 text-sm"
              >
                <div
                  className={cn(
                    "mt-1 h-3 w-3 shrink-0 rounded-full border border-black/10",
                    COLOR_BG[entry.color],
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium tabular-nums">
                      {formatWeekLabel(parseYmd(entry.week_start))}
                    </span>
                    <span className="text-xs text-muted-foreground">
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
              </li>
            ))}
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
