"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { RoleBadge } from "@/components/shared/role-badge";
import { usePeople } from "@/hooks/use-people";

type CompanyFilter = "all" | "Distrito" | "Dojo";

export default function PeoplePage() {
  const { data: people, isLoading } = usePeople();
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState<CompanyFilter>("all");

  const companyCounts = useMemo(() => {
    if (!people) return { all: 0, distrito: 0, dojo: 0 };
    const distrito = people.filter((p) => p.company === "Distrito").length;
    const dojo = people.filter((p) => p.company === "Dojo").length;
    return { all: people.length, distrito, dojo };
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pessoas"
        description="Engenheiros e profissionais da equipe"
        actions={
          <Link href="/people/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Pessoa
            </Button>
          </Link>
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
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Especialidades</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((person) => (
                <TableRow key={person.id}>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
