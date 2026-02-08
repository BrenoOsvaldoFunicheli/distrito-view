"use client";

import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUpcomingNeeds } from "@/hooks/use-dashboard";
import { RoleBadge } from "@/components/shared/role-badge";

export function UpcomingNeeds() {
  const { data } = useUpcomingNeeds(365);
  const needs = data?.data || [];

  const grouped = needs.reduce(
    (acc, need) => {
      const key = need.contract_id;
      if (!acc[key]) {
        acc[key] = {
          contract_name: need.contract_name,
          client_name: need.client_name,
          start_date: need.start_date,
          end_date: need.end_date,
          needs: [],
        };
      }
      acc[key].needs.push(need);
      return acc;
    },
    {} as Record<
      number,
      {
        contract_name: string;
        client_name: string;
        start_date: string;
        end_date: string;
        needs: typeof needs;
      }
    >,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarPlus className="h-5 w-5" />
          Necessidades de Alocacao
        </CardTitle>
        <CardDescription>Vagas abertas em contratos</CardDescription>
      </CardHeader>
      <CardContent>
        {Object.keys(grouped).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todas as vagas estao preenchidas.
          </p>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {Object.entries(grouped)
              .slice(0, 10)
              .map(([contractId, group]) => (
                <div key={contractId} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Link
                        href={`/contracts/${contractId}`}
                        className="font-medium hover:underline"
                      >
                        {group.contract_name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {group.client_name} |{" "}
                        {new Date(group.start_date).toLocaleDateString("pt-BR")}{" "}
                        - {new Date(group.end_date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    {group.needs.map((need) => (
                      <div
                        key={need.contract_role_id}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <RoleBadge name={need.role_name} />
                          <span className="text-muted-foreground">
                            {need.filled_quantity}/{need.needed_quantity} (
                            {need.allocation_percentage}%)
                          </span>
                        </div>
                        <Link
                          href={`/allocations/new?contract_role_id=${need.contract_role_id}`}
                        >
                          <Button size="sm" variant="outline">
                            Alocar
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
