"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { useClient } from "@/hooks/use-clients";
import { useContracts } from "@/hooks/use-contracts";

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const clientId = parseInt(id);
  const { data: client } = useClient(clientId);
  const { data: contracts } = useContracts(undefined, clientId);

  if (!client) {
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
        <Link href="/clients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>

      <PageHeader title={client.name} description={client.sector || undefined} />

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Contato</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{client.contact_name || "Nao informado"}</p>
            <p className="text-sm text-muted-foreground">
              {client.contact_email || ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Contratos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {contracts?.filter((c) => c.status === "active").length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Setor</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{client.sector || "Nao informado"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contratos</CardTitle>
        </CardHeader>
        <CardContent>
          {!contracts || contracts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum contrato registrado.
            </p>
          ) : (
            <div className="space-y-3">
              {contracts.map((contract) => (
                <Link
                  key={contract.id}
                  href={`/contracts/${contract.id}`}
                  className="block rounded-lg border p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{contract.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {contract.plan_type} |{" "}
                        {new Date(contract.start_date).toLocaleDateString(
                          "pt-BR",
                        )}{" "}
                        -{" "}
                        {new Date(contract.end_date).toLocaleDateString(
                          "pt-BR",
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={contract.status} />
                      <p className="mt-1 text-sm font-medium">
                        {formatCurrency(contract.mrr)}/mes
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
