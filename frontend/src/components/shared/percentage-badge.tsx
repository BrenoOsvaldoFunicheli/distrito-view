import { Badge } from "@/components/ui/badge";

interface PercentageBadgeProps {
  percentage: number;
}

export function PercentageBadge({ percentage }: PercentageBadgeProps) {
  let colorClass = "bg-green-100 text-green-800";
  if (percentage >= 100) {
    colorClass = "bg-blue-100 text-blue-800";
  } else if (percentage > 0) {
    colorClass = "bg-yellow-100 text-yellow-800";
  } else {
    colorClass = "bg-red-100 text-red-800";
  }

  return (
    <Badge variant="secondary" className={colorClass}>
      {percentage}%
    </Badge>
  );
}
