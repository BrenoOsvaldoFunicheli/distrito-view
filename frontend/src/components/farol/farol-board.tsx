"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useFarolBoard } from "@/hooks/use-farol";
import type {
  FarolBoardCell,
  FarolCriterion,
  FarolGroup,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { FarolCell } from "./farol-cell";

interface FarolBoardTableProps {
  week: string;
}

const COLLAPSED_GROUPS_KEY = "distrito.farol.collapsedGroups";
const NO_GROUP_KEY = "__none__";

export function FarolBoardTable({ week }: FarolBoardTableProps) {
  const { data, mutate, isLoading } = useFarolBoard(week);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const stored = localStorage.getItem(COLLAPSED_GROUPS_KEY);
    if (stored) {
      try {
        setCollapsed(JSON.parse(stored));
      } catch {
        // ignore malformed
      }
    }
  }, []);

  const toggleGroup = (key: string) => {
    setCollapsed((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(COLLAPSED_GROUPS_KEY, JSON.stringify(next));
      return next;
    });
  };

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

  const cellMap = new Map<string, FarolBoardCell>();
  data.cells.forEach((c) => {
    cellMap.set(`${c.criterion_id}:${c.client_id}`, c);
  });

  const sections = buildSections(data.groups, data.criteria);
  const colSpanData = data.clients.length;

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
          {sections.map((section) => {
            const isCollapsed = !!collapsed[section.key];
            const showHeader = section.group !== null;
            return (
              <Fragment key={section.key}>
                {showHeader && (
                  <tr
                    className="border-b bg-muted/20 cursor-pointer hover:bg-muted/30"
                    onClick={() => toggleGroup(section.key)}
                  >
                    <td
                      className="sticky left-0 z-10 bg-muted/20 border-r px-3 py-1.5"
                      colSpan={1}
                    >
                      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <ChevronDown
                          className={cn(
                            "h-3 w-3 transition-transform",
                            isCollapsed && "-rotate-90",
                          )}
                        />
                        <span>{section.label}</span>
                        <span className="text-muted-foreground/60 font-normal normal-case">
                          ({section.criteria.length})
                        </span>
                      </div>
                    </td>
                    <td colSpan={colSpanData} className="px-2 py-1.5" />
                  </tr>
                )}
                {!isCollapsed &&
                  section.criteria.map((criterion) => (
                    <tr key={criterion.id} className="border-b">
                      <td
                        className={cn(
                          "sticky left-0 z-10 bg-background border-r px-3 py-2 text-sm font-medium",
                          showHeader && "pl-7",
                        )}
                      >
                        {criterion.label}
                      </td>
                      {data.clients.map((client) => {
                        const cell = cellMap.get(
                          `${criterion.id}:${client.id}`,
                        );
                        if (!cell)
                          return <td key={client.id} className="border-l" />;
                        return (
                          <td
                            key={client.id}
                            className="border-l p-0 text-center align-middle"
                          >
                            <FarolCell
                              criterion={criterion}
                              cell={cell}
                              week={week}
                              clientName={client.name}
                              onChanged={() => mutate()}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface Section {
  key: string;
  label: string;
  group: FarolGroup | null;
  criteria: FarolCriterion[];
}

function buildSections(
  groups: FarolGroup[],
  criteria: FarolCriterion[],
): Section[] {
  const byGroup = new Map<number, FarolCriterion[]>();
  const orphans: FarolCriterion[] = [];
  for (const c of criteria) {
    if (c.group_id == null) {
      orphans.push(c);
    } else {
      const list = byGroup.get(c.group_id) ?? [];
      list.push(c);
      byGroup.set(c.group_id, list);
    }
  }

  const sections: Section[] = [];
  if (orphans.length > 0) {
    sections.push({
      key: NO_GROUP_KEY,
      label: "Sem grupo",
      group: null,
      criteria: orphans,
    });
  }
  for (const g of groups) {
    const items = byGroup.get(g.id) ?? [];
    if (items.length === 0) continue;
    sections.push({
      key: String(g.id),
      label: g.label,
      group: g,
      criteria: items,
    });
  }
  return sections;
}
