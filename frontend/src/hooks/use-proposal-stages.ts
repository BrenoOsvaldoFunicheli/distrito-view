"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import type { ProposalStageDef } from "@/lib/types";

export function useProposalStages() {
  return useSWR<ProposalStageDef[]>("/api/v1/proposal-stages", api.get);
}
