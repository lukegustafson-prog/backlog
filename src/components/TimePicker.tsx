"use client";

import { from12, MINUTES, parseHour, parseMinute, timeString, to12, HOURS_12, type AmPm } from "@/lib/time";

interface TimePickerProps {
  /** "HH:MM" 24-hour value. */
  value: string;
  onChange: (value: string) => void;
}

/** Hour + minute + AM/PM selector that emits an "HH:MM" string. */
export default function TimePicker({ value, onChange }: TimePickerProps) {
  const hour24 = parseHour(value) ?? 9;
  const minute = parseMinute(value) ?? 0;
  const { hour, ampm } = to12(hour24);

  function update(nextHour: number, nextMinute: number, nextAmPm: AmPm) {
    onChange(timeString(from12(nextHour, nextAmPm), nextMinute));
  }

  const selectClass =
    "rounded-md border border-line bg-white px-2 py-1.5 text-sm text-ink outline-none focus:border-[#2383e2]";

  return (
    <div className="flex items-center gap-1.5">
      <select
        aria-label="Hour"
        value={hour}
        onChange={(e) => update(Number(e.target.value), minute, ampm)}
        className={selectClass}
      >
        {HOURS_12.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span className="text-subtle">:</span>
      <select
        aria-label="Minute"
        value={minute}
        onChange={(e) => update(hour, Number(e.target.value), ampm)}
        className={selectClass}
      >
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {String(m).padStart(2, "0")}
          </option>
        ))}
      </select>
      <select
        aria-label="AM or PM"
        value={ampm}
        onChange={(e) => update(hour, minute, e.target.value as AmPm)}
        className={selectClass}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}
