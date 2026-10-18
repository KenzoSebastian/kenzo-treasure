/// <reference types="bun-types" />
import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { ExecutiveSummaryCard } from "../ExecutiveSummaryCard";

describe("ExecutiveSummaryCard (Fase F6)", () => {
  it("renders healthy budget status when spending is <= 70% of income", () => {
    const html = renderToString(
      <ExecutiveSummaryCard
        totalIncome={4000000}
        totalSpent={1420000}
        monthName="Oktober 2026"
      />
    );

    // Verifikasi metrik utama
    expect(html).toContain("Executive Cashflow KPI");
    expect(html).toContain("Siklus Oktober 2026");
    expect(html).toContain("Rp 4.000.000"); // Total Income
    expect(html).toContain("Rp 1.420.000"); // Total Spent
    expect(html).toContain("+Rp 2.580.000"); // Net Savings (+ surplus)
    expect(html).toContain("65%"); // Savings rate: (2.580.000 / 4.000.000) * 100 = 64.5 -> 65%

    // Verifikasi badge status sehat
    expect(html).toContain("Anggaran Sehat");
    expect(html).toContain("bg-emerald-500");
  });

  it("renders warning status when spending is between 71% and 90%", () => {
    const html = renderToString(
      <ExecutiveSummaryCard
        totalIncome={5000000}
        totalSpent={4000000} // 80% usage
      />
    );

    expect(html).toContain("Mendekati Batas (70%+)");
    expect(html).toContain("bg-amber-500");
    expect(html).toContain("80%");
    expect(html).toContain("dari total pemasukan");
  });

  it("renders overbudget/deficit status when spending exceeds income", () => {
    const html = renderToString(
      <ExecutiveSummaryCard
        totalIncome={4000000}
        totalSpent={4500000} // Defisit 500.000
      />
    );

    expect(html).toContain("Defisit Kas");
    expect(html).toContain("bg-rose-500");
    expect(html).toContain("-Rp 500.000");
  });

  it("renders overbudget status when usage exceeds 90% without deficit", () => {
    const html = renderToString(
      <ExecutiveSummaryCard
        totalIncome={10000000}
        totalSpent={9500000} // 95% usage
      />
    );

    expect(html).toContain("Overbudget");
    expect(html).toContain("bg-rose-500");
  });

  it("displays salary and freelance breakdown correctly when provided", () => {
    const html = renderToString(
      <ExecutiveSummaryCard
        totalIncome={6500000}
        totalSpent={2000000}
        baseSalary={4000000}
        additionalIncomes={2500000}
      />
    );

    expect(html).toContain("Gaji:");
    expect(html).toContain("Rp 4.000.000");
    expect(html).toContain("Freelance:");
    expect(html).toContain("+Rp 2.500.000");
  });

  it("displays closed cycle archive badge when isClosed is true", () => {
    const html = renderToString(
      <ExecutiveSummaryCard
        totalIncome={4000000}
        totalSpent={1500000}
        monthName="September 2026"
        isClosed={true}
      />
    );

    expect(html).toContain("Arsip Tutup Buku");
  });

  it("strictly enforces zero font-mono on all rendered currency numbers and metrics", () => {
    const html = renderToString(
      <ExecutiveSummaryCard
        totalIncome={5000000}
        totalSpent={2000000}
        baseSalary={4000000}
        additionalIncomes={1000000}
      />
    );

    // Invarian Tipografi: Dilarang keras font-mono
    expect(html).not.toContain("font-mono");
    // Wajib menggunakan tabular-nums
    expect(html).toContain("tabular-nums");
  });
});
