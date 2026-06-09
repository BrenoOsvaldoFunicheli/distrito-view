"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useContractProjects } from "@/hooks/use-projects";
import { api } from "@/lib/api";
import type { Project } from "@/lib/types";
import { ProjectDialog } from "./project-dialog";
import { ProjectStatusBadge } from "./project-status-badge";

interface ContractProjectsCardProps {
  contractId: number;
}

export function ContractProjectsCard({
  contractId,
}: ContractProjectsCardProps) {
  const { data: projects, mutate } = useContractProjects(contractId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditing(project);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Excluir este projeto?")) return;
    await api.delete(`/api/v1/projects/${id}`);
    mutate();
  };

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("pt-BR") : "-";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Projetos</CardTitle>
        <Button size="sm" variant="outline" onClick={openNew}>
          <Plus className="mr-1 h-4 w-4" />
          Novo Projeto
        </Button>
      </CardHeader>
      <CardContent>
        {!projects || projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum projeto cadastrado.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">
                    {project.name}
                  </TableCell>
                  <TableCell className="text-sm">
                    {project.start_date || project.end_date ? (
                      <>
                        {fmtDate(project.start_date)} →{" "}
                        {fmtDate(project.end_date)}
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Não definido
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <ProjectStatusBadge status={project.status} />
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                    {project.description || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(project)}
                        title="Editar projeto"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(project.id)}
                        title="Excluir projeto"
                        className="hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contractId={contractId}
        project={editing}
        onSaved={() => mutate()}
      />
    </Card>
  );
}
