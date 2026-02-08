"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useContracts } from "@/hooks/use-contracts";

export default function ContractsPage() {
  const { data: contracts, isLoading } = useContracts();

  const formatCurrency = (value: number | null) => {
    if (!value) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contratos"
        description="Contratos ativos e historico"
        actions={
          <Link href="/contracts/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Contrato
            </Button>
          </Link>
        }
      />

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
                <TableHead>Contrato</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>MRR</TableHead>
                <TableHead>Roles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts?.map((contract) => {
                const totalSlots = contract.contract_roles.reduce(
                  (sum, cr) => sum + cr.quantity,
                  0,
                );
                return (
                  <TableRow key={contract.id}>
                    <TableCell>
                      <Link
                        href={`/contracts/${contract.id}`}
                        className="font-medium hover:underline"
                      >
                        {contract.name}
                      </Link>
                      {contract.plan_type && (
                        <p className="text-xs text-muted-foreground">
                          {contract.plan_type}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>{contract.client.name}</TableCell>
                    <TableCell>
                      <StatusBadge status={contract.status} />
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(contract.start_date).toLocaleDateString(
                        "pt-BR",
                      )}{" "}
                      -{" "}
                      {new Date(contract.end_date).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>{formatCurrency(contract.mrr)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {totalSlots} vaga{totalSlots !== 1 ? "s" : ""}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
