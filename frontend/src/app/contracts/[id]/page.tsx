"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { RoleBadge } from "@/components/shared/role-badge";
import { PercentageBadge } from "@/components/shared/percentage-badge";
import { useContract } from "@/hooks/use-contracts";
import { useAllocations } from "@/hooks/use-allocations";
import { usePeople } from "@/hooks/use-people";
import { useRoles } from "@/hooks/use-roles";
import { api } from "@/lib/api";
import type { ContractRole } from "@/lib/types";

type VagaForm = {
  role_id: string;
  allocation_percentage: string;
  quantity: string;
  start_date: string;
  end_date: string;
};

export default function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const contractId = parseInt(id);
  const router = useRouter();
  const { data: contract, mutate } = useContract(contractId);
  const { data: allocations, mutate: mutateAllocations } = useAllocations(undefined, contractId);
  const { data: people } = usePeople();
  const { data: roles } = useRoles();

  // modal alocar pessoa
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<ContractRole | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    person_id: "",
    allocation_percentage: "100",
    start_date: "",
    end_date: "",
  });

  function openModal(cr: ContractRole) {
    setSelectedRole(cr);
    setForm({
      person_id: "",
      allocation_percentage: String(cr.allocation_percentage),
      start_date: (cr.start_date ?? contract?.start_date)?.slice(0, 10) ?? "",
      end_date: (cr.end_date ?? contract?.end_date)?.slice(0, 10) ?? "",
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!selectedRole || !form.person_id) return;
    setSaving(true);
    setError(null);
    try {
      await api.post("/api/v1/allocations", {
        person_id: Number(form.person_id),
        contract_role_id: selectedRole.id,
        allocation_percentage: Number(form.allocation_percentage),
        start_date: form.start_date,
        end_date: form.end_date,
      });
      mutateAllocations();
      setModalOpen(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao criar alocação";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  // modal criar/editar vaga
  const [vagaModalOpen, setVagaModalOpen] = useState(false);
  const [editingVaga, setEditingVaga] = useState<ContractRole | null>(null);
  const [vagaSaving, setVagaSaving] = useState(false);
  const [vagaError, setVagaError] = useState<string | null>(null);
  const [vagaForm, setVagaForm] = useState<VagaForm>({
    role_id: "",
    allocation_percentage: "100",
    quantity: "1",
    start_date: "",
    end_date: "",
  });

  function openNewVagaModal() {
    setEditingVaga(null);
    setVagaForm({
      role_id: roles?.[0] ? String(roles[0].id) : "",
      allocation_percentage: "100",
      quantity: "1",
      start_date: "",
      end_date: "",
    });
    setVagaError(null);
    setVagaModalOpen(true);
  }

  function openEditVagaModal(cr: ContractRole) {
    setEditingVaga(cr);
    setVagaForm({
      role_id: String(cr.role.id),
      allocation_percentage: String(cr.allocation_percentage),
      quantity: String(cr.quantity),
      start_date: cr.start_date ?? "",
      end_date: cr.end_date ?? "",
    });
    setVagaError(null);
    setVagaModalOpen(true);
  }

  async function handleVagaSave() {
    if (!vagaForm.role_id) return;
    setVagaSaving(true);
    setVagaError(null);
    const body = {
      role_id: Number(vagaForm.role_id),
      allocation_percentage: Number(vagaForm.allocation_percentage),
      quantity: Number(vagaForm.quantity),
      start_date: vagaForm.start_date || null,
      end_date: vagaForm.end_date || null,
    };
    try {
      if (editingVaga) {
        await api.put(`/api/v1/contracts/${contractId}/roles/${editingVaga.id}`, body);
      } else {
        await api.post(`/api/v1/contracts/${contractId}/roles`, body);
      }
      mutate();
      setVagaModalOpen(false);
    } catch (e: unknown) {
      setVagaError(e instanceof Error ? e.message : "Erro ao salvar vaga");
    } finally {
      setVagaSaving(false);
    }
  }

  async function handleDeleteVaga(crId: number) {
    if (!confirm("Excluir vaga?")) return;
    await api.delete(`/api/v1/contracts/${contractId}/roles/${crId}`);
    mutate();
  }

  async function handleDeleteAllocation(allocationId: number) {
    if (!confirm("Remover alocação?")) return;
    await api.delete(`/api/v1/allocations/${allocationId}`);
    mutateAllocations();
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await api.put(`/api/v1/contracts/${contractId}`, { status: newStatus });
      mutate();
    } catch {
      // silently fail
    }
  };

  const handleDeleteContract = async () => {
    if (!confirm("Excluir este contrato? Ele será marcado como cancelado.")) return;
    try {
      await api.delete(`/api/v1/contracts/${contractId}`);
      router.push("/contracts");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erro ao excluir contrato");
    }
  };

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
        actions={
          <div className="flex items-center gap-2">
            <select
              className="rounded-md border px-2 py-1 text-sm"
              value={contract.status}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="active">Ativo</option>
              <option value="pipeline">Pipeline</option>
              <option value="draft">Rascunho</option>
              <option value="completed">Concluido</option>
              <option value="cancelled">Cancelado</option>
            </select>
            <Link href={`/contracts/${contractId}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteContract}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          </div>
        }
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Vagas</CardTitle>
          <Button size="sm" variant="outline" onClick={openNewVagaModal}>
            <Plus className="mr-1 h-4 w-4" />
            Nova Vaga
          </Button>
        </CardHeader>
        <CardContent>
          {contract.contract_roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma vaga cadastrada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Período da vaga</TableHead>
                  <TableHead>Alocação</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Preenchido</TableHead>
                  <TableHead>Pessoas alocadas</TableHead>
                  <TableHead className="w-28"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contract.contract_roles.map((cr) => {
                  const roleAllocations = allocations?.filter((a) => a.contract_role_id === cr.id) ?? [];
                  const filled = roleAllocations.length;
                  return (
                    <TableRow key={cr.id}>
                      <TableCell>
                        <RoleBadge name={cr.role.name} />
                      </TableCell>
                      <TableCell>
                        {cr.start_date && cr.end_date ? (
                          <span className="text-sm">
                            {new Date(cr.start_date).toLocaleDateString("pt-BR")} →{" "}
                            {new Date(cr.end_date).toLocaleDateString("pt-BR")}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Pelo contrato inteiro
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <PercentageBadge percentage={cr.allocation_percentage} />
                      </TableCell>
                      <TableCell>{cr.quantity}</TableCell>
                      <TableCell>
                        <span className={filled >= cr.quantity ? "text-green-600" : "text-yellow-600"}>
                          {filled}/{cr.quantity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {roleAllocations.length === 0 ? (
                            <span className="text-muted-foreground text-xs">Nenhum</span>
                          ) : (
                            roleAllocations.map((a) => (
                              <div key={a.id} className="flex items-center gap-2 text-sm">
                                <Link href={`/people/${a.person_id}`} className="hover:underline">
                                  {a.person_name}
                                </Link>
                                <span className="text-muted-foreground text-xs">
                                  {new Date(a.start_date).toLocaleDateString("pt-BR")} – {new Date(a.end_date).toLocaleDateString("pt-BR")}
                                </span>
                                <button
                                  onClick={() => handleDeleteAllocation(a.id)}
                                  className="text-muted-foreground hover:text-red-600"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openModal(cr)} title="Alocar pessoa">
                            <UserPlus className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditVagaModal(cr)} title="Editar vaga">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteVaga(cr.id)} title="Excluir vaga" className="hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal criar/editar vaga */}
      <Dialog open={vagaModalOpen} onOpenChange={setVagaModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVaga ? "Editar Vaga" : "Nova Vaga"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Role</Label>
              <Select
                value={vagaForm.role_id}
                onValueChange={(v) => setVagaForm((f) => ({ ...f, role_id: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {roles?.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>% Alocação</Label>
                <Input
                  type="number" min={1} max={100}
                  value={vagaForm.allocation_percentage}
                  onChange={(e) => setVagaForm((f) => ({ ...f, allocation_percentage: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Quantidade</Label>
                <Input
                  type="number" min={1}
                  value={vagaForm.quantity}
                  onChange={(e) => setVagaForm((f) => ({ ...f, quantity: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Período da vaga (opcional)</Label>
              <p className="text-xs text-muted-foreground">
                Em branco = vaga vale pelo contrato inteiro.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="date"
                  value={vagaForm.start_date}
                  onChange={(e) =>
                    setVagaForm((f) => ({ ...f, start_date: e.target.value }))
                  }
                />
                <Input
                  type="date"
                  value={vagaForm.end_date}
                  onChange={(e) =>
                    setVagaForm((f) => ({ ...f, end_date: e.target.value }))
                  }
                />
              </div>
            </div>
            {vagaError && <p className="text-sm text-red-600">{vagaError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVagaModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleVagaSave} disabled={vagaSaving || !vagaForm.role_id}>
              {vagaSaving ? "Salvando..." : editingVaga ? "Salvar" : "Criar Vaga"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal alocar pessoa */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Alocar pessoa — {selectedRole?.role.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Pessoa</Label>
              <Select
                value={form.person_id}
                onValueChange={(v) => setForm((f) => ({ ...f, person_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {people?.filter((p) => p.is_active).map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>% Alocação</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={form.allocation_percentage}
                onChange={(e) => setForm((f) => ({ ...f, allocation_percentage: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Início</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Fim</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.person_id}>
              <Plus className="mr-2 h-4 w-4" />
              {saving ? "Salvando..." : "Alocar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
