import { describe, expect, it } from "vitest";
import { daysUntil, elapsed, nextOccurrence } from "./dates";

describe("elapsed", () => {
  const tz = "America/Bogota";
  it("handles month boundaries", () => {
    const start = new Date("2025-07-30T05:00:00Z"); // 00:00 Bogotá
    const r = elapsed(start, new Date("2025-09-01T05:00:00Z"), tz);
    expect(r.years).toBe(0);
    expect(r.months).toBe(1);
    expect(r.days).toBe(2);
  });
  it("counts full years", () => {
    const r = elapsed(new Date("2024-07-30T05:00:00Z"), new Date("2026-07-30T05:00:00Z"), tz);
    expect(r).toMatchObject({ years: 2, months: 0, days: 0, hours: 0 });
  });
  it("is zero for a future start", () => {
    expect(elapsed(new Date("2030-01-01"), new Date("2026-01-01")).years).toBe(0);
  });
});

describe("anniversaries", () => {
  it("rolls to next year once passed", () => {
    const n = nextOccurrence("2024-07-30", true, new Date(2026, 9, 13));
    expect(n.getFullYear()).toBe(2027);
    expect(daysUntil(nextOccurrence("2024-10-14", true, new Date(2026, 9, 13)), new Date(2026, 9, 13))).toBe(1);
  });
});
