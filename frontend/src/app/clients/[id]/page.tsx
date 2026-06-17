"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EditClientDialog } from "@/components/clients/edit-client-dialog";
import { useClient } from "@/hooks/use-clients";
import { useContracts } from "@/hooks/use-contracts";
import { useFarolClientSummary } from "@/hooks/use-farol";
import type { FarolColor } from "@/lib/types";
import { cn } from "@/lib/utils";

const FAROL_DOT: Record<FarolColor, string> = {
  red: "bg-red-500",
  yellow: "bg-yellow-400",
  green: "bg-green-500",
  none: "bg-muted-foreground/30",
};

const FAROL_LABEL: Record<FarolColor, string> = {
  red: "Crítico",
  yellow: "Atenção",
  green: "Saudável",
  none: "Sem dados",
};

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const clientId = parseInt(id);
  const { data: client, mutate: mutateClient } = useClient(clientId);
  const { data: contracts } = useContracts(undefined, clientId);
  const { data: farol } = useFarolClientSummary(clientId);
  const [editing, setEditing] = useState(false);

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

      <PageHeader
        title={client.name}
        description={client.sector || undefined}
        actions={
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        }
      />

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
          <CardTitle>Farol Geral</CardTitle>
        </CardHeader>
        <CardContent>
          {!farol ? (
            <div className="h-6 animate-pulse rounded bg-muted" />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "inline-block h-5 w-5 rounded-full",
                    FAROL_DOT[farol.color],
                  )}
                />
                <span className="text-lg font-semibold">
                  {FAROL_LABEL[farol.color]}
                </span>
                <span className="text-sm text-muted-foreground">
                  (média dos projetos ativos)
                </span>
              </div>
              {farol.projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum projeto ativo para este cliente.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {farol.projects.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs"
                    >
                      <span
                        className={cn(
                          "inline-block h-2.5 w-2.5 rounded-full",
                          FAROL_DOT[p.color],
                        )}
                      />
                      {p.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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

      <EditClientDialog
        open={editing}
        onOpenChange={setEditing}
        client={client}
        onSaved={() => mutateClient()}
      />
    </div>
  );
}
