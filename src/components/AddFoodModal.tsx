"use client";

import { useEffect, useState } from "react";
import { NUTRITION_FIELDS, type NutritionKey } from "@/lib/symptoms";
import { formatLongDate } from "@/lib/date";

export interface NewFoodPayload {
  name: string;
  date: string;
  calories: number;
  protein: number;
  fat: number;
  sugar: number;
  carbs: number;
  fiber: number;
}

interface AddFoodModalProps {
  dateKey: string;
  onClose: () => void;
  onCreate: (payload: NewFoodPayload) => Promise<void>;
}

type NutritionState = Record<NutritionKey, string>;

const EMPTY_NUTRITION: NutritionState = {
  calories: "",
  protein: "",
  fat: "",
  sugar: "",
  carbs: "",
  fiber: "",
};

export default function AddFoodModal({ dateKey, onClose, onCreate }: AddFoodModalProps) {
  const [name, setName] = useState("");
  const [values, setValues] = useState<NutritionState>(EMPTY_NUTRITION);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await onCreate({
        name: name.trim(),
        date: dateKey,
        calories: Number(values.calories) || 0,
        protein: Number(values.protein) || 0,
        fat: Number(values.fat) || 0,
        sugar: Number(values.sugar) || 0,
        carbs: Number(values.carbs) || 0,
        fiber: Number(values.fiber) || 0,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-20"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-line"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="border-b border-line px-5 pb-4 pt-5">
            <input
              autoFocus
              aria-label="Food name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Food name"
              className="w-full border-b-2 border-transparent bg-transparent pb-1 text-xl font-medium text-ink outline-none placeholder:text-subtle/60 focus:border-[#2383e2]"
            />
            <p className="mt-2 text-sm text-subtle">{formatLongDate(dateKey)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 px-5 py-4">
            {NUTRITION_FIELDS.map((field) => (
              <label key={field.key} className="text-sm">
                <span className="mb-1 block text-subtle">
                  {field.label} <span className="text-subtle/70">({field.unit})</span>
                </span>
                <input
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  aria-label={field.label}
                  value={values[field.key]}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  placeholder="0"
                  className="w-full rounded-md border border-line px-2 py-1.5 text-ink outline-none focus:border-[#2383e2]"
                />
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-2 border-t border-line px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-subtle transition hover:bg-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || saving}
              className="rounded-md bg-[#2383e2] px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save food"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
