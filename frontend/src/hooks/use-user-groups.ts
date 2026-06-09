"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import type { AreaInfo, UserGroup } from "@/lib/types";

export function useUserGroups() {
  return useSWR<UserGroup[]>("/api/v1/admin/groups", api.get);
}

export function useAreas() {
  return useSWR<{ areas: AreaInfo[] }>("/api/v1/admin/groups/areas", api.get);
}
