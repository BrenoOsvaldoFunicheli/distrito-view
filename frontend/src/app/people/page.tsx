"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { RoleBadge } from "@/components/shared/role-badge";
import { usePeople } from "@/hooks/use-people";
import { api } from "@/lib/api";

type CompanyFilter = "all" | "Distrito" | "Dojo" | "FCamara";

export default function PeoplePage() {
  const { data: people, isLoading, mutate } = usePeople();
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState<CompanyFilter>("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const companyCounts = useMemo(() => {
    if (!people) return { all: 0, distrito: 0, dojo: 0, fcamara: 0 };
    const distrito = people.filter((p) => p.company === "Distrito").length;
    const dojo = people.filter((p) => p.company === "Dojo").length;
    const fcamara = people.filter((p) => p.company === "FCamara").length;
    return { all: people.length, distrito, dojo, fcamara };
  }, [people]);

  const filtered = useMemo(() => {
    if (!people) return [];
    let result = people;

    if (companyFilter !== "all") {
      result = result.filter((p) => p.company === companyFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.roles.some((pr) => pr.role.name.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [people, search, companyFilter]);

  const allSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const someSelected = selected.size > 0;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  }

  function toggleOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await Promise.all([...selected].map((id) => api.delete(`/api/v1/people/${id}`)));
      setSelected(new Set());
      mutate();
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pessoas"
        description="Engenheiros e profissionais da equipe"
        actions={
          <div className="flex gap-2">
            {someSelected && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir ({selected.size})
              </Button>
            )}
            <Link href="/people/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Pessoa
              </Button>
            </Link>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          <Button
            variant={companyFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setCompanyFilter("all")}
          >
            Todas ({companyCounts.all})
          </Button>
          <Button
            variant={companyFilter === "Distrito" ? "default" : "outline"}
            size="sm"
            onClick={() => setCompanyFilter("Distrito")}
          >
            Distrito ({companyCounts.distrito})
          </Button>
          <Button
            variant={companyFilter === "Dojo" ? "default" : "outline"}
            size="sm"
            onClick={() => setCompanyFilter("Dojo")}
          >
            Dojo ({companyCounts.dojo})
          </Button>
          <Button
            variant={companyFilter === "FCamara" ? "default" : "outline"}
            size="sm"
            onClick={() => setCompanyFilter("FCamara")}
          >
            FCamara ({companyCounts.fcamara})
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Especialidades</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((person) => (
                <TableRow key={person.id} data-state={selected.has(person.id) ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(person.id)}
                      onCheckedChange={() => toggleOne(person.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/people/${person.id}`}
                        className="font-medium hover:underline"
                      >
                        {person.name}
                      </Link>
                      {person.company && person.company !== "Distrito" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-medium">
                          {person.company}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {person.email}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {person.roles.map((pr) => (
                        <RoleBadge
                          key={pr.role.id}
                          name={pr.role.name}
                          isPrimary={pr.is_primary}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        person.is_active ? "text-green-600" : "text-red-600"
                      }
                    >
                      {person.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link href={`/people/${person.id}/edit`}>
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selected.size} pessoa{selected.size > 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. As pessoas selecionadas serão removidas permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
