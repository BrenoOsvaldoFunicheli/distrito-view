"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Proposal, ProposalStage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProposalCard } from "./proposal-card";

interface KanbanColumnProps {
  stage: ProposalStage;
  label: string;
  proposals: Proposal[];
  onCardClick: (proposal: Proposal) => void;
  terminal?: boolean;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export function KanbanColumn({
  stage,
  label,
  proposals,
  onCardClick,
  terminal,
}: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: stage,
    data: { stage },
  });

  const total = proposals.reduce(
    (sum, p) => sum + (p.estimated_value || 0),
    0,
  );

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-lg border bg-muted/30",
        isOver && "ring-2 ring-primary",
        terminal && stage === "won" && "bg-emerald-50/40",
        terminal && stage === "lost" && "bg-red-50/40",
      )}
    >
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{label}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
            {proposals.length}
          </span>
        </div>
        {total > 0 && (
          <span className="text-xs text-muted-foreground">
            {formatCurrency(total)}
          </span>
        )}
      </div>
      <SortableContext
        items={proposals.map((p) => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 space-y-2 overflow-y-auto p-2">
          {proposals.map((p) => (
            <ProposalCard
              key={p.id}
              proposal={p}
              onClick={() => onCardClick(p)}
            />
          ))}
          {proposals.length === 0 && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Vazio
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
