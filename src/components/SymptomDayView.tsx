"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FEELING_LABELS,
  NUTRITION_FIELDS,
  type Food,
  type Symptom,
} from "@/lib/symptoms";
import { formatHour, formatTime, parseHour } from "@/lib/time";
import AddSymptomModal, { type NewSymptomPayload } from "./AddSymptomModal";
import AddFoodModal, { type NewFoodPayload } from "./AddFoodModal";

interface SymptomDayViewProps {
  dateKey: string;
  version: number;
  onChanged: () => void;
}

type Entry =
  | { type: "symptom"; id: string; time: string; hour: number | null; symptom: Symptom }
  | { type: "food"; id: string; time: string; hour: number | null; food: Food };

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

  const entries = useMemo<Entry[]>(() => {
    const list: Entry[] = [
      ...symptoms.map((s): Entry => ({
        type: "symptom",
        id: s.id,
        time: s.time,
        hour: parseHour(s.time),
        symptom: s,
      })),
      ...foods.map((f): Entry => ({
        type: "food",
        id: f.id,
        time: f.time,
        hour: parseHour(f.time),
        food: f,
      })),
    ];
    return list.sort((a, b) => a.time.localeCompare(b.time));
  }, [symptoms, foods]);

  const timed = entries.filter((e) => e.hour !== null);
  const untimed = entries.filter((e) => e.hour === null);

  const hours = useMemo(() => {
    const itemHours = timed.map((e) => e.hour as number);
    const min = Math.max(0, Math.min(8, ...itemHours));
    const max = Math.min(23, Math.max(18, ...itemHours));
    return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  }, [timed]);

  const byHour = useMemo(() => {
    const map = new Map<number, Entry[]>();
    for (const e of timed) {
      const list = map.get(e.hour as number) ?? [];
      list.push(e);
      map.set(e.hour as number, list);
    }
    return map;
  }, [timed]);

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
    if (!res.ok) return setError("Could not save the symptom.");
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
    if (!res.ok) return setError("Could not save the food.");
    setFoodModal(false);
    await load();
    onChanged();
  }

  async function deleteEntry(entry: Entry) {
    if (entry.type === "symptom") {
      setSymptoms((prev) => prev.filter((s) => s.id !== entry.id));
    } else {
      setFoods((prev) => prev.filter((f) => f.id !== entry.id));
    }
    try {
      await fetch(`/api/${entry.type === "symptom" ? "symptoms" : "foods"}/${entry.id}`, {
        method: "DELETE",
      });
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

      {!loading && entries.length === 0 && !error && (
        <div className="rounded-lg border border-line py-16 text-center">
          <p className="text-sm text-subtle">Nothing logged for this day.</p>
        </div>
      )}

      {untimed.length > 0 && (
        <div className="mb-4 divide-y divide-line overflow-hidden rounded-lg border border-line">
          {untimed.map((entry) => (
            <EntryRow key={entry.id} entry={entry} onDelete={() => deleteEntry(entry)} compact />
          ))}
        </div>
      )}

      {/* Combined timeline (symptoms + foods together) */}
      {!loading && timed.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-subtle">
            Timeline
          </h2>
          <div className="rounded-lg border border-line p-2">
            {hours.map((hour) => {
              const items = byHour.get(hour) ?? [];
              return (
                <div key={hour} className="flex gap-3">
                  <div className="w-14 shrink-0 pt-2 text-right text-xs font-medium text-subtle">
                    {formatHour(hour)}
                  </div>
                  <div className="relative flex w-4 shrink-0 justify-center">
                    <span className="absolute inset-y-0 w-px bg-line" />
                    <span
                      className={`relative mt-[11px] h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                        items.length > 0 ? "bg-[#2383e2]" : "bg-line"
                      }`}
                    />
                  </div>
                  <div className="min-h-[2.75rem] flex-1 space-y-2 py-1.5">
                    {items.map((entry) => (
                      <EntryRow key={entry.id} entry={entry} onDelete={() => deleteEntry(entry)} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Daily nutrition totals */}
      {foods.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 rounded-lg border border-line bg-hover/50 px-4 py-3 text-xs font-medium text-ink">
          <span className="uppercase tracking-wide text-subtle">Daily totals</span>
          {NUTRITION_FIELDS.map((field) => (
            <span key={field.key}>
              {field.label} {round(totals[field.key])}
              {field.unit === "g" ? "g" : " kcal"}
            </span>
          ))}
        </div>
      )}

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

function EntryRow({
  entry,
  onDelete,
  compact = false,
}: {
  entry: Entry;
  onDelete: () => void;
  compact?: boolean;
}) {
  const wrapper = compact
    ? "group flex items-center gap-3 px-4 py-3 transition hover:bg-hover"
    : "group flex items-center gap-3 rounded-lg border border-line bg-white px-3 py-2 transition hover:bg-hover";

  return (
    <div className={wrapper}>
      {entry.type === "symptom" ? (
        <span aria-label="Symptom" className="grid h-4 w-4 shrink-0 place-items-center">
          <span className="h-2.5 w-2.5 rounded-full bg-[#e0703a]" />
        </span>
      ) : (
        <span aria-label="Food" className="grid h-4 w-4 shrink-0 place-items-center">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-[#3aa56b]" />
        </span>
      )}

      {entry.hour !== null && (
        <span className="shrink-0 rounded bg-hover px-1.5 py-0.5 text-xs font-medium text-subtle">
          {formatTime(entry.time)}
        </span>
      )}

      <div className="min-w-0 flex-1">
        {entry.type === "symptom" ? (
          <span className="text-sm text-ink">
            {FEELING_LABELS[entry.symptom.feeling]}
              {entry.symptom.volume !== null && (
                <span className="ml-2 text-xs text-subtle">
                  Stool volume {entry.symptom.volume}/10 · Complete evacuation:{" "}
                  {entry.symptom.emptied ? "Yes" : "No"}
                </span>
              )}
          </span>
        ) : (
          <>
            <span className="text-sm font-medium text-ink">{entry.food.name}</span>
            <span className="ml-2 text-xs text-subtle">
              {entry.food.calories} kcal · P {entry.food.protein}g · C {entry.food.carbs}g · F{" "}
              {entry.food.fat}g
            </span>
          </>
        )}
      </div>

      <span
        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
          entry.type === "symptom"
            ? "bg-[#e0703a]/10 text-[#b9521f]"
            : "bg-[#3aa56b]/10 text-[#2a7a4f]"
        }`}
      >
        {entry.type}
      </span>

      <button
        aria-label={`Delete ${entry.type}`}
        onClick={onDelete}
        className="shrink-0 rounded px-2 py-1 text-xs text-subtle opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
      >
        Delete
      </button>
    </div>
  );
}
