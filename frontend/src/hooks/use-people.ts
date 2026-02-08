"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import type { Person, Allocation } from "@/lib/types";

export function usePeople(roleId?: number) {
  const params = new URLSearchParams();
  if (roleId) params.set("role_id", String(roleId));
  const query = params.toString();
  return useSWR<Person[]>(
    `/api/v1/people${query ? `?${query}` : ""}`,
    api.get,
  );
}

export function usePerson(id: number | null) {
  return useSWR<Person>(id ? `/api/v1/people/${id}` : null, api.get);
}

export function usePersonAllocations(id: number | null) {
  return useSWR<Allocation[]>(
    id ? `/api/v1/people/${id}/allocations` : null,
    api.get,
  );
}
