"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useClients } from "@/hooks/use-clients";
import { useRoles } from "@/hooks/use-roles";
import { api } from "@/lib/api";
import type { Contract, Proposal } from "@/lib/types";

interface ConvertDialogProps {
  proposal: Proposal | null;
  onClose: () => void;
  onDone: (contract: Contract) => void;
}

interface RoleRequirement {
  role_id: number;
  allocation_percentage: number;
  quantity: number;
  start_date?: string;
  end_date?: string;
}

type ClientMode = "existing" | "new";

export function ConvertDialog({ proposal, onClose, onDone }: ConvertDialogProps) {
  const { data: clients } = useClients();
  const { data: roles } = useRoles();

  const [clientMode, setClientMode] = useState<ClientMode>("new");
  const [existingClientId, setExistingClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientContactName, setClientContactName] = useState("");
  const [clientContactEmail, setClientContactEmail] = useState("");
  const [clientSector, setClientSector] = useState("");
  const [clientNotes, setClientNotes] = useState("");

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [planType, setPlanType] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [mrr, setMrr] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [contractNotes, setContractNotes] = useState("");
  const [roleReqs, setRoleReqs] = useState<RoleRequirement[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!proposal) return;
    setError("");
    setClientMode(proposal.client_id ? "existing" : "new");
    setExistingClientId(proposal.client_id ? String(proposal.client_id) : "");
    setClientName(proposal.client?.name || "");
    setClientContactName(proposal.contact_name || "");
    setClientContactEmail(proposal.contact_email || "");
    setClientSector("");
    setClientNotes("");
    setName(proposal.title);
    setStartDate(
      proposal.expected_start_date || new Date().toISOString().slice(0, 10),
    );
    setEndDate("");
    setPlanType("");
    setPaymentMethod("");
    setMrr("");
    setTotalValue(
      proposal.estimated_value != null ? String(proposal.estimated_value) : "",
    );
    setContractNotes(proposal.notes || "");
    setRoleReqs([]);
  }, [proposal]);

  const addRole = () => {
    setRoleReqs([
      ...roleReqs,
      { role_id: roles?.[0]?.id || 1, allocation_percentage: 100, quantity: 1 },
    ]);
  };

  const removeRole = (index: number) => {
    setRoleReqs(roleReqs.filter((_, i) => i !== index));
  };

  const updateRole = (
    index: number,
    field: keyof RoleRequirement,
    value: number | string,
  ) => {
    const updated = [...roleReqs];
    updated[index] = { ...updated[index], [field]: value };
    setRoleReqs(updated);
  };

  const proposalHasClient = !!proposal?.client_id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposal) return;
    setLoading(true);
    setError("");

    let newClient: object | null = null;
    if (!proposalHasClient && clientMode === "new") {
      if (!clientName.trim()) {
        setError("Nome do cliente é obrigatório.");
        setLoading(false);
        return;
      }
      newClient = {
        name: clientName,
        contact_name: clientContactName || null,
        contact_email: clientContactEmail || null,
        sector: clientSector || null,
        notes: clientNotes || null,
      };
    }

    if (!proposalHasClient && clientMode === "existing") {
      if (!existingClientId) {
        setError("Selecione um cliente existente.");
        setLoading(false);
        return;
      }
      try {
        await api.put(`/api/v1/proposals/${proposal.id}`, {
          client_id: parseInt(existingClientId),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao vincular cliente");
        setLoading(false);
        return;
      }
    }

    if (!startDate) {
      setError("Informe a data de início do contrato.");
      setLoading(false);
      return;
    }
    if (startDate !== proposal.expected_start_date) {
      try {
        await api.put(`/api/v1/proposals/${proposal.id}`, {
          expected_start_date: startDate,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao salvar previsão de início",
        );
        setLoading(false);
        return;
      }
    }

    const body = {
      new_client: newClient,
      contract: {
        name,
        start_date: startDate,
        end_date: endDate,
        status: "active",
        plan_type: planType || null,
        mrr: mrr ? parseFloat(mrr) : null,
        total_value: totalValue ? parseFloat(totalValue) : null,
        payment_method: paymentMethod || null,
        notes: contractNotes || null,
        roles: roleReqs.map((r) => ({
          role_id: r.role_id,
          allocation_percentage: r.allocation_percentage,
          quantity: r.quantity,
          start_date: r.start_date || null,
          end_date: r.end_date || null,
        })),
      },
    };

    try {
      const contract = await api.post<Contract>(
        `/api/v1/proposals/${proposal.id}/convert`,
        body,
      );
      onDone(contract);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao converter proposta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!proposal} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Converter em Contrato</DialogTitle>
          <DialogDescription>
            Crie o cliente (se necessário) e o contrato. Vagas pretendidas podem ser
            adicionadas depois.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground">
              Cliente
            </h3>
            {proposalHasClient ? (
              <div className="rounded border bg-muted/40 p-3 text-sm">
                Vinculado a: <strong>{proposal?.client?.name}</strong>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={clientMode === "new" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setClientMode("new")}
                  >
                    Novo cliente
                  </Button>
                  <Button
                    type="button"
                    variant={clientMode === "existing" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setClientMode("existing")}
                  >
                    Cliente existente
                  </Button>
                </div>
                {clientMode === "existing" ? (
                  <div className="space-y-2">
                    <Label htmlFor="existingClient">Selecionar cliente</Label>
                    <select
                      id="existingClient"
                      className="w-full rounded-md border px-3 py-2"
                      value={existingClientId}
                      onChange={(e) => setExistingClientId(e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {clients?.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="clientName">Nome do cliente</Label>
                      <Input
                        id="clientName"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        required={clientMode === "new"}
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="clientContactName">Contato</Label>
                        <Input
                          id="clientContactName"
                          value={clientContactName}
                          onChange={(e) => setClientContactName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="clientContactEmail">Email</Label>
                        <Input
                          id="clientContactEmail"
                          type="email"
                          value={clientContactEmail}
                          onChange={(e) => setClientContactEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientSector">Setor</Label>
                      <Input
                        id="clientSector"
                        value={clientSector}
                        onChange={(e) => setClientSector(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground">
              Contrato
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contractName">Nome do contrato</Label>
                <Input
                  id="contractName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="planType">Tipo de plano</Label>
                <Input
                  id="planType"
                  value={planType}
                  onChange={(e) => setPlanType(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data fim</Label>
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
                <Label htmlFor="totalValue">Valor total (R$)</Label>
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
              <Label htmlFor="paymentMethod">Forma de pagamento</Label>
              <Input
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractNotes">Observações</Label>
              <Textarea
                id="contractNotes"
                value={contractNotes}
                onChange={(e) => setContractNotes(e.target.value)}
              />
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground">
                Vagas pretendidas
              </h3>
              <Button type="button" variant="outline" size="sm" onClick={addRole}>
                <Plus className="mr-1 h-4 w-4" />
                Adicionar vaga
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Você pode adicionar vagas depois.
            </p>
            {roleReqs.map((req, index) => (
              <div key={index} className="space-y-2 rounded border p-2">
                <div className="flex items-center gap-2">
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
                <div className="flex items-center gap-2 pl-1">
                  <span className="text-xs text-muted-foreground">Período:</span>
                  <Input
                    type="date"
                    className="h-8 w-40"
                    value={req.start_date || ""}
                    onChange={(e) =>
                      updateRole(index, "start_date", e.target.value)
                    }
                  />
                  <span className="text-xs text-muted-foreground">→</span>
                  <Input
                    type="date"
                    className="h-8 w-40"
                    value={req.end_date || ""}
                    onChange={(e) =>
                      updateRole(index, "end_date", e.target.value)
                    }
                  />
                  <span className="text-xs text-muted-foreground">
                    (opcional)
                  </span>
                </div>
              </div>
            ))}
          </section>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Convertendo..." : "Confirmar Ganho"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
