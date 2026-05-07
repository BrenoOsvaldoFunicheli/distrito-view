"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import {
  CapacityFilterBar,
  type CapacityFilter,
} from "@/components/dashboard/capacity-filter-bar";
import { CapacitySummaryCards } from "@/components/dashboard/capacity-summary-cards";
import { UpcomingNeeds } from "@/components/dashboard/upcoming-needs";
import { useCapacityPlanning } from "@/hooks/use-dashboard";

export default function DashboardPage() {
  const [expanded, setExpanded] = useState(false);
  const today = new Date();
  const [capacityFilter, setCapacityFilter] = useState<CapacityFilter>({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    company: "",
  });
  const { data: capacityData, isLoading: capacityLoading } = useCapacityPlanning(
    capacityFilter.year,
    capacityFilter.month,
    capacityFilter.company || undefined,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Visao geral de alocacoes e necessidades"
      />
      <div className="space-y-4">
        <CapacityFilterBar
          value={capacityFilter}
          onChange={setCapacityFilter}
        />
        <CapacitySummaryCards
          capacity={capacityData?.data}
          isLoading={capacityLoading}
        />
      </div>
      <div className="grid items-stretch gap-6 lg:grid-cols-2">
        <AlertsPanel expanded={expanded} onToggleExpand={setExpanded} />
        <UpcomingNeeds expanded={expanded} onToggleExpand={setExpanded} />
      </div>
    </div>
  );
}
