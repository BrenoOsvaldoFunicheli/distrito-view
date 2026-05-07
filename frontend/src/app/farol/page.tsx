"use client";

import { useState } from "react";
import Link from "next/link";
import { Settings2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { EditCriteriaDialog } from "@/components/farol/edit-criteria-dialog";
import { FarolBoardTable } from "@/components/farol/farol-board";
import { WeekSelector } from "@/components/farol/week-selector";
import { useFarolBoard } from "@/hooks/use-farol";
import { formatYmd, todayWeekStart } from "@/lib/week";

export default function FarolPage() {
  const [editing, setEditing] = useState(false);
  const [week, setWeek] = useState<string>(() => formatYmd(todayWeekStart()));
  const { mutate } = useFarolBoard(week);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Farol"
        description="Status visual por cliente e critério"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/farol/tendencia">
                <TrendingUp className="mr-2 h-4 w-4" />
                Tendência
              </Link>
            </Button>
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Settings2 className="mr-2 h-4 w-4" />
              Editar Critérios
            </Button>
          </div>
        }
      />
      <WeekSelector week={week} onChange={setWeek} />
      <FarolBoardTable week={week} />
      <EditCriteriaDialog
        open={editing}
        onOpenChange={setEditing}
        onChanged={() => mutate()}
      />
    </div>
  );
}
