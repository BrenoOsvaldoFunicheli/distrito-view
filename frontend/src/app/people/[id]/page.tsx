"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, UserMinus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { api } from "@/lib/api";

export default function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const personId = parseInt(id);
  const { data: person, mutate: mutatePerson } = usePerson(personId);
  const { data: allocations, mutate: mutateAllocations } =
    usePersonAllocations(personId);
  const [terminateOpen, setTerminateOpen] = useState(false);
  const [terminationDate, setTerminationDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [terminating, setTerminating] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [error, setError] = useState("");

  const handleTerminate = async () => {
    setTerminating(true);
    setError("");
    try {
      await api.post(`/api/v1/people/${personId}/terminate`, {
        terminated_at: terminationDate,
      });
      await Promise.all([mutatePerson(), mutateAllocations()]);
      setTerminateOpen(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao demitir");
    } finally {
      setTerminating(false);
    }
  };

  const handleReactivate = async () => {
    if (!confirm("Reativar esta pessoa?")) return;
    setReactivating(true);
    try {
      await api.post(`/api/v1/people/${personId}/reactivate`, {});
      await mutatePerson();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erro ao reativar");
    } finally {
      setReactivating(false);
    }
  };

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
          <div className="flex gap-2">
            <Link href={`/people/${person.id}/edit`}>
              <Button variant="outline">
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </Link>
            {person.is_active ? (
              <Button
                variant="outline"
                onClick={() => setTerminateOpen(true)}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <UserMinus className="mr-2 h-4 w-4" />
                Demitir
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleReactivate}
                disabled={reactivating}
                className="text-green-700 hover:bg-green-50"
              >
                <UserCheck className="mr-2 h-4 w-4" />
                {reactivating ? "Reativando..." : "Reativar"}
              </Button>
            )}
          </div>
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
            {!person.is_active && person.terminated_at && (
              <p className="mt-1 text-xs text-muted-foreground">
                Desligado em{" "}
                {new Date(person.terminated_at).toLocaleDateString("pt-BR")}
              </p>
            )}
            {person.notes && (
              <p className="mt-2 text-sm text-muted-foreground">
                {person.notes}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={terminateOpen} onOpenChange={setTerminateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demitir {person.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Pessoa será marcada como inativa. Alocações em curso terão sua data
              fim ajustada para a data de saída e alocações futuras serão removidas.
              Histórico de alocações passadas é preservado.
            </p>
            <div className="space-y-1">
              <Label>Data de saída</Label>
              <Input
                type="date"
                value={terminationDate}
                onChange={(e) => setTerminationDate(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTerminateOpen(false)}
              disabled={terminating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleTerminate}
              disabled={terminating || !terminationDate}
              className="bg-red-600 hover:bg-red-700"
            >
              {terminating ? "Confirmando..." : "Confirmar demissão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
