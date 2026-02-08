import { Badge } from "@/components/ui/badge";
import { STATUS_COLORS } from "@/lib/constants";

interface StatusBadgeProps {
  status: string;
}

const STATUS_LABELS: Record<string, string> = {
  active: "Ativo",
  draft: "Rascunho",
  completed: "Concluido",
  cancelled: "Cancelado",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const colorClass = STATUS_COLORS[status] || "bg-gray-100 text-gray-800";
  return (
    <Badge variant="secondary" className={colorClass}>
      {STATUS_LABELS[status] || status}
    </Badge>
  );
}
