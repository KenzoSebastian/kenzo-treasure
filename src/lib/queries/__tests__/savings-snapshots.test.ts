/// <reference types="bun-types" />
import { describe, expect, it } from "bun:test";
import {
  collapseSameDaySnapshots,
  buildDailyPoints,
  buildWeeklyPoints,
  buildMonthlyPoints,
  buildYearlyPoints,
} from "../savings-snapshots";

describe("Savings Snapshots Query & Time-Series Engine (Fase 3)", () => {
  it("collapses multiple same-day snapshots by picking the latest record of the day", () => {
    const raw = [
      {
        snapshotDate: "2026-11-20",
        freeSavingsBalance: 4_000_000,
        emergencyFundBalance: 1_000_000,
        totalBalance: 5_000_000,
        deltaAmount: 1_000_000,
        createdAt: new Date("2026-11-20T08:00:00Z"),
      },
      {
        snapshotDate: "2026-11-20",
        freeSavingsBalance: 4_500_000,
        emergencyFundBalance: 1_000_000,
        totalBalance: 5_500_000,
        deltaAmount: 500_000,
        createdAt: new Date("2026-11-20T14:30:00Z"),
      },
    ];

    const collapsed = collapseSameDaySnapshots(raw);
    expect(collapsed.size).toBe(1);
    const dayEntry = collapsed.get("2026-11-20");
    expect(dayEntry).toBeDefined();
    expect(dayEntry?.freeSavingsBalance).toBe(4_500_000);
    expect(dayEntry?.totalBalance).toBe(5_500_000);
  });

  it("forward-fills missing days across a 30-day window without dropping balance to 0", () => {
    const refDate = new Date("2026-11-24T12:00:00Z");
    const raw = [
      {
        snapshotDate: "2026-11-01",
        freeSavingsBalance: 5_000_000,
        emergencyFundBalance: 2_000_000,
        totalBalance: 7_000_000,
        deltaAmount: 7_000_000,
        createdAt: new Date("2026-11-01T10:00:00Z"),
      },
      {
        snapshotDate: "2026-11-15",
        freeSavingsBalance: 6_000_000,
        emergencyFundBalance: 2_000_000,
        totalBalance: 8_000_000,
        deltaAmount: 1_000_000,
        createdAt: new Date("2026-11-15T10:00:00Z"),
      },
    ];

    const dayMap = collapseSameDaySnapshots(raw);
    const points = buildDailyPoints(dayMap, raw, 6_000_000, 2_000_000, refDate);

    expect(points.length).toBe(30);

    // Titik tanggal 2026-11-10 (tidak ada mutasi) harus forward-fill dari saldo 1 Nov (7_000_000)
    const midPoint = points.find((p) => p.date === "2026-11-10");
    expect(midPoint).toBeDefined();
    expect(midPoint?.totalWealth).toBe(7_000_000);

    // Titik tanggal 2026-11-24 (hari ini, setelah mutasi 15 Nov) harus forward-fill dari saldo 15 Nov (8_000_000)
    const todayPoint = points.find((p) => p.date === "2026-11-24");
    expect(todayPoint).toBeDefined();
    expect(todayPoint?.totalWealth).toBe(8_000_000);
  });

  it("preserves fallback balance when user has zero historical snapshots (cold start)", () => {
    const refDate = new Date("2026-11-24T12:00:00Z");
    const dayMap = new Map();
    const points = buildDailyPoints(dayMap, [], 9_500_000, 0, refDate);

    expect(points.length).toBe(30);
    expect(points[0].totalWealth).toBe(9_500_000);
    expect(points[29].totalWealth).toBe(9_500_000);
  });

  it("generates 12 weekly and 12 monthly points reliably", () => {
    const refDate = new Date("2026-11-24T12:00:00Z");
    const dayMap = new Map();
    const weekly = buildWeeklyPoints(dayMap, [], 9_500_000, 500_000, refDate);
    const monthly = buildMonthlyPoints([], 9_500_000, 500_000, refDate);
    const yearly = buildYearlyPoints([], 9_500_000, 500_000, refDate);

    expect(weekly.length).toBe(12);
    expect(monthly.length).toBe(12);
    expect(yearly.length).toBe(3);

    for (const p of weekly) {
      expect(p.totalWealth).toBe(10_000_000);
      expect(Number.isNaN(p.totalWealth)).toBe(false);
    }

    for (const p of monthly) {
      expect(p.totalWealth).toBe(10_000_000);
      expect(Number.isNaN(p.totalWealth)).toBe(false);
    }
  });
});
