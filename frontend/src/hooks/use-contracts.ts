"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import type { Contract } from "@/lib/types";

export function useContracts(status?: string, clientId?: number) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (clientId) params.set("client_id", String(clientId));
  const query = params.toString();
  return useSWR<Contract[]>(
    `/api/v1/contracts${query ? `?${query}` : ""}`,
    api.get,
  );
}

export function useContract(id: number | null) {
  return useSWR<Contract>(id ? `/api/v1/contracts/${id}` : null, api.get);
}
