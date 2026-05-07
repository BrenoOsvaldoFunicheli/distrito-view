"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import type { Proposal } from "@/lib/types";

export function useProposals(stage?: string) {
  const query = stage ? `?stage=${stage}` : "";
  return useSWR<Proposal[]>(`/api/v1/proposals${query}`, api.get);
}

export function useProposal(id: number | null) {
  return useSWR<Proposal>(id ? `/api/v1/proposals/${id}` : null, api.get);
}
