"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FEELING_LABELS,
  NUTRITION_FIELDS,
  type Food,
  type Symptom,
} from "@/lib/symptoms";
import { formatHour, parseHour } from "@/lib/time";
import AddSymptomModal, { type NewSymptomPayload } from "./AddSymptomModal";
import AddFoodModal, { type NewFoodPayload } from "./AddFoodModal";

interface SymptomDayViewProps {
  dateKey: string;
  version: number;
  onChanged: () => void;
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

export default function SymptomDayView({ dateKey, version, onChanged }: SymptomDayViewProps) {
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [symptomModal, setSymptomModal] = useState(false);
  const [foodModal, setFoodModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, fRes] = await Promise.all([
        fetch(`/api/symptoms?date=${dateKey}`),
        fetch(`/api/foods?date=${dateKey}`),
      ]);
      if (!sRes.ok || !fRes.ok) throw new Error("failed");
      setSymptoms(await sRes.json());
      setFoods(await fRes.json());
      setError(null);
    } catch {
      setError("Could not load entries. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, [dateKey]);

  useEffect(() => {
    load();
  }, [load, version]);

  const totals = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const field of NUTRITION_FIELDS) {
      acc[field.key] = foods.reduce((sum, f) => sum + (f[field.key] ?? 0), 0);
    }
    return acc;
  }, [foods]);

  async function createSymptom(payload: NewSymptomPayload) {
    const res = await fetch("/api/symptoms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      setError("Could not save the symptom.");
      return;
    }
    setSymptomModal(false);
    await load();
    onChanged();
  }

  async function createFood(payload: NewFoodPayload) {
    const res = await fetch("/api/foods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      setError("Could not save the food.");
      return;
    }
    setFoodModal(false);
    await load();
    onChanged();
  }

  async function deleteSymptom(id: string) {
    setSymptoms((prev) => prev.filter((s) => s.id !== id));
    try {
      await fetch(`/api/symptoms/${id}`, { method: "DELETE" });
      onChanged();
    } catch {
      await load();
    }
  }

  async function deleteFood(id: string) {
    setFoods((prev) => prev.filter((f) => f.id !== id));
    try {
      await fetch(`/api/foods/${id}`, { method: "DELETE" });
      onChanged();
    } catch {
      await load();
    }
  }

  return (
    <div>
      <p className="mb-4 text-sm text-subtle">
        {loading
          ? "Loading…"
          : `${symptoms.length} symptom${symptoms.length === 1 ? "" : "s"} · ${foods.length} food${
              foods.length === 1 ? "" : "s"
            } logged`}
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setSymptomModal(true)}
          className="rounded-lg bg-[#2383e2] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          + Add symptom
        </button>
        <button
          onClick={() => setFoodModal(true)}
          className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink transition hover:bg-hover"
        >
          + Add food
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Symptoms */}
      <section className="mb-8">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-subtle">
          Symptoms
        </h2>
        {symptoms.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line py-10 text-center text-sm text-subtle">
            No symptoms logged for this day.
          </div>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
            {symptoms.map((s) => {
              const hour = parseHour(s.time);
              return (
                <li
                  key={s.id}
                  className="group flex items-center gap-3 px-4 py-3 transition hover:bg-hover"
                >
                  <span className="grid h-4 w-4 shrink-0 place-items-center">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#e0703a]" />
                  </span>
                  {hour !== null && (
                    <span className="shrink-0 rounded bg-hover px-1.5 py-0.5 text-xs font-medium text-subtle">
                      {formatHour(hour)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="text-sm text-ink">{FEELING_LABELS[s.feeling]}</span>
                    {s.volume !== null && (
                      <span className="ml-2 text-xs text-subtle">
                        Volume {s.volume}/10 · Emptied: {s.emptied ? "Yes" : "No"}
                      </span>
                    )}
                  </div>
                  <button
                    aria-label="Delete symptom"
                    onClick={() => deleteSymptom(s.id)}
                    className="shrink-0 rounded px-2 py-1 text-xs text-subtle opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                  >
                    Delete
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Food log */}
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-subtle">
          Food log
        </h2>
        {foods.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line py-10 text-center text-sm text-subtle">
            No foods logged for this day.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-line">
            <ul className="divide-y divide-line">
              {foods.map((f) => (
                <li
                  key={f.id}
                  className="group flex items-center gap-3 px-4 py-3 transition hover:bg-hover"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{f.name}</p>
                    <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-subtle">
                      {NUTRITION_FIELDS.map((field) => (
                        <span key={field.key}>
                          {field.label} {round(f[field.key])}
                          {field.unit === "g" ? "g" : ""}
                        </span>
                      ))}
                    </p>
                  </div>
                  <button
                    aria-label="Delete food"
                    onClick={() => deleteFood(f.id)}
                    className="shrink-0 rounded px-2 py-1 text-xs text-subtle opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line bg-hover/50 px-4 py-3 text-xs font-medium text-ink">
              <span className="uppercase tracking-wide text-subtle">Daily totals</span>
              {NUTRITION_FIELDS.map((field) => (
                <span key={field.key}>
                  {field.label} {round(totals[field.key])}
                  {field.unit === "g" ? "g" : " kcal"}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {symptomModal && (
        <AddSymptomModal
          dateKey={dateKey}
          onClose={() => setSymptomModal(false)}
          onCreate={createSymptom}
        />
      )}
      {foodModal && (
        <AddFoodModal
          dateKey={dateKey}
          onClose={() => setFoodModal(false)}
          onCreate={createFood}
        />
      )}
    </div>
  );
}
