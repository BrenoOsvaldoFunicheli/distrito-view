"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Building2, Calendar, Mail, Rocket, User } from "lucide-react";
import type { Proposal } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ProposalCardProps {
  proposal: Proposal;
  onClick?: () => void;
  isOverlay?: boolean;
}

function formatCurrency(value: number | null) {
  if (value === null) return null;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return null;
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}

export function ProposalCard({ proposal, onClick, isOverlay }: ProposalCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: proposal.id,
      data: { stage: proposal.stage },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging && !isOverlay ? 0.4 : 1,
  };

  const value = formatCurrency(proposal.estimated_value);
  const closeDate = formatDate(proposal.expected_close_date);
  const startDate = formatDate(proposal.expected_start_date);
  const clientName = proposal.client?.name;
  const contact = proposal.contact_name;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (isDragging) return;
        if (onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
      className={cn(
        "cursor-grab rounded-md border bg-card p-3 shadow-sm hover:shadow-md active:cursor-grabbing",
        isOverlay && "shadow-lg ring-2 ring-primary",
      )}
    >
      <div className="space-y-2">
        <div className="text-sm font-medium leading-tight">{proposal.title}</div>
        {clientName && (
          <div className="inline-flex max-w-full items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
            <Building2 className="h-3 w-3 shrink-0" />
            <span className="truncate">{clientName}</span>
          </div>
        )}
        {value && (
          <div className="text-sm font-semibold text-emerald-700">{value}</div>
        )}
        {contact && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span className="truncate">{contact}</span>
          </div>
        )}
        {proposal.contact_email && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span className="truncate">{proposal.contact_email}</span>
          </div>
        )}
        {closeDate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Fecha {closeDate}</span>
          </div>
        )}
        {startDate && (
          <div className="flex items-center gap-1 text-xs font-medium text-blue-700">
            <Rocket className="h-3 w-3" />
            <span>Início {startDate}</span>
          </div>
        )}
        {proposal.lost_reason && (
          <div className="rounded bg-red-50 p-1 text-xs text-red-700">
            {proposal.lost_reason}
          </div>
        )}
        {proposal.contract_id && (
          <a
            href={`/contracts/${proposal.contract_id}`}
            onClick={(e) => e.stopPropagation()}
            className="block text-xs text-blue-600 underline"
          >
            Ver contrato →
          </a>
        )}
      </div>
    </div>
  );
}
