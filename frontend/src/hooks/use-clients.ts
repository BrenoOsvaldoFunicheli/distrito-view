"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import type { Client } from "@/lib/types";

export function useClients() {
  return useSWR<Client[]>("/api/v1/clients", api.get);
}

export function useClient(id: number | null) {
  return useSWR<Client>(id ? `/api/v1/clients/${id}` : null, api.get);
}
