"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUnallocated } from "@/hooks/use-dashboard";
import { RoleBadge } from "@/components/shared/role-badge";
import type { UnallocatedPerson } from "@/lib/types";

function renderPerson(person: UnallocatedPerson) {
  const days = person.days_until_unallocated;
  const hasNext = !!person.next_allocation_start;
  const isBench = days === null;
  let urgencyColor = "bg-green-100 text-green-800";
  if (days !== null && days < 7) {
    urgencyColor = "bg-red-100 text-red-800";
  } else if (days !== null && days < 21) {
    urgencyColor = "bg-yellow-100 text-yellow-800";
  }

  const badgeText = days !== null ? `${days} dias` : null;

  let nextStartLabel: string | null = null;
  let nextStartClass = "";
  if (hasNext && !isBench) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next = new Date(person.next_allocation_start as string);
    next.setHours(0, 0, 0, 0);
    const diffDays = Math.round(
      (next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays < 0) {
      const abs = Math.abs(diffDays);
      nextStartLabel = `• Atrasado ${abs} dia${abs === 1 ? "" : "s"}`;
      nextStartClass = "bg-red-100 text-red-800";
    } else if (diffDays === 0) {
      nextStartLabel = "• Começa hoje";
      nextStartClass = "bg-orange-100 text-orange-800";
    } else {
      nextStartLabel = `• Início em ${diffDays} dia${diffDays === 1 ? "" : "s"}`;
      nextStartClass =
        diffDays <= 14
          ? "bg-yellow-100 text-yellow-800"
          : "bg-blue-100 text-blue-800";
    }
  }

  return (
    <div
      key={person.person_id}
      className="flex items-start justify-between gap-3 rounded-lg border p-3"
    >
      <div className="space-y-1">
        <p className="font-medium">{person.person_name}</p>
        <div className="flex gap-1">
          {person.roles.map((r) => (
            <RoleBadge key={r} name={r} muted />
          ))}
        </div>
      </div>
      <div className="text-right">
        <div className="flex flex-wrap items-center justify-end gap-1">
          {badgeText && (
            <Badge variant="secondary" className={urgencyColor}>
              {badgeText}
            </Badge>
          )}
          {isBench && (
            <span className="text-xs font-medium text-muted-foreground">
              No bench
            </span>
          )}
          {nextStartLabel && (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${nextStartClass}`}
            >
              {nextStartLabel}
            </span>
          )}
        </div>
        {person.current_allocation_ends && (
          <p className="mt-1 text-xs text-muted-foreground">
            Ate{" "}
            {new Date(person.current_allocation_ends).toLocaleDateString(
              "pt-BR",
            )}
          </p>
        )}
        {hasNext && (
          <div className="mt-1 flex flex-wrap items-center justify-end gap-1 text-xs text-blue-700">
            <Rocket className="h-3 w-3" />
            <span>
              Entra{" "}
              {new Date(person.next_allocation_start as string).toLocaleDateString(
                "pt-BR",
              )}{" "}
              em <strong>{person.next_allocation_contract_name}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface AlertsPanelProps {
  expanded?: boolean;
  onToggleExpand?: (v: boolean) => void;
}

export function AlertsPanel({ expanded: expandedProp, onToggleExpand }: AlertsPanelProps = {}) {
  const { data } = useUnallocated(90);
  const people = data?.data || [];
  const [expandedLocal, setExpandedLocal] = useState(false);
  const expanded = expandedProp ?? expandedLocal;
  const setExpanded = onToggleExpand ?? setExpandedLocal;
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Desalocações Próximas
        </CardTitle>
        <CardDescription>
          Pessoas ficando desalocadas nos próximos 90 dias
        </CardDescription>
      </CardHeader>
      <CardContent>
        {people.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma desalocação próxima. Todas as pessoas estão no bench.
          </p>
        ) : (
          <div
            className={`space-y-3 ${expanded ? "" : "max-h-96 overflow-y-auto"}`}
          >
            {people.map(renderPerson)}
          </div>
        )}
        {people.length > 1 && (
          <div className="mt-3 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="mr-1 h-4 w-4" />
                  Recolher
                </>
              ) : (
                <>
                  <ChevronDown className="mr-1 h-4 w-4" />
                  Expandir ({people.length} pessoas)
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFullscreen(true)}
              title="Ver amplo"
            >
              <Maximize2 className="mr-1 h-4 w-4" />
              Ver amplo
            </Button>
          </div>
        )}
      </CardContent>
      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Desalocações Próximas — {people.length} pessoas
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">{people.map(renderPerson)}</div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
