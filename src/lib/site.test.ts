import { describe, expect, it } from "vitest";

import { site } from "./site";

describe("site metadata", () => {
  it("defines the approved Spanish brand identity", () => {
    expect(site).toEqual({
      name: "FUERZA",
      description: "Obrador de masa madre",
      locale: "es_ES",
    });
  });
});
