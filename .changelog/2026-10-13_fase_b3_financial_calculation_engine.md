---
date: 2026-10-13
task: Implementasi Fase B3 Financial Calculation Engine (Single Source of Truth)
prompt: oke lanjut b3
author: Cecillia (Cil)
status: APPROVED
---

# Fase B3: Financial Calculation Engine (Single Source of Truth)

## 1. Ringkasan Perubahan

Mengimplementasikan mesin kalkulasi finansial terpusat murni (*pure functions*) sebagai satu-satunya sumber kebenaran rumus di Kenzo Treasury, menjamin kepatuhan absolut pada invarian domain finansial (`.agents/rules/financial-domain.md`):
- **Integer Rupiah & Sanitasi Angka:**
  - `toIntegerRupiah`: Membulatkan secara deterministik float/desimal ke integer Rupiah murni dengan perlindungan terhadap `NaN` / `Infinity`.
  - `formatRupiah`: Pemformat mata uang standar Indonesia (`Intl.NumberFormat('id-ID')`) dengan penanganan angka negatif (`-Rp 50.000`), opsi prefix, dan spasi.
  - `parseRupiah`: Parser teks format Rupiah kembali ke integer murni.
- **Kalkulasi Anggaran Pos & Status Kesehatan:**
  - `calculateRemainingBudget`: Menghitung sisa kuota pos ($\text{Target} - \text{Terpakai}$).
  - `calculateBudgetUsagePercentage`: Menghitung persentase pemakaian kuota anggaran.
  - `getBudgetStatus`: Mengklasifikasikan status anggaran berdasarkan ambang batas FR-5.1:
    - 🟢 `healthy`: Terpakai $< 80\%$ Target.
    - 🟡 `warning`: $80\% \le \text{Terpakai} \le 100\%$ Target.
    - 🔴 `overbudget`: Terpakai $> 100\%$ Target.
- **Dynamic Freedom Buffer (Multi-Source Incomes):**
  - `calculateDynamicFreedomBuffer`: Menghitung penambahan kuota target `🍿 Uang Bebas / Tabungan` secara dinamis dari pemasukan tambahan (freelance, bonus) tanpa menaikkan pos wajib atau kebutuhan operasional.
- **Pelacakan Utang & Cicilan Bertarget Lunas (Finite Liabilities):**
  - `calculateDebtProgress`: Menghitung nominal sisa utang pokok, persentase lunas, dan status `isSettled` (`paidAmount >= totalAmount`).
  - `calculateRemainingDebtMonths`: Menghitung estimasi sisa bulan cicilan dengan pembulatan ke atas ($\lceil \frac{\text{Sisa Utang}}{\text{Cicilan Bulanan}} \rceil$).
- **Brankas Dana Darurat & Meteran Ketahanan (Safety Months):**
  - `calculateSafetyMonths`: Menghitung rasio bulan ketahanan hidup jika tanpa penghasilan ($\frac{\text{Saldo Dana Darurat}}{\text{Pengeluaran Wajib Bulanan}}$) dibulatkan ke 1 angka desimal, persentase terhadap target default Rp 18.000.000, serta flag capaian target.
- **Tabungan Bebas & Gamifikasi Sinking Fund Wishlist:**
  - `calculateFreeSavings`: Memisahkan saldo tabungan bebas dari saldo dana darurat agar tidak terjadi *double-counting*.
  - `calculateWishlistProgress`: Menghitung sisa nominal dan progres milestone gamifikasi barang impian sesuai PRD FR-10.4:
    - $< 50\%$: 🎯 Langkah Awal
    - $\ge 50\%$: 🥈 Halfway Hero
    - $\ge 75\%$: 🥇 Major Milestone
    - $\ge 90\%$: 🔥 Final Stretch
    - $\ge 95\%$: ⚡ One Step Away
    - $100\%$: 🏆 DREAM UNLOCKED!
- **Arus Kas Bulanan & Tutup Buku (Month Sweep):**
  - `calculateNetCashflow`: Arus kas bersih bulanan ($\text{Total Pemasukan} - \text{Total Pengeluaran}$).
  - `calculateSavingsRate`: Rasio tabungan bulanan terhadap pemasukan (0 - 100%).
  - `calculateMonthSweep`: Menghitung sisa kuota uang bebas positif yang disapu bersih ke `savings_account.balance` saat tutup buku (saldo defisit tidak disapu).
- **Unit Testing Suite Mandiri:**
  - `src/lib/__tests__/financial-calculations.test.ts`: 21 skenario pengujian komprehensif mencakup semua rumus, batas ambang batas, dan edge cases tanpa float bug.

## 2. Berkas Terdampak

- `[CREATED] src/lib/financial-calculations.ts`: Berkas terpusat Single Source of Truth seluruh rumus finansial Kenzo Treasury.
- `[CREATED] src/lib/__tests__/financial-calculations.test.ts`: Unit test suite komprehensif menggunakan Bun test runner.
- `[MODIFIED] package.json`: Penambahan script `"test": "bun test"` dan penambahan devDependency `@types/bun`.
- `[MODIFIED] bun.lock`: Lockfile dependency diperbarui.

## 3. Hasil Verifikasi

- **Unit Tests:** `bun test` $\rightarrow$ **PASS** (21 passed, 0 failed, 91 assertion calls, 42ms).
- **Typecheck:** `bun run typecheck` $\rightarrow$ **PASS** (0 errors).
- **Build:** `bun run build` $\rightarrow$ **PASS** (Next.js 16 Turbopack production build berhasil).
- **Manual UI:** **NOT RUN** (Fase ini merupakan pure mathematical engine di backend, tidak ada interaksi UI langsung).

## 4. Status Fase

- **Status:** `APPROVED` ✅
- **Checklist Plan:** Seluruh checklist Fase B3 di `PLANBACKEND.md` telah diverifikasi dan dicentang (`- [x]`).

## 5. Riwayat Persetujuan (Approval)

- **Status Persetujuan:** `APPROVED` ✅
- **Tanggal Disetujui:** 2026-10-13
- **Diverifikasi oleh:** Kenzo Sebastian (Ken)
