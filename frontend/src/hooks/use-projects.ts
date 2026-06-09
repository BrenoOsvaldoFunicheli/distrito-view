"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import type { Project, ProjectWithContext } from "@/lib/types";

export function useProjects() {
  return useSWR<ProjectWithContext[]>("/api/v1/projects", api.get);
}

export function useContractProjects(contractId: number | null) {
  return useSWR<Project[]>(
    contractId ? `/api/v1/contracts/${contractId}/projects` : null,
    api.get,
  );
}

export function useProject(id: number | null) {
  return useSWR<Project>(id ? `/api/v1/projects/${id}` : null, api.get);
}
