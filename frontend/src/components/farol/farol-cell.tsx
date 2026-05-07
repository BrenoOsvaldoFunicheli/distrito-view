"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type {
  FarolBoardCell,
  FarolColor,
  FarolCriterion,
} from "@/lib/types";

interface FarolCellProps {
  criterion: FarolCriterion;
  cell: FarolBoardCell;
  onChanged: () => void;
}

const COLOR_BG: Record<FarolColor, string> = {
  none: "bg-muted",
  green: "bg-green-500",
  yellow: "bg-yellow-400",
  red: "bg-red-500",
};

const COLOR_OPTIONS: { color: FarolColor; label: string }[] = [
  { color: "green", label: "Verde" },
  { color: "yellow", label: "Amarelo" },
  { color: "red", label: "Vermelho" },
  { color: "none", label: "Vazio" },
];

export function FarolCell({ criterion, cell, onChanged }: FarolCellProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(cell.text_value ?? "");
  const [notes, setNotes] = useState(cell.notes ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setText(cell.text_value ?? "");
    setNotes(cell.notes ?? "");
  }, [cell.text_value, cell.notes]);

  const isReadonly = cell.computed;

  const setColor = async (color: FarolColor) => {
    setSaving(true);
    try {
      await api.put(
        `/api/v1/farol/criteria/${criterion.id}/values/${cell.client_id}`,
        { color },
      );
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  const saveText = async () => {
    setSaving(true);
    try {
      await api.put(
        `/api/v1/farol/criteria/${criterion.id}/values/${cell.client_id}`,
        { text_value: text, notes },
      );
      onChanged();
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const cellContent = (
    <div className="flex flex-col items-center justify-center gap-1 px-2 py-2 min-h-[3rem]">
      {criterion.show_color && (
        <div
          className={cn(
            "h-4 w-4 rounded-full border border-black/10",
            COLOR_BG[cell.color],
          )}
          title={cell.color}
        />
      )}
      {criterion.show_text && cell.text_value && (
        <span className="text-[11px] text-center leading-tight text-muted-foreground">
          {cell.text_value}
        </span>
      )}
    </div>
  );

  if (isReadonly) {
    return (
      <div className="cursor-not-allowed" title="Calculado automaticamente">
        {cellContent}
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full hover:bg-accent/40 transition-colors"
          disabled={saving}
        >
          {cellContent}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-3" align="center">
        {criterion.show_color && (
          <div className="space-y-2">
            <Label className="text-xs uppercase">Farol</Label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.color}
                  type="button"
                  onClick={() => setColor(opt.color)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 transition",
                    COLOR_BG[opt.color],
                    cell.color === opt.color
                      ? "ring-2 ring-offset-2 ring-foreground"
                      : "border-transparent",
                  )}
                  title={opt.label}
                >
                  {cell.color === opt.color && (
                    <Check className="h-4 w-4 text-white drop-shadow" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
        {criterion.show_text && (
          <div className="space-y-1">
            <Label className="text-xs uppercase">Texto</Label>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ex: Araújo Raquel"
            />
          </div>
        )}
        <div className="space-y-1">
          <Label className="text-xs uppercase">Observações (opcional)</Label>
          <Textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Fechar
          </Button>
          <Button size="sm" onClick={saveText} disabled={saving}>
            Salvar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
