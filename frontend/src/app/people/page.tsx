"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { RoleBadge } from "@/components/shared/role-badge";
import { usePeople } from "@/hooks/use-people";

export default function PeoplePage() {
  const { data: people, isLoading } = usePeople();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pessoas"
        description="Engenheiros e profissionais da equipe"
        actions={
          <Link href="/people/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Pessoa
            </Button>
          </Link>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Especialidades</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {people?.map((person) => (
                <TableRow key={person.id}>
                  <TableCell>
                    <Link
                      href={`/people/${person.id}`}
                      className="font-medium hover:underline"
                    >
                      {person.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {person.email}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {person.roles.map((pr) => (
                        <RoleBadge
                          key={pr.role.id}
                          name={pr.role.name}
                          isPrimary={pr.is_primary}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        person.is_active ? "text-green-600" : "text-red-600"
                      }
                    >
                      {person.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
