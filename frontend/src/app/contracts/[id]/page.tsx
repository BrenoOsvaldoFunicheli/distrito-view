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
import { StatusBadge } from "@/components/shared/status-badge";
import { RoleBadge } from "@/components/shared/role-badge";
import { PercentageBadge } from "@/components/shared/percentage-badge";
import { useContract } from "@/hooks/use-contracts";
import { useAllocations } from "@/hooks/use-allocations";

export default function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const contractId = parseInt(id);
  const { data: contract } = useContract(contractId);
  const { data: allocations } = useAllocations(undefined, contractId);

  if (!contract) {
    return <div className="animate-pulse h-64 bg-muted rounded-lg" />;
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/contracts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>

      <PageHeader
        title={contract.name}
        description={`${contract.client.name} | ${contract.plan_type || ""}`}
        actions={<StatusBadge status={contract.status} />}
      />

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Periodo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {new Date(contract.start_date).toLocaleDateString("pt-BR")} -{" "}
              {new Date(contract.end_date).toLocaleDateString("pt-BR")}
            </p>
            <p className="text-xs text-muted-foreground">
              {contract.duration_months} meses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">MRR</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{formatCurrency(contract.mrr)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">
              {formatCurrency(contract.total_value)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{contract.payment_method || "-"}</p>
          </CardContent>
        </Card>
      </div>

      {contract.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Observacoes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{contract.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Requisitos de Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Alocacao</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Preenchido</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contract.contract_roles.map((cr) => {
                const roleAllocations =
                  allocations?.filter(
                    (a) => a.contract_role_id === cr.id,
                  ) || [];
                const filled = roleAllocations.length;
                return (
                  <TableRow key={cr.id}>
                    <TableCell>
                      <RoleBadge name={cr.role.name} />
                    </TableCell>
                    <TableCell>
                      <PercentageBadge percentage={cr.allocation_percentage} />
                    </TableCell>
                    <TableCell>{cr.quantity}</TableCell>
                    <TableCell>
                      <span
                        className={
                          filled >= cr.quantity
                            ? "text-green-600"
                            : "text-yellow-600"
                        }
                      >
                        {filled}/{cr.quantity}
                      </span>
                    </TableCell>
                    <TableCell>
                      {filled < cr.quantity && (
                        <Link
                          href={`/allocations/new?contract_role_id=${cr.id}`}
                        >
                          <Button size="sm" variant="outline">
                            Alocar
                          </Button>
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {allocations && allocations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pessoas Alocadas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pessoa</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>%</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Fim</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocations.map((alloc) => (
                  <TableRow key={alloc.id}>
                    <TableCell>
                      <Link
                        href={`/people/${alloc.person_id}`}
                        className="hover:underline"
                      >
                        {alloc.person_name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <RoleBadge name={alloc.role_name} />
                    </TableCell>
                    <TableCell>
                      <PercentageBadge
                        percentage={alloc.allocation_percentage}
                      />
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
