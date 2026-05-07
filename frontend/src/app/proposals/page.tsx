"use client";

import { useState } from "react";
import { Plus, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { BoardFiltersBar } from "@/components/proposals/board-filters";
import { EditStagesDialog } from "@/components/proposals/edit-stages-dialog";
import { KanbanBoard, useBoardFilters } from "@/components/proposals/kanban-board";

export default function ProposalsPage() {
  const [newOpen, setNewOpen] = useState(false);
  const [stagesOpen, setStagesOpen] = useState(false);
  const [filters, setFilters] = useBoardFilters();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Propostas Técnicas Comerciais"
        actions={
          <>
            <Button variant="outline" onClick={() => setStagesOpen(true)}>
              <Settings2 className="mr-2 h-4 w-4" />
              Editar Colunas
            </Button>
            <Button onClick={() => setNewOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Proposta
            </Button>
          </>
        }
      />
      <BoardFiltersBar filters={filters} onChange={setFilters} />
      <KanbanBoard
        newDialogOpen={newOpen}
        onNewDialogOpenChange={setNewOpen}
        filters={filters}
      />
      <EditStagesDialog
        open={stagesOpen}
        onOpenChange={setStagesOpen}
        onChanged={() => {
          // SWR caches will refetch; nothing else to do here
        }}
      />
    </div>
  );
}
