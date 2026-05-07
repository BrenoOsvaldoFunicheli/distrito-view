"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendChart } from "@/components/farol/trend-chart";
import { useFarolTrend } from "@/hooks/use-farol";

export default function FarolTendenciaPage() {
  const [weeks, setWeeks] = useState<number>(12);
  const { data, isLoading } = useFarolTrend(weeks);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tendência do Farol"
        description="Distribuição de cores por semana"
        actions={
          <Button variant="outline" asChild>
            <Link href="/farol">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao board
            </Link>
          </Button>
        }
      />
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Período:</span>
        <Select
          value={String(weeks)}
          onValueChange={(v) => setWeeks(Number(v))}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="4">Últimas 4 semanas</SelectItem>
            <SelectItem value="8">Últimas 8 semanas</SelectItem>
            <SelectItem value="12">Últimas 12 semanas</SelectItem>
            <SelectItem value="26">Últimas 26 semanas</SelectItem>
            <SelectItem value="52">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {isLoading && <div className="h-72 animate-pulse rounded-lg bg-muted" />}
      {data && <TrendChart data={data} />}
    </div>
  );
}
