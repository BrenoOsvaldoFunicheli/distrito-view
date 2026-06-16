"use client";

import { useState } from "react";
import Link from "next/link";
import { Settings2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { EditCriteriaDialog } from "@/components/farol/edit-criteria-dialog";
import { FarolBoardTable } from "@/components/farol/farol-board";
import { WeekSelector } from "@/components/farol/week-selector";
import { useFarolBoard } from "@/hooks/use-farol";
import type { FarolScope } from "@/lib/types";
import { formatYmd, todayWeekStart } from "@/lib/week";

const SCOPE_STORAGE_KEY = "distrito.farol.scope";

export default function FarolPage() {
  const [editing, setEditing] = useState(false);
  const [week, setWeek] = useState<string>(() => formatYmd(todayWeekStart()));
  const [scope, setScope] = useState<FarolScope>(() => {
    if (typeof window === "undefined") return "client";
    const v = localStorage.getItem(SCOPE_STORAGE_KEY);
    return v === "project" || v === "hierarchical" ? v : "client";
  });
  const { mutate } = useFarolBoard(week, scope);

  const handleScopeChange = (value: string) => {
    const next: FarolScope =
      value === "project" || value === "hierarchical" ? value : "client";
    setScope(next);
    localStorage.setItem(SCOPE_STORAGE_KEY, next);
  };

  const description =
    scope === "client"
      ? "Status visual por cliente e critério"
      : scope === "project"
        ? "Status visual por projeto e critério"
        : "Projetos agrupados por cliente; o cliente herda a média dos projetos";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Farol"
        description={description}
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
      <div className="flex flex-wrap items-center gap-3">
        <WeekSelector week={week} onChange={setWeek} />
        <Tabs value={scope} onValueChange={handleScopeChange}>
          <TabsList>
            <TabsTrigger value="client">Por Cliente</TabsTrigger>
            <TabsTrigger value="project">Por Projeto</TabsTrigger>
            <TabsTrigger value="hierarchical">Cliente + Projetos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <FarolBoardTable week={week} scope={scope} />
      <EditCriteriaDialog
        open={editing}
        onOpenChange={setEditing}
        onChanged={() => mutate()}
      />
    </div>
  );
}
