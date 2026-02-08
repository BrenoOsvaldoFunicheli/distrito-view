import { Badge } from "@/components/ui/badge";
import { ROLE_COLORS } from "@/lib/constants";

interface RoleBadgeProps {
  name: string;
  isPrimary?: boolean;
}

export function RoleBadge({ name, isPrimary }: RoleBadgeProps) {
  const colorClass = ROLE_COLORS[name] || "bg-gray-100 text-gray-800";
  return (
    <Badge variant="secondary" className={`${colorClass} text-xs`}>
      {name}
      {isPrimary && " *"}
    </Badge>
  );
}
