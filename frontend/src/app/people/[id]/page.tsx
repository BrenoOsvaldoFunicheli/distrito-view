"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
import { PageHeader } from "@/components/layout/page-header";
import { RoleBadge } from "@/components/shared/role-badge";
import { PercentageBadge } from "@/components/shared/percentage-badge";
import { usePerson, usePersonAllocations } from "@/hooks/use-people";

export default function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const personId = parseInt(id);
  const { data: person } = usePerson(personId);
  const { data: allocations } = usePersonAllocations(personId);

  if (!person) {
    return <div className="animate-pulse h-64 bg-muted rounded-lg" />;
  }

  const today = new Date().toISOString().split("T")[0];
  const activeAllocations =
    allocations?.filter(
      (a) => a.start_date <= today && a.end_date > today,
    ) || [];
  const currentPct = activeAllocations.reduce(
    (sum, a) => sum + a.allocation_percentage,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/people">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>

      <PageHeader
        title={person.name}
        description={person.email}
        actions={
          <Link href={`/allocations/new?person_id=${person.id}`}>
            <Button>Alocar em Contrato</Button>
          </Link>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Especialidades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {person.roles.map((pr) => (
                <RoleBadge
                  key={pr.role.id}
                  name={pr.role.name}
                  isPrimary={pr.is_primary}
                />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Alocacao Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <PercentageBadge percentage={currentPct} />
              <span className="text-sm text-muted-foreground">
                {currentPct >= 100
                  ? "Totalmente alocado"
                  : currentPct > 0
                    ? "Parcialmente alocado"
                    : "No bench"}
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.min(currentPct, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <span
              className={person.is_active ? "text-green-600" : "text-red-600"}
            >
              {person.is_active ? "Ativo" : "Inativo"}
            </span>
            {person.notes && (
              <p className="mt-2 text-sm text-muted-foreground">
                {person.notes}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historico de Alocacoes</CardTitle>
        </CardHeader>
        <CardContent>
          {!allocations || allocations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma alocacao registrada.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>%</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Fim</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocations.map((alloc) => (
                  <TableRow
                    key={alloc.id}
                    className={
                      alloc.start_date <= today && alloc.end_date > today
                        ? "bg-green-50"
                        : ""
                    }
                  >
                    <TableCell>
                      <Link
                        href={`/contracts/${alloc.contract_role_id}`}
                        className="hover:underline"
                      >
                        {alloc.contract_name}
                      </Link>
                    </TableCell>
                    <TableCell>{alloc.client_name}</TableCell>
                    <TableCell>
                      <RoleBadge name={alloc.role_name} />
                    </TableCell>
                    <TableCell>
                      <PercentageBadge percentage={alloc.allocation_percentage} />
                    </TableCell>
                    <TableCell>
                      {new Date(alloc.start_date).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      {new Date(alloc.end_date).toLocaleDateString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
