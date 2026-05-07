"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { usePerson } from "@/hooks/use-people";
import { useRoles } from "@/hooks/use-roles";
import { api } from "@/lib/api";

export default function EditPersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const personId = parseInt(id);
  const router = useRouter();
  const { data: person } = usePerson(personId);
  const { data: roles } = useRoles();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [primaryRole, setPrimaryRole] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!person) return;
    setName(person.name);
    setEmail(person.email);
    setCompany(person.company ?? "");
    setNotes(person.notes ?? "");
    setIsActive(person.is_active);
    const roleIds = person.roles.map((pr) => pr.role.id);
    setSelectedRoles(roleIds);
    const primary = person.roles.find((pr) => pr.is_primary);
    setPrimaryRole(primary?.role.id ?? null);
  }, [person]);

  const toggleRole = (roleId: number) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.put(`/api/v1/people/${personId}`, {
        name,
        email,
        company: company || null,
        notes: notes || null,
        is_active: isActive,
        role_ids: selectedRoles,
        primary_role_id: primaryRole,
      });
      router.push(`/people/${personId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar pessoa");
    } finally {
      setLoading(false);
    }
  };

  if (!person) return <div className="animate-pulse h-64 bg-muted rounded-lg" />;

  return (
    <div className="space-y-6">
      <PageHeader title={`Editar — ${person.name}`} />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Dados da Pessoa</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Ex: Distrito" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsActive(true)}
                  >
                    Ativo
                  </Button>
                  <Button
                    type="button"
                    variant={!isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsActive(false)}
                  >
                    Inativo
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Especialidades</Label>
              <div className="flex flex-wrap gap-2">
                {roles?.map((role) => (
                  <Button
                    key={role.id}
                    type="button"
                    variant={selectedRoles.includes(role.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleRole(role.id)}
                  >
                    {role.name}
                  </Button>
                ))}
              </div>
            </div>

            {selectedRoles.length > 0 && (
              <div className="space-y-2">
                <Label>Especialidade Principal</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedRoles.map((rid) => {
                    const role = roles?.find((r) => r.id === rid);
                    return (
                      <Button
                        key={rid}
                        type="button"
                        variant={primaryRole === rid ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPrimaryRole(rid)}
                      >
                        {role?.name}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

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
