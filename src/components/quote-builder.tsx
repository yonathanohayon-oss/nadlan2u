"use client";

import { useState, useTransition } from "react";
import { createQuoteFromMatrix } from "@/app/actions/quotes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatILS } from "@/lib/statuses";

type MatrixItem = {
  id: string;
  code: string;
  chapter: string;
  description: string;
  unit: string;
  unitPrice: number;
};

export function QuoteBuilder({
  projectId,
  changeRequestId,
  items,
}: {
  projectId: string;
  changeRequestId: string;
  items: MatrixItem[];
}) {
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[id] != null) delete next[id];
      else next[id] = 1;
      return next;
    });
  }

  const total = items
    .filter((i) => selected[i.id] != null)
    .reduce((sum, i) => sum + i.unitPrice * (selected[i.id] || 1), 0);

  return (
    <form
      action={(fd) => {
        startTransition(async () => {
          await createQuoteFromMatrix(fd);
        });
      }}
      className="space-y-4"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="changeRequestId" value={changeRequestId} />

      <div className="space-y-2 max-h-72 overflow-y-auto rounded-md border p-2">
        {items.map((item) => {
          const isOn = selected[item.id] != null;
          return (
            <label
              key={item.id}
              className="flex items-start gap-3 rounded-md px-2 py-2 hover:bg-muted/60 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={isOn}
                onChange={() => toggle(item.id)}
                className="mt-1"
              />
              {isOn && (
                <>
                  <input type="hidden" name="matrixItemId" value={item.id} />
                  <input
                    type="hidden"
                    name="quantity"
                    value={selected[item.id] || 1}
                  />
                </>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">
                  {item.code} · {item.description}
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.chapter} · {formatILS(item.unitPrice)} / {item.unit}
                </div>
              </div>
              {isOn && (
                <Input
                  type="number"
                  min={0.1}
                  step={0.1}
                  className="w-20"
                  value={selected[item.id]}
                  onChange={(e) =>
                    setSelected((prev) => ({
                      ...prev,
                      [item.id]: Number(e.target.value) || 1,
                    }))
                  }
                />
              )}
            </label>
          );
        })}
      </div>

      <div className="space-y-2">
        <Label htmlFor="quoteNotes">הערות להצעה</Label>
        <Textarea id="quoteNotes" name="notes" rows={2} />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-sm">
          סה״כ משוער: <span className="font-semibold">{formatILS(total)}</span>
        </div>
        <Button type="submit" disabled={pending || Object.keys(selected).length === 0}>
          {pending ? "יוצר הצעה…" : "צור הצעת מחיר ממחירון"}
        </Button>
      </div>
    </form>
  );
}
