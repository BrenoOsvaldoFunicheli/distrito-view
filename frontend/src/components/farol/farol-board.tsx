"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useFarolBoard } from "@/hooks/use-farol";
import type {
  FarolBoardCell,
  FarolBoardColumn,
  FarolColor,
  FarolCriterion,
  FarolGroup,
  FarolScope,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { FarolCell } from "./farol-cell";

interface FarolBoardTableProps {
  week: string;
  scope: FarolScope;
}

const COLLAPSED_GROUPS_KEY = "distrito.farol.collapsedGroups";
const NO_GROUP_KEY = "__none__";

export function FarolBoardTable({ week, scope }: FarolBoardTableProps) {
  const { data, mutate, isLoading } = useFarolBoard(week, scope);
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

  if (data.columns.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        {scope === "client"
          ? "Nenhum cliente com contrato ativo."
          : "Nenhum projeto ativo."}
      </p>
    );

  const cellMap = new Map<string, FarolBoardCell>();
  data.cells.forEach((c) => {
    cellMap.set(`${c.criterion_id}:${c.column_id}`, c);
  });

  const sections = buildSections(data.groups, data.criteria);

  const isHierarchical = scope === "hierarchical";
  // Agrupa colunas contíguas por cliente (scope hierarchical).
  const clientGroups = isHierarchical ? buildClientGroups(data.columns) : [];

  const columnLink = (col: FarolBoardColumn) => {
    if (scope === "client") return `/clients/${col.id}`;
    if (isHierarchical && col.client_id != null)
      return `/clients/${col.client_id}`;
    return `/portfolio`;
  };

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full border-collapse text-sm">
        <thead>
          {isHierarchical && (
            <tr className="bg-muted/60">
              <th className="sticky left-0 z-10 bg-muted/60 border-b border-r px-3 py-2 text-left text-xs font-semibold uppercase">
                Cliente
              </th>
              {clientGroups.map((g) => (
                <th
                  key={g.clientId}
                  colSpan={g.span}
                  className="border-b border-l px-2 py-2 text-xs font-semibold whitespace-nowrap text-center"
                >
                  <Link
                    href={`/clients/${g.clientId}`}
                    className="hover:underline"
                  >
                    {g.clientName}
                  </Link>
                </th>
              ))}
            </tr>
          )}
          <tr className="bg-muted/40">
            <th className="sticky left-0 z-10 bg-muted/40 border-b border-r px-3 py-2 text-left text-xs font-semibold uppercase">
              Critério
            </th>
            {data.columns.map((col) => (
              <th
                key={col.id}
                className={cn(
                  "border-b border-l px-2 py-2 text-xs font-semibold whitespace-nowrap",
                  col.is_client_summary && "bg-muted/60 italic",
                )}
              >
                <Link href={columnLink(col)} className="hover:underline">
                  {col.is_client_summary ? "Resumo" : col.name}
                </Link>
                {!isHierarchical && col.subtitle && (
                  <div className="text-[10px] font-normal text-muted-foreground normal-case">
                    {col.subtitle}
                  </div>
                )}
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
                    {data.columns.map((col) => {
                      const color = computeGroupColor(
                        section.criteria,
                        col.id,
                        cellMap,
                      );
                      return (
                        <td
                          key={col.id}
                          className={cn(
                            "border-l p-0 text-center align-middle",
                            col.is_client_summary && "border-l-2 border-l-foreground/20",
                            COLOR_BG[color],
                          )}
                        >
                          <div className="h-6 w-full" />
                        </td>
                      );
                    })}
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
                      {data.columns.map((col) => {
                        const cell = cellMap.get(
                          `${criterion.id}:${col.id}`,
                        );
                        if (!cell)
                          return (
                            <td
                              key={col.id}
                              className={cn(
                                "border-l",
                                col.is_client_summary &&
                                  "border-l-2 border-l-foreground/20",
                              )}
                            />
                          );
                        return (
                          <td
                            key={col.id}
                            className={cn(
                              "border-l p-0 text-center align-middle",
                              col.is_client_summary &&
                                "border-l-2 border-l-foreground/20",
                            )}
                          >
                            <FarolCell
                              criterion={criterion}
                              cell={cell}
                              week={week}
                              scope={scope}
                              columnName={col.name}
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

const COLOR_SCORE: Record<string, number> = { red: 3, yellow: 2, green: 1 };

const COLOR_BG: Record<FarolColor, string> = {
  red: "bg-red-200",
  yellow: "bg-yellow-200",
  green: "bg-green-200",
  none: "",
};

function computeGroupColor(
  criteria: FarolCriterion[],
  columnId: number,
  cellMap: Map<string, FarolBoardCell>,
): FarolColor {
  let sum = 0;
  let count = 0;
  for (const c of criteria) {
    if (!c.show_color) continue;
    const cell = cellMap.get(`${c.id}:${columnId}`);
    const score = COLOR_SCORE[cell?.color ?? ""];
    if (score === undefined) continue;
    sum += score;
    count += 1;
  }
  if (count === 0) return "none";
  const avg = sum / count;
  if (avg >= 2.34) return "red";
  if (avg >= 1.67) return "yellow";
  return "green";
}

interface ClientGroup {
  clientId: number;
  clientName: string;
  span: number;
}

/** Agrupa colunas contíguas pelo client_id (scope hierarchical). */
function buildClientGroups(columns: FarolBoardColumn[]): ClientGroup[] {
  const groups: ClientGroup[] = [];
  for (const col of columns) {
    const clientId = col.client_id ?? col.id;
    const last = groups[groups.length - 1];
    if (last && last.clientId === clientId) {
      last.span += 1;
    } else {
      groups.push({
        clientId,
        clientName: col.client_name ?? col.name,
        span: 1,
      });
    }
  }
  return groups;
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
