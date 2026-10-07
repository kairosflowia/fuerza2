import { describe, expect, it } from "vitest";

import { FREQUENCY_LABELS_ES, receiveSentenceEs, weekdaysPhraseEs } from "@/lib/subscriptions-domain";

describe("Plan de Pan: textos del ritmo", () => {
  it("joins weekdays in Spanish, sorted and in plural", () => {
    expect(weekdaysPhraseEs([4, 1])).toBe("los lunes y jueves");
    expect(weekdaysPhraseEs([1, 3, 6])).toBe("los lunes, miércoles y sábados");
    expect(weekdaysPhraseEs([2])).toBe("los martes");
    expect(weekdaysPhraseEs([])).toBe("");
  });

  it("describes the chosen rhythm for each frequency", () => {
    expect(receiveSentenceEs([1, 4], "weekly")).toBe("Recibirás tu pan los lunes y jueves.");
    expect(receiveSentenceEs([1, 4], "biweekly")).toBe("Recibirás tu pan los lunes y jueves, una semana sí y otra no.");
    expect(receiveSentenceEs([6], "monthly")).toBe("Recibirás tu pan los sábados de una semana cada mes.");
    expect(receiveSentenceEs([], "weekly")).toBe("");
  });

  it("uses the requested frequency labels", () => {
    expect(Object.values(FREQUENCY_LABELS_ES)).toEqual(["Cada semana", "Cada 2 semanas", "Cada 3 semanas", "Cada mes"]);
  });
});
