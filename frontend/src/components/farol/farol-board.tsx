"use client";

import Link from "next/link";
import { useFarolBoard } from "@/hooks/use-farol";
import type { FarolBoardCell } from "@/lib/types";
import { FarolCell } from "./farol-cell";

export function FarolBoardTable() {
  const { data, mutate, isLoading } = useFarolBoard();

  if (isLoading)
    return <div className="animate-pulse h-64 bg-muted rounded-lg" />;

  if (!data || data.criteria.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum critério cadastrado. Clique em "Editar Critérios" para começar.
      </p>
    );

  if (data.clients.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum cliente com contrato ativo.
      </p>
    );

  // Index cells by (criterion_id, client_id) for fast lookup
  const cellMap = new Map<string, FarolBoardCell>();
  data.cells.forEach((c) => {
    cellMap.set(`${c.criterion_id}:${c.client_id}`, c);
  });

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted/40">
            <th className="sticky left-0 z-10 bg-muted/40 border-b border-r px-3 py-2 text-left text-xs font-semibold uppercase">
              Critério
            </th>
            {data.clients.map((client) => (
              <th
                key={client.id}
                className="border-b px-2 py-2 text-xs font-semibold whitespace-nowrap"
              >
                <Link
                  href={`/clients/${client.id}`}
                  className="hover:underline"
                >
                  {client.name}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.criteria.map((criterion) => (
            <tr key={criterion.id} className="border-b">
              <td className="sticky left-0 z-10 bg-background border-r px-3 py-2 text-sm font-medium">
                {criterion.label}
              </td>
              {data.clients.map((client) => {
                const cell = cellMap.get(`${criterion.id}:${client.id}`);
                if (!cell) return <td key={client.id} className="border-l" />;
                return (
                  <td
                    key={client.id}
                    className="border-l p-0 text-center align-middle"
                  >
                    <FarolCell
                      criterion={criterion}
                      cell={cell}
                      onChanged={() => mutate()}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
