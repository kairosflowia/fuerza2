import { describe, expect, it } from "vitest";

import { formatWeekdayRanges, summarizeCollectionWindows, summarizeOpeningHours } from "@/lib/pickup-schedule";

describe("pickup schedule summaries", () => {
  it("groups consecutive weekdays, including across Sunday", () => {
    expect(formatWeekdayRanges([2, 3, 4, 5, 6])).toBe("Mar–Sáb");
    expect(formatWeekdayRanges([7, 1])).toBe("Dom–Lun");
    expect(formatWeekdayRanges([6, 7, 1])).toBe("Sáb–Lun");
    expect(formatWeekdayRanges([1, 3])).toBe("Lun, Mié");
    expect(formatWeekdayRanges([1, 2, 3, 4, 5, 6, 7])).toBe("Lun–Dom");
  });

  it("summarizes equal collection windows", () => {
    const windows = [2, 3, 4, 5, 6].map((weekday) => ({ weekday, startsAt: "10:00:00", endsAt: "14:30:00" }));
    expect(summarizeCollectionWindows(windows)).toBe("Mar – Sáb · 10:00 – 14:30");
    expect(summarizeCollectionWindows([])).toBeNull();
    expect(summarizeCollectionWindows([...windows, { weekday: 7, startsAt: "09:00:00", endsAt: "12:00:00" }])).toBe("Horario según el día");
  });

  it("summarizes opening hours with closed days", () => {
    const open = [2, 3, 4, 5, 6].map((weekday) => ({ weekday, opensAt: "09:00:00", closesAt: "18:00:00", isClosed: false }));
    const closed = [7, 1].map((weekday) => ({ weekday, opensAt: null, closesAt: null, isClosed: true }));
    expect(summarizeOpeningHours([...open, ...closed])).toBe("Mar–Sáb: 09:00–18:00 · Dom–Lun: Cerrado");
    expect(summarizeOpeningHours(open)).toBe("Mar–Sáb: 09:00–18:00");
    expect(summarizeOpeningHours([])).toBeNull();
  });
});
