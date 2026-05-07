"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useClients } from "@/hooks/use-clients";
import { api } from "@/lib/api";
import type { Client, Proposal } from "@/lib/types";

interface ProposalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposal?: Proposal | null;
  onSaved: () => void;
  onDeleted?: () => void;
}

type ClientMode = "none" | "existing" | "new";

export function ProposalFormDialog({
  open,
  onOpenChange,
  proposal,
  onSaved,
  onDeleted,
}: ProposalFormDialogProps) {
  const { data: clients, mutate: mutateClients } = useClients();
  const [title, setTitle] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [expectedCloseDate, setExpectedCloseDate] = useState("");
  const [expectedStartDate, setExpectedStartDate] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [clientMode, setClientMode] = useState<ClientMode>("none");
  const [clientId, setClientId] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newClientSector, setNewClientSector] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(proposal?.title || "");
      setContactName(proposal?.contact_name || "");
      setContactEmail(proposal?.contact_email || "");
      setEstimatedValue(
        proposal?.estimated_value != null ? String(proposal.estimated_value) : "",
      );
      setExpectedCloseDate(proposal?.expected_close_date || "");
      setExpectedStartDate(proposal?.expected_start_date || "");
      setSource(proposal?.source || "");
      setNotes(proposal?.notes || "");
      setClientId(proposal?.client_id ? String(proposal.client_id) : "");
      setClientMode(proposal?.client_id ? "existing" : "none");
      setNewClientName("");
      setNewClientSector("");
      setError("");
    }
  }, [open, proposal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    let resolvedClientId: number | null = null;
    if (clientMode === "existing") {
      resolvedClientId = clientId ? parseInt(clientId) : null;
    } else if (clientMode === "new") {
      if (!newClientName.trim()) {
        setError("Informe o nome da empresa.");
        setLoading(false);
        return;
      }
      try {
        const created = await api.post<Client>("/api/v1/clients", {
          name: newClientName.trim(),
          contact_name: contactName || null,
          contact_email: contactEmail || null,
          sector: newClientSector || null,
        });
        resolvedClientId = created.id;
        mutateClients();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao criar cliente");
        setLoading(false);
        return;
      }
    }

    const body = {
      title,
      contact_name: contactName || null,
      contact_email: contactEmail || null,
      estimated_value: estimatedValue ? parseFloat(estimatedValue) : null,
      expected_close_date: expectedCloseDate || null,
      expected_start_date: expectedStartDate || null,
      source: source || null,
      notes: notes || null,
      client_id: resolvedClientId,
    };
    try {
      if (proposal) {
        await api.put(`/api/v1/proposals/${proposal.id}`, body);
      } else {
        await api.post("/api/v1/proposals", { ...body, stage: "lead" });
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar proposta");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!proposal) return;
    if (!confirm("Excluir esta proposta?")) return;
    setLoading(true);
    try {
      await api.delete(`/api/v1/proposals/${proposal.id}`);
      onDeleted?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{proposal ? "Editar Proposta" : "Nova Proposta"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactName">Nome do Contato</Label>
              <Input
                id="contactName"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Email do Contato</Label>
              <Input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Empresa</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={clientMode === "none" ? "default" : "outline"}
                onClick={() => setClientMode("none")}
              >
                Sem empresa
              </Button>
              <Button
                type="button"
                size="sm"
                variant={clientMode === "existing" ? "default" : "outline"}
                onClick={() => setClientMode("existing")}
              >
                Existente
              </Button>
              <Button
                type="button"
                size="sm"
                variant={clientMode === "new" ? "default" : "outline"}
                onClick={() => setClientMode("new")}
              >
                Nova
              </Button>
            </div>
            {clientMode === "existing" && (
              <select
                className="w-full rounded-md border px-3 py-2"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                <option value="">Selecione...</option>
                {clients?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            {clientMode === "new" && (
              <div className="grid gap-2 md:grid-cols-2">
                <Input
                  placeholder="Nome da empresa"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  required
                />
                <Input
                  placeholder="Setor (opcional)"
                  value={newClientSector}
                  onChange={(e) => setNewClientSector(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="estimatedValue">Valor Estimado (R$)</Label>
              <Input
                id="estimatedValue"
                type="number"
                step="0.01"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedCloseDate">Fechamento Previsto</Label>
              <Input
                id="expectedCloseDate"
                type="date"
                value={expectedCloseDate}
                onChange={(e) => setExpectedCloseDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedStartDate">Início Previsto</Label>
              <Input
                id="expectedStartDate"
                type="date"
                value={expectedStartDate}
                onChange={(e) => setExpectedStartDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Obrigatório para converter em contrato.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Fonte</Label>
            <Input
              id="source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Ex: Indicação, Inbound, Evento"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter>
            {proposal && (
              <Button
                type="button"
                variant="ghost"
                className="text-red-600 hover:text-red-700"
                onClick={handleDelete}
                disabled={loading}
              >
                Excluir
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
