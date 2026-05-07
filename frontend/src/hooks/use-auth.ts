"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import type { AuthUser } from "@/lib/types";

export function useCurrentUser() {
  return useSWR<AuthUser>("/api/v1/auth/me", api.get, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  });
}
