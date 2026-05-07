"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { useContract } from "@/hooks/use-contracts";
import { useClients } from "@/hooks/use-clients";
import { api } from "@/lib/api";

export default function EditContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const contractId = parseInt(id);
  const router = useRouter();
  const { data: contract } = useContract(contractId);
  const { data: clients } = useClients();

  const [clientId, setClientId] = useState("");
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("active");
  const [planType, setPlanType] = useState("");
  const [mrr, setMrr] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!contract) return;
    setClientId(String(contract.client.id));
    setName(contract.name);
    setStartDate(contract.start_date.slice(0, 10));
    setEndDate(contract.end_date.slice(0, 10));
    setStatus(contract.status);
    setPlanType(contract.plan_type ?? "");
    setMrr(contract.mrr != null ? String(contract.mrr) : "");
    setTotalValue(contract.total_value != null ? String(contract.total_value) : "");
    setPaymentMethod(contract.payment_method ?? "");
    setNotes(contract.notes ?? "");
  }, [contract]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.put(`/api/v1/contracts/${contractId}`, {
        client_id: parseInt(clientId),
        name,
        start_date: startDate,
        end_date: endDate,
        status,
        plan_type: planType || null,
        mrr: mrr ? parseFloat(mrr) : null,
        total_value: totalValue ? parseFloat(totalValue) : null,
        payment_method: paymentMethod || null,
        notes: notes || null,
      });
      router.push(`/contracts/${contractId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar contrato");
    } finally {
      setLoading(false);
    }
  };

  if (!contract) return <div className="animate-pulse h-64 bg-muted rounded-lg" />;

  return (
    <div className="space-y-6">
      <PageHeader title={`Editar — ${contract.name}`} />
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Dados do Contrato</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="client">Cliente</Label>
              <select
                id="client"
                className="w-full rounded-md border px-3 py-2"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
              >
                <option value="">Selecione...</option>
                {clients?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Contrato</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="w-full rounded-md border px-3 py-2"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="active">Ativo</option>
                  <option value="pipeline">Pipeline</option>
                  <option value="draft">Rascunho</option>
                  <option value="completed">Concluído</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Início</Label>
                <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data Fim</Label>
                <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="planType">Tipo de Plano</Label>
                <Input id="planType" value={planType} onChange={(e) => setPlanType(e.target.value)} placeholder="Ex: Squad AI Factory" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                <Input id="paymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} placeholder="Ex: Mensal" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mrr">MRR (R$)</Label>
                <Input id="mrr" type="number" step="0.01" value={mrr} onChange={(e) => setMrr(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalValue">Valor Total (R$)</Label>
                <Input id="totalValue" type="number" step="0.01" value={totalValue} onChange={(e) => setTotalValue(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
