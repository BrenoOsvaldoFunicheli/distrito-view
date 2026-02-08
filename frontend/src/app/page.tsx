"use client";

import { PageHeader } from "@/components/layout/page-header";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { UpcomingNeeds } from "@/components/dashboard/upcoming-needs";
import { UtilizationSummary } from "@/components/dashboard/utilization-summary";
import { MiniTimeline } from "@/components/dashboard/mini-timeline";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Visao geral de alocacoes e necessidades"
      />
      <UtilizationSummary />
      <div className="grid gap-6 lg:grid-cols-2">
        <AlertsPanel />
        <UpcomingNeeds />
      </div>
      <MiniTimeline />
    </div>
  );
}
