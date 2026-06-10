"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import type { AuthUser } from "@/lib/types";

export function useUsers(enabled = true) {
  return useSWR<AuthUser[]>(enabled ? "/api/v1/auth/users" : null, api.get);
}
