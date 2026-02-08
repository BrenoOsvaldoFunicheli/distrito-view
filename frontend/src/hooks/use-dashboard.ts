"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import type {
  UnallocatedPerson,
  UpcomingNeed,
  UtilizationStats,
  TimelineEntry,
  AllocationSummaryEntry,
} from "@/lib/types";

export function useUnallocated(daysAhead = 30) {
  return useSWR<{ data: UnallocatedPerson[] }>(
    `/api/v1/dashboard/unallocated?days_ahead=${daysAhead}`,
    api.get,
  );
}

export function useUpcomingNeeds(daysAhead = 60) {
  return useSWR<{ data: UpcomingNeed[] }>(
    `/api/v1/dashboard/upcoming-needs?days_ahead=${daysAhead}`,
    api.get,
  );
}

export function useUtilization() {
  return useSWR<{ data: UtilizationStats }>(
    "/api/v1/dashboard/utilization",
    api.get,
  );
}

export function useAllocationSummary() {
  return useSWR<{ data: AllocationSummaryEntry[] }>(
    "/api/v1/dashboard/allocation-summary",
    api.get,
  );
}

export function useTimeline(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set("from_date", from);
  if (to) params.set("to_date", to);
  const query = params.toString();
  return useSWR<{
    data: { people: TimelineEntry[]; range: { from: string; to: string } };
  }>(`/api/v1/dashboard/timeline${query ? `?${query}` : ""}`, api.get);
}
