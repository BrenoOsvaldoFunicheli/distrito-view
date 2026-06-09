import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/lib/types";

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Ativo",
    className: "bg-green-100 text-green-700",
  },
  paused: {
    label: "Pausado",
    className: "bg-yellow-100 text-yellow-700",
  },
  completed: {
    label: "Concluído",
    className: "bg-gray-100 text-gray-600",
  },
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.active;
  return (
    <span
      className={cn(
        "inline-block rounded px-2 py-0.5 text-xs font-medium",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}
