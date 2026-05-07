"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useProposalStages } from "@/hooks/use-proposal-stages";
import { useProposals } from "@/hooks/use-proposals";
import { api, ApiError } from "@/lib/api";
import type { Contract, Proposal, ProposalStageDef } from "@/lib/types";
import {
  BoardFilters,
  DEFAULT_FILTERS,
  computeDateRange,
  loadFilters,
} from "./board-filters";
import { ConvertDialog } from "./convert-dialog";
import { KanbanColumn } from "./kanban-column";
import { LostReasonDialog } from "./lost-reason-dialog";
import { ProposalCard } from "./proposal-card";
import { ProposalFormDialog } from "./proposal-form-dialog";

interface KanbanBoardProps {
  newDialogOpen: boolean;
  onNewDialogOpenChange: (open: boolean) => void;
  filters: BoardFilters;
}

function inDateRange(
  value: string | null,
  start: string | null,
  end: string | null,
): boolean {
  if (!value) return false;
  const v = value.slice(0, 10);
  if (start && v < start) return false;
  if (end && v > end) return false;
  return true;
}

export function KanbanBoard({
  newDialogOpen,
  onNewDialogOpenChange,
  filters,
}: KanbanBoardProps) {
  const { data: proposals, mutate, isLoading } = useProposals();
  const { data: stages } = useProposalStages();
  const [activeProposal, setActiveProposal] = useState<Proposal | null>(null);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [convertingProposal, setConvertingProposal] = useState<Proposal | null>(null);
  const [losingProposal, setLosingProposal] = useState<Proposal | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const visibleStages: ProposalStageDef[] = useMemo(() => {
    if (!stages) return [];
    return [...stages]
      .sort((a, b) => a.position - b.position)
      .filter((s) => {
        if (s.key === "won" && !filters.showWon) return false;
        if (s.key === "lost" && !filters.showLost) return false;
        return true;
      });
  }, [stages, filters.showWon, filters.showLost]);

  const filteredProposals = useMemo(() => {
    if (!proposals) return [];
    if (filters.dateField === "none") return proposals;
    const { start, end } = computeDateRange(
      filters.preset,
      filters.customStart,
      filters.customEnd,
    );
    if (!start && !end) return proposals;
    return proposals.filter((p) => {
      const v =
        filters.dateField === "expected_close_date"
          ? p.expected_close_date
          : p.created_at;
      return inDateRange(v, start, end);
    });
  }, [proposals, filters]);

  const grouped = useMemo(() => {
    const map: Record<string, Proposal[]> = {};
    visibleStages.forEach((s) => {
      map[s.key] = [];
    });
    filteredProposals.forEach((p) => {
      if (map[p.stage]) map[p.stage].push(p);
    });
    return map;
  }, [filteredProposals, visibleStages]);

  const handleDragStart = (event: DragStartEvent) => {
    const id = Number(event.active.id);
    const p = proposals?.find((p) => p.id === id);
    setActiveProposal(p || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveProposal(null);
    const { active, over } = event;
    if (!over || !proposals) return;

    const proposalId = Number(active.id);
    const proposal = proposals.find((p) => p.id === proposalId);
    if (!proposal) return;

    const overData = over.data.current as { stage?: string } | undefined;
    const targetStage = (overData?.stage || (over.id as string)) as string;
    if (!visibleStages.find((s) => s.key === targetStage)) return;
    if (proposal.stage === targetStage) return;

    if (targetStage === "won") {
      setConvertingProposal(proposal);
      return;
    }
    if (targetStage === "lost") {
      setLosingProposal(proposal);
      return;
    }

    const optimistic = proposals.map((p) =>
      p.id === proposalId ? { ...p, stage: targetStage } : p,
    );
    mutate(optimistic, false);

    try {
      await api.patch(`/api/v1/proposals/${proposalId}/stage`, {
        stage: targetStage,
      });
      mutate();
    } catch (err) {
      mutate();
      if (err instanceof ApiError) {
        setToast(`Erro: ${err.detail}`);
      }
    }
  };

  const handleConverted = (contract: Contract) => {
    mutate();
    setToast(`Contrato criado: ${contract.name}`);
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {visibleStages.map((s) => (
            <KanbanColumn
              key={s.key}
              stage={s.key}
              label={s.label}
              proposals={grouped[s.key] || []}
              terminal={s.is_terminal}
              onCardClick={setEditingProposal}
            />
          ))}
        </div>
        <DragOverlay>
          {activeProposal ? (
            <ProposalCard proposal={activeProposal} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      {isLoading && (
        <div className="text-sm text-muted-foreground">Carregando...</div>
      )}

      <ProposalFormDialog
        open={newDialogOpen}
        onOpenChange={onNewDialogOpenChange}
        onSaved={() => mutate()}
      />

      <ProposalFormDialog
        open={!!editingProposal}
        onOpenChange={(open) => !open && setEditingProposal(null)}
        proposal={editingProposal}
        onSaved={() => mutate()}
        onDeleted={() => mutate()}
      />

      <ConvertDialog
        proposal={convertingProposal}
        onClose={() => setConvertingProposal(null)}
        onDone={handleConverted}
      />

      <LostReasonDialog
        proposal={losingProposal}
        onClose={() => setLosingProposal(null)}
        onDone={() => mutate()}
      />

      {toast && (
        <div
          className="fixed bottom-4 right-4 z-50 rounded-md bg-foreground px-4 py-2 text-sm text-background shadow-lg"
          onClick={() => setToast(null)}
        >
          {toast}
        </div>
      )}
    </>
  );
}

export function useBoardFilters() {
  const [filters, setFilters] = useState<BoardFilters>(DEFAULT_FILTERS);
  useEffect(() => {
    setFilters(loadFilters());
  }, []);
  return [filters, setFilters] as const;
}
