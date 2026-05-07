"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import type {
  FarolBoard,
  FarolCriterion,
  FarolGroup,
  FarolHistoryEntry,
  FarolTrend,
} from "@/lib/types";

export function useFarolBoard(week?: string) {
  const url = week
    ? `/api/v1/farol/board?week=${week}`
    : "/api/v1/farol/board";
  return useSWR<FarolBoard>(url, api.get);
}

export function useFarolCriteria() {
  return useSWR<FarolCriterion[]>("/api/v1/farol/criteria", api.get);
}

export function useFarolGroups() {
  return useSWR<FarolGroup[]>("/api/v1/farol/groups", api.get);
}

export function useFarolCellHistory(
  criterionId: number | null,
  clientId: number | null,
  weeks: number = 12,
) {
  const url =
    criterionId && clientId
      ? `/api/v1/farol/criteria/${criterionId}/values/${clientId}/history?weeks=${weeks}`
      : null;
  return useSWR<FarolHistoryEntry[]>(url, api.get);
}

export function useFarolTrend(weeks: number = 12) {
  return useSWR<FarolTrend>(`/api/v1/farol/trend?weeks=${weeks}`, api.get);
}
