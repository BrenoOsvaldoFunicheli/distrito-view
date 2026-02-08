"use client";

import { AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUnallocated } from "@/hooks/use-dashboard";
import { RoleBadge } from "@/components/shared/role-badge";

export function AlertsPanel() {
  const { data } = useUnallocated(90);
  const people = data?.data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Desalocacoes Proximas
        </CardTitle>
        <CardDescription>
          Pessoas ficando desalocadas nos proximos 90 dias
        </CardDescription>
      </CardHeader>
      <CardContent>
        {people.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma desalocacao proxima. Todas as pessoas estao no bench.
          </p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {people.map((person) => {
              const days = person.days_until_unallocated;
              let urgencyColor = "bg-green-100 text-green-800";
              if (days !== null && days < 7) {
                urgencyColor = "bg-red-100 text-red-800";
              } else if (days !== null && days < 21) {
                urgencyColor = "bg-yellow-100 text-yellow-800";
              }

              return (
                <div
                  key={person.person_id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{person.person_name}</p>
                    <div className="flex gap-1">
                      {person.roles.map((r) => (
                        <RoleBadge key={r} name={r} />
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className={urgencyColor}>
                      {days !== null ? `${days} dias` : "No bench"}
                    </Badge>
                    {person.current_allocation_ends && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Ate{" "}
                        {new Date(
                          person.current_allocation_ends,
                        ).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
