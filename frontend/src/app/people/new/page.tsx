"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { useRoles } from "@/hooks/use-roles";
import { api } from "@/lib/api";

export default function NewPersonPage() {
  const router = useRouter();
  const { data: roles } = useRoles();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [primaryRole, setPrimaryRole] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleRole = (roleId: number) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/api/v1/people", {
        name,
        email,
        notes: notes || null,
        role_ids: selectedRoles,
        primary_role_id: primaryRole,
      });
      router.push("/people");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar pessoa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Nova Pessoa" />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Dados da Pessoa</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Especialidades</Label>
              <div className="flex flex-wrap gap-2">
                {roles?.map((role) => (
                  <Button
                    key={role.id}
                    type="button"
                    variant={
                      selectedRoles.includes(role.id) ? "default" : "outline"
                    }
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
              <Label htmlFor="notes">Observacoes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Criar Pessoa"}
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
