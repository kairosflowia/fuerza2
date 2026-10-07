import { describe, expect, it } from "vitest";

import { earliestBookableIsoDate, operationalToday } from "@/lib/order-cutoff";

// Configuración real: 2 días de antelación, corte a las 10:00 (hora de Madrid).
const config = { daysBefore: 2, time: "10:00:00" };

describe("earliestBookableIsoDate (zona horaria del obrador)", () => {
  it("returns null without configuration", () => {
    expect(earliestBookableIsoDate(null)).toBeNull();
  });

  it("allows today + daysBefore before the cutoff time in Madrid", () => {
    // 09:59 en Madrid (verano, UTC+2) del miércoles 7 de octubre.
    expect(earliestBookableIsoDate(config, new Date("2026-10-07T07:59:00Z"))).toBe("2026-10-09");
  });

  it("moves one day later once the cutoff time has passed in Madrid", () => {
    // 10:00 exactas en Madrid: igual que la base de datos (now() >= corte), ya no se admite.
    expect(earliestBookableIsoDate(config, new Date("2026-10-07T08:00:00Z"))).toBe("2026-10-10");
    // 17:30 en Madrid.
    expect(earliestBookableIsoDate(config, new Date("2026-10-07T15:30:00Z"))).toBe("2026-10-10");
  });

  it("does not evaluate the cutoff in UTC (it is 09:30 UTC but 11:30 in Madrid)", () => {
    expect(earliestBookableIsoDate(config, new Date("2026-10-07T09:30:00Z"))).toBe("2026-10-10");
  });

  it("uses the Madrid calendar day around midnight (23:30 UTC is already the next day in Madrid)", () => {
    // 01:30 del jueves 8 en Madrid: antes del corte de ese día.
    expect(earliestBookableIsoDate(config, new Date("2026-10-07T23:30:00Z"))).toBe("2026-10-10");
    expect(operationalToday(new Date("2026-10-07T23:30:00Z"))).toBe("2026-10-08");
  });

  it("follows winter time (UTC+1)", () => {
    // 09:30 en Madrid el 15 de enero = 08:30 UTC: antes del corte.
    expect(earliestBookableIsoDate(config, new Date("2026-01-15T08:30:00Z"))).toBe("2026-01-17");
    // 10:30 en Madrid = 09:30 UTC: después del corte.
    expect(earliestBookableIsoDate(config, new Date("2026-01-15T09:30:00Z"))).toBe("2026-01-18");
  });

  it("crosses month and year boundaries", () => {
    expect(earliestBookableIsoDate(config, new Date("2026-12-30T12:00:00Z"))).toBe("2027-01-02");
  });
});
