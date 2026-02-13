"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";
import { PercentageBadge } from "@/components/shared/percentage-badge";
import { useAllocationSummary } from "@/hooks/use-dashboard";
import { ROLE_COLORS, getClientColor } from "@/lib/constants";
import type { AllocationSummaryEntry } from "@/lib/types";

const ROLE_ORDER = [
  "Engenheiro IA",
  "Engenheiro Dados",
  "Desenvolvedor",
  "Engenheiro de ML",
  "PO",
  "PM",
];

const ROLE_BG_COLORS: Record<string, string> = {
  "Engenheiro IA": "bg-purple-50 border-purple-200",
  "Engenheiro Dados": "bg-blue-50 border-blue-200",
  "Desenvolvedor": "bg-green-50 border-green-200",
  "Engenheiro de ML": "bg-cyan-50 border-cyan-200",
  "PO": "bg-amber-50 border-amber-200",
  "PM": "bg-orange-50 border-orange-200",
};

type Filter = "all" | "allocated" | "partial" | "bench";
type CompanyFilter = "all" | "Distrito" | "Dojo" | "FCamara";

function groupByRole(people: AllocationSummaryEntry[]) {
  const groups: Record<string, AllocationSummaryEntry[]> = {};
  for (const person of people) {
    const role = person.roles[0] || "Sem role";
    if (!groups[role]) groups[role] = [];
    groups[role].push(person);
  }
  // Sort by defined order
  const sorted: { role: string; people: AllocationSummaryEntry[] }[] = [];
  for (const role of ROLE_ORDER) {
    if (groups[role]) {
      sorted.push({ role, people: groups[role] });
      delete groups[role];
    }
  }
  // Any remaining roles not in ROLE_ORDER
  for (const [role, ppl] of Object.entries(groups)) {
    sorted.push({ role, people: ppl });
  }
  return sorted;
}

export default function PeopleAllocationsPage() {
  const { data, isLoading } = useAllocationSummary();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [companyFilter, setCompanyFilter] = useState<CompanyFilter>("all");

  const people = data?.data || [];

  const filtered = useMemo(() => {
    let result = people;

    if (companyFilter !== "all") {
      result = result.filter((p) => p.person_company === companyFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.person_name.toLowerCase().includes(q) ||
          p.roles.some((r) => r.toLowerCase().includes(q)) ||
          p.allocations.some(
            (a) =>
              a.client_name.toLowerCase().includes(q) ||
              a.contract_name.toLowerCase().includes(q),
          ),
      );
    }

    if (filter === "allocated") {
      result = result.filter((p) => p.current_allocation_percentage >= 100);
    } else if (filter === "partial") {
      result = result.filter(
        (p) =>
          p.current_allocation_percentage > 0 &&
          p.current_allocation_percentage < 100,
      );
    } else if (filter === "bench") {
      result = result.filter((p) => p.current_allocation_percentage === 0);
    }

    return result;
  }, [people, search, filter, companyFilter]);

  const companyPeople = useMemo(() => {
    if (companyFilter === "all") return people;
    return people.filter((p) => p.person_company === companyFilter);
  }, [people, companyFilter]);

  const counts = useMemo(() => {
    const full = companyPeople.filter((p) => p.current_allocation_percentage >= 100).length;
    const partial = companyPeople.filter(
      (p) =>
        p.current_allocation_percentage > 0 &&
        p.current_allocation_percentage < 100,
    ).length;
    const bench = companyPeople.filter((p) => p.current_allocation_percentage === 0).length;
    return { all: companyPeople.length, full, partial, bench };
  }, [companyPeople]);

  const companyCounts = useMemo(() => {
    const distrito = people.filter((p) => p.person_company === "Distrito").length;
    const dojo = people.filter((p) => p.person_company === "Dojo").length;
    const fcamara = people.filter((p) => p.person_company === "FCamara").length;
    return { all: people.length, distrito, dojo, fcamara };
  }, [people]);

  const groups = useMemo(() => groupByRole(filtered), [filtered]);

  const today = new Date().toISOString().split("T")[0];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Alocacao por Pessoa" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alocacao por Pessoa"
        description="Visao agrupada por especialidade"
        actions={
          <div className="flex gap-2">
            <Link href="/allocations">
              <Button variant="outline">Timeline</Button>
            </Link>
            <Link href="/allocations/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Alocacao
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
            placeholder="Buscar por nome, role, cliente ou contrato..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-3">
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
          <div className="flex gap-1">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              Todos ({counts.all})
            </Button>
            <Button
              variant={filter === "allocated" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("allocated")}
            >
              100% ({counts.full})
            </Button>
            <Button
              variant={filter === "partial" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("partial")}
            >
              Parcial ({counts.partial})
            </Button>
            <Button
              variant={filter === "bench" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("bench")}
            >
              Bench ({counts.bench})
            </Button>
          </div>
        </div>
      </div>

      {/* Grouped table */}
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left font-medium px-4 py-2 w-56">Pessoa</th>
              <th className="text-left font-medium px-4 py-2">Alocacoes Atuais</th>
              <th className="text-right font-medium px-4 py-2 w-24">Total</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => {
              const roleColor =
                ROLE_COLORS[group.role] || "bg-gray-100 text-gray-800";
              const rowBg =
                ROLE_BG_COLORS[group.role] || "bg-gray-50 border-gray-200";
              return (
                <GroupRows
                  key={group.role}
                  role={group.role}
                  roleColor={roleColor}
                  rowBg={rowBg}
                  people={group.people}
                  today={today}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">Nenhuma pessoa encontrada.</p>
        </div>
      )}
    </div>
  );
}

function GroupRows({
  role,
  roleColor,
  rowBg,
  people,
  today,
}: {
  role: string;
  roleColor: string;
  rowBg: string;
  people: AllocationSummaryEntry[];
  today: string;
}) {
  return (
    <>
      {/* Role header */}
      <tr className={`border-t ${rowBg}`}>
        <td colSpan={3} className="px-4 py-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={`${roleColor} text-xs`}>
              {role}
            </Badge>
            <span className="text-xs text-muted-foreground">
              ({people.length})
            </span>
          </div>
        </td>
      </tr>

      {/* People rows */}
      {people.map((person) => {
        const currentAllocs = person.allocations.filter(
          (a) => a.start_date <= today && a.end_date > today,
        );

        return (
          <tr
            key={person.person_id}
            className="border-t border-border/50 hover:bg-accent/30"
          >
            <td className="px-4 py-2">
              <div className="flex items-center gap-2">
                <Link
                  href={`/people/${person.person_id}`}
                  className="font-medium hover:underline"
                >
                  {person.person_name}
                </Link>
                {person.person_company && person.person_company !== "Distrito" && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-medium">
                    {person.person_company}
                  </span>
                )}
              </div>
            </td>
            <td className="px-4 py-2">
              {currentAllocs.length > 0 ? (
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {currentAllocs.map((alloc) => (
                    <div
                      key={alloc.allocation_id}
                      className="flex items-center gap-1.5"
                    >
                      <div
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: getClientColor(alloc.client_name),
                        }}
                      />
                      <span>
                        {alloc.client_name}{" "}
                        <span className="text-muted-foreground">
                          {alloc.percentage}%
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground italic">Bench</span>
              )}
            </td>
            <td className="px-4 py-2 text-right">
              <PercentageBadge
                percentage={person.current_allocation_percentage}
              />
            </td>
          </tr>
        );
      })}
    </>
  );
}
