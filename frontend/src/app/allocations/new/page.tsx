"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { RoleBadge } from "@/components/shared/role-badge";
import { usePeople } from "@/hooks/use-people";
import { useContracts } from "@/hooks/use-contracts";
import { api } from "@/lib/api";

function NewAllocationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialContractRoleId = searchParams.get("contract_role_id") || "";
  const initialPersonId = searchParams.get("person_id") || "";

  const { data: people } = usePeople();
  const { data: contracts } = useContracts();

  const [contractRoleId, setContractRoleId] = useState(initialContractRoleId);
  const [personId, setPersonId] = useState(initialPersonId);
  const [percentage, setPercentage] = useState("100");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Build a flat list of contract roles for selection
  const contractRoleOptions =
    contracts?.flatMap((c) =>
      c.contract_roles.map((cr) => ({
        id: cr.id,
        label: `${c.client.name} - ${c.name} (${cr.role.name} ${cr.allocation_percentage}%)`,
        roleName: cr.role.name,
        contractStartDate: c.start_date,
        contractEndDate: c.end_date,
        roleStartDate: cr.start_date,
        roleEndDate: cr.end_date,
      })),
    ) || [];

  const selectedCR = contractRoleOptions.find(
    (cr) => String(cr.id) === contractRoleId,
  );

  // Janela efetiva: vaga pode ter datas próprias; senão usa as do contrato
  // Se a janela da vaga for inválida (end <= start), cai pra janela do contrato.
  const roleWindowValid =
    selectedCR?.roleStartDate &&
    selectedCR?.roleEndDate &&
    selectedCR.roleEndDate > selectedCR.roleStartDate;
  const effectiveStart = roleWindowValid
    ? selectedCR!.roleStartDate!
    : selectedCR?.contractStartDate;
  const effectiveEnd = roleWindowValid
    ? selectedCR!.roleEndDate!
    : selectedCR?.contractEndDate;

  // Auto-fill dates from contract when selecting a contract role
  const handleContractRoleChange = (value: string) => {
    setContractRoleId(value);
    const cr = contractRoleOptions.find((c) => String(c.id) === value);
    if (cr) {
      const validRoleWindow =
        cr.roleStartDate &&
        cr.roleEndDate &&
        cr.roleEndDate > cr.roleStartDate;
      const start = validRoleWindow ? cr.roleStartDate! : cr.contractStartDate;
      const end = validRoleWindow ? cr.roleEndDate! : cr.contractEndDate;
      if (!startDate) setStartDate(start);
      if (!endDate) setEndDate(end);
    }
  };

  const submit = async (start: string, end: string) => {
    if (!start || !end) {
      setError("Preencha as datas de início e fim.");
      return;
    }
    if (end <= start) {
      setError("Data fim deve ser posterior à data início.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.post("/api/v1/allocations", {
        person_id: parseInt(personId),
        contract_role_id: parseInt(contractRoleId),
        allocation_percentage: parseInt(percentage),
        start_date: start,
        end_date: end,
        notes: notes || null,
      });
      router.push("/allocations");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar alocacao");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submit(startDate, endDate);
  };

  const handleAllocateForProjectDuration = () => {
    if (!effectiveStart || !effectiveEnd) {
      setError("Selecione uma vaga antes de usar este atalho.");
      return;
    }
    setStartDate(effectiveStart);
    setEndDate(effectiveEnd);
    setError("");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Nova Alocacao" />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Atribuir Pessoa a Contrato</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded bg-red-50 p-3 text-sm text-red-600 whitespace-pre-wrap">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="contractRole">Vaga do Contrato</Label>
              <select
                id="contractRole"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={contractRoleId}
                onChange={(e) => handleContractRoleChange(e.target.value)}
                required
              >
                <option value="">Selecione uma vaga...</option>
                {contractRoleOptions.map((cr) => (
                  <option key={cr.id} value={cr.id}>
                    {cr.label}
                  </option>
                ))}
              </select>
              {selectedCR && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <RoleBadge name={selectedCR.roleName} />
                  <span>
                    {new Date(selectedCR.contractStartDate).toLocaleDateString(
                      "pt-BR",
                    )}{" "}
                    -{" "}
                    {new Date(selectedCR.contractEndDate).toLocaleDateString(
                      "pt-BR",
                    )}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="person">Pessoa</Label>
              <select
                id="person"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                required
              >
                <option value="">Selecione uma pessoa...</option>
                {people?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.roles.map((r) => r.role.name).join(", ")})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="percentage">Porcentagem de Alocacao</Label>
              <Input
                id="percentage"
                type="number"
                min="1"
                max="100"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                required
              />
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

            <div className="space-y-2">
              <Label htmlFor="notes">Observacoes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Criar Alocacao"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleAllocateForProjectDuration}
                disabled={loading || !effectiveStart || !effectiveEnd}
                title={
                  effectiveStart && effectiveEnd
                    ? `${new Date(effectiveStart).toLocaleDateString(
                        "pt-BR",
                      )} → ${new Date(effectiveEnd).toLocaleDateString("pt-BR")}`
                    : undefined
                }
              >
                <CalendarClock className="mr-2 h-4 w-4" />
                Alocar pelo período do projeto
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

export default function NewAllocationPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-64 bg-muted rounded-lg" />}>
      <NewAllocationForm />
    </Suspense>
  );
}
