"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import type { AuthUser } from "@/lib/types";

export function useUsers() {
  return useSWR<AuthUser[]>("/api/v1/auth/users", api.get);
}
