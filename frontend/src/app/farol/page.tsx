"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { EditCriteriaDialog } from "@/components/farol/edit-criteria-dialog";
import { FarolBoardTable } from "@/components/farol/farol-board";
import { useFarolBoard } from "@/hooks/use-farol";

export default function FarolPage() {
  const [editing, setEditing] = useState(false);
  const { mutate } = useFarolBoard();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Farol"
        description="Status visual por cliente e critério"
        actions={
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Settings2 className="mr-2 h-4 w-4" />
            Editar Critérios
          </Button>
        }
      />
      <FarolBoardTable />
      <EditCriteriaDialog
        open={editing}
        onOpenChange={setEditing}
        onChanged={() => mutate()}
      />
    </div>
  );
}
