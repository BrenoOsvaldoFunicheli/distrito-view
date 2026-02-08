"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import type { Allocation } from "@/lib/types";

export function useAllocations(personId?: number, contractId?: number) {
  const params = new URLSearchParams();
  if (personId) params.set("person_id", String(personId));
  if (contractId) params.set("contract_id", String(contractId));
  const query = params.toString();
  return useSWR<Allocation[]>(
    `/api/v1/allocations${query ? `?${query}` : ""}`,
    api.get,
  );
}
