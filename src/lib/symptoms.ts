export const FEELINGS = [
  { value: "need_poop", label: "Defecation urgency" },
  { value: "just_pooped", label: "Bowel movement" },
  { value: "abdominal_pain", label: "Abdominal pain" },
  { value: "bloated", label: "Abdominal bloating / distension" },
  { value: "nauseous", label: "Nausea" },
] as const;

export type Feeling = (typeof FEELINGS)[number]["value"];

export const FEELING_LABELS: Record<string, string> = Object.fromEntries(
  FEELINGS.map((f) => [f.value, f.label]),
);

export function isFeeling(value: unknown): value is Feeling {
  return (
    typeof value === "string" &&
    FEELINGS.some((f) => f.value === value)
  );
}

/** Feelings that need the follow-up volume / emptied questions. */
export const FEELING_WITH_FOLLOWUP: Feeling = "just_pooped";

export interface Symptom {
  id: string;
  feeling: Feeling;
  volume: number | null;
  emptied: boolean | null;
  date: string;
  time: string;
  createdAt: string;
  updatedAt: string;
}

export const NUTRITION_FIELDS = [
  { key: "calories", label: "Calories", unit: "kcal" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "fat", label: "Fat", unit: "g" },
  { key: "sugar", label: "Sugar", unit: "g" },
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "fiber", label: "Fiber", unit: "g" },
] as const;

export type NutritionKey = (typeof NUTRITION_FIELDS)[number]["key"];

export interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  sugar: number;
  carbs: number;
  fiber: number;
  date: string;
  time: string;
  createdAt: string;
  updatedAt: string;
}
