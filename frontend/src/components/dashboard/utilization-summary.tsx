"use client";

import { Users, UserCheck, UserMinus, Activity } from "lucide-react";
import { useUtilization } from "@/hooks/use-dashboard";
import { StatsCard } from "@/components/shared/stats-card";

export function UtilizationSummary() {
  const { data } = useUtilization();
  const stats = data?.data;

  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Pessoas"
        value={stats.total_people}
        icon={Users}
      />
      <StatsCard
        title="Totalmente Alocados"
        value={stats.fully_allocated}
        description={`${stats.total_people > 0 ? Math.round((stats.fully_allocated / stats.total_people) * 100) : 0}% do time`}
        icon={UserCheck}
      />
      <StatsCard
        title="No Bench"
        value={stats.on_bench}
        description={`${stats.partially_allocated} parcialmente alocados`}
        icon={UserMinus}
      />
      <StatsCard
        title="Utilizacao Media"
        value={`${stats.average_utilization}%`}
        icon={Activity}
      />
    </div>
  );
}
