"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { useClients } from "@/hooks/use-clients";
import { useRoles } from "@/hooks/use-roles";
import { api } from "@/lib/api";

interface RoleRequirement {
  role_id: number;
  allocation_percentage: number;
  quantity: number;
}

export default function NewContractPage() {
  const router = useRouter();
  const { data: clients } = useClients();
  const { data: roles } = useRoles();
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
  const [roleReqs, setRoleReqs] = useState<RoleRequirement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addRole = () => {
    setRoleReqs([
      ...roleReqs,
      { role_id: roles?.[0]?.id || 1, allocation_percentage: 100, quantity: 1 },
    ]);
  };

  const removeRole = (index: number) => {
    setRoleReqs(roleReqs.filter((_, i) => i !== index));
  };

  const updateRole = (index: number, field: string, value: number) => {
    const updated = [...roleReqs];
    updated[index] = { ...updated[index], [field]: value };
    setRoleReqs(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/api/v1/contracts", {
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
        roles: roleReqs,
      });
      router.push("/contracts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar contrato");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Novo Contrato" />
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Dados do Contrato</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
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
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Contrato</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
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
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Inicio</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data Fim</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="planType">Tipo de Plano</Label>
                <Input
                  id="planType"
                  value={planType}
                  onChange={(e) => setPlanType(e.target.value)}
                  placeholder="Ex: Squad AI Factory"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                <Input
                  id="paymentMethod"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  placeholder="Ex: Mensal"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mrr">MRR (R$)</Label>
                <Input
                  id="mrr"
                  type="number"
                  step="0.01"
                  value={mrr}
                  onChange={(e) => setMrr(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalValue">Valor Total (R$)</Label>
                <Input
                  id="totalValue"
                  type="number"
                  step="0.01"
                  value={totalValue}
                  onChange={(e) => setTotalValue(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Requisitos de Roles</Label>
                <Button type="button" variant="outline" size="sm" onClick={addRole}>
                  <Plus className="mr-1 h-4 w-4" />
                  Adicionar Role
                </Button>
              </div>
              {roleReqs.map((req, index) => (
                <div key={index} className="flex items-center gap-2 rounded border p-2">
                  <select
                    className="flex-1 rounded border px-2 py-1 text-sm"
                    value={req.role_id}
                    onChange={(e) =>
                      updateRole(index, "role_id", parseInt(e.target.value))
                    }
                  >
                    {roles?.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    className="w-20"
                    placeholder="%"
                    value={req.allocation_percentage}
                    onChange={(e) =>
                      updateRole(
                        index,
                        "allocation_percentage",
                        parseInt(e.target.value),
                      )
                    }
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                  <Input
                    type="number"
                    min="1"
                    className="w-16"
                    placeholder="Qty"
                    value={req.quantity}
                    onChange={(e) =>
                      updateRole(index, "quantity", parseInt(e.target.value))
                    }
                  />
                  <span className="text-sm text-muted-foreground">pessoas</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRole(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observacoes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Criar Contrato"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
