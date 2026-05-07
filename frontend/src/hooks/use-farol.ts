"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import type { FarolBoard, FarolCriterion } from "@/lib/types";

export function useFarolBoard() {
  return useSWR<FarolBoard>("/api/v1/farol/board", api.get);
}

export function useFarolCriteria() {
  return useSWR<FarolCriterion[]>("/api/v1/farol/criteria", api.get);
}
