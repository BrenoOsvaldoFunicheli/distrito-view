"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import type { Role } from "@/lib/types";

export function useRoles() {
  return useSWR<Role[]>("/api/v1/roles", api.get);
}
