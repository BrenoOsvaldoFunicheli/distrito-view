"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import type {
  FarolBoard,
  FarolClientSummary,
  FarolCriterion,
  FarolGroup,
  FarolHistoryEntry,
  FarolScope,
  FarolTrend,
} from "@/lib/types";

export function useFarolBoard(week?: string, scope: FarolScope = "client") {
  const params = new URLSearchParams();
  if (week) params.set("week", week);
  params.set("scope", scope);
  return useSWR<FarolBoard>(
    `/api/v1/farol/board?${params.toString()}`,
    api.get,
  );
}

export function useFarolClientSummary(
  clientId: number | null,
  week?: string,
) {
  const params = new URLSearchParams();
  if (week) params.set("week", week);
  const qs = params.toString();
  return useSWR<FarolClientSummary>(
    clientId
      ? `/api/v1/farol/client-summary/${clientId}${qs ? `?${qs}` : ""}`
      : null,
    api.get,
  );
}

export function useFarolCriteria() {
  return useSWR<FarolCriterion[]>("/api/v1/farol/criteria", api.get);
}

export function useFarolGroups() {
  return useSWR<FarolGroup[]>("/api/v1/farol/groups", api.get);
}

export function useFarolCellHistory(
  criterionId: number | null,
  scope: FarolScope | null,
  columnId: number | null,
  weeks: number = 12,
) {
  const url =
    criterionId && scope && columnId
      ? `/api/v1/farol/criteria/${criterionId}/history?scope=${scope}&column_id=${columnId}&weeks=${weeks}`
      : null;
  return useSWR<FarolHistoryEntry[]>(url, api.get);
}

export function useFarolTrend(
  weeks: number = 12,
  scope: FarolScope = "client",
) {
  return useSWR<FarolTrend>(
    `/api/v1/farol/trend?weeks=${weeks}&scope=${scope}`,
    api.get,
  );
}
