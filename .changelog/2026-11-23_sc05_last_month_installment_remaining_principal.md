---
date: 2026-11-23
time: "19:30 WIB"
timezone: Asia/Jakarta
task: "Skenario SC-05: Penyesuaian Plafon Bulan Terakhir Cicilan & Relokasi Dana Menganggur ke Uang Bebas"
prompt: "sc 05 dulu kerjain"
author: Antigravity
---

# Skenario SC-05: Penyesuaian Plafon Bulan Terakhir Cicilan & Relokasi Dana Menganggur ke Uang Bebas

## 1. Ringkasan Perubahan

Menyelesaikan skenario kritis **SC-05** dari `docs/UNHANDLED-SCENARIOS.md`:
- **Masalah:** Pada siklus bulan terakhir cicilan aktif, ketika sisa pokok utang ($\text{totalAmount} - \text{paidAmount}$) lebih kecil daripada angsuran normal ($\text{monthlyPayment}$, misal sisa pokok tinggal Rp 250.000 vs angsuran normal Rp 1.000.000), generator pos bulanan (`month-generator.ts`) sebelumnya men-set target pos cicilan kaku sebesar Rp 1.000.000. Akibatnya, dana sebesar Rp 750.000 tersandera menganggur (*idle/stranded funds*) di pos wajib sepanjang bulan dan tidak dapat dimanfaatkan untuk kebutuhan lain atau tabungan bebas.
- **Solusi:**
  1. Menambahkan helper kalkulasi murni `calculateAllocatedInstallmentTarget(liability: InheritedLiabilitySource): number` dengan formula:
     $$\text{Target Anggaran} = \min(\text{monthlyPayment}, \max(0, \text{totalAmount} - \text{paidAmount}))$$
  2. Mengintegrasikan ke `buildInheritedMonthCategories`:
     - Pos cicilan di-set targetnya sebesar `allocatedTarget`.
     - Selisih dana $(\text{prevCat.targetBudget} - \text{allocatedTarget})$ otomatis direlokasikan untuk memperbesar kuota `uang_bebas_tabungan` sejak hari pertama bulan baru.
     - Cicilan aktif baru yang belum ada di bulan sebelumnya juga dihitung dengan batas plafon sisa pokok riil.
  3. Mengintegrasikan ke `buildInitialMonthCategories`:
     - Kuota potongan komitmen cicilan awal (`activeLiabilitiesSum`) dihitung dari `calculateAllocatedInstallmentTarget` sehingga tidak memotong Uang Bebas secara berlebihan.
     - Pos cicilan awal di-set targetnya secara proporsional sesuai sisa pokok aktual.
  4. Menambahkan test suite unit di `src/actions/__tests__/months.test.ts` yang memvalidasi kasus sisa pokok < angsuran, sisa pokok >= angsuran, cicilan lunas (0), serta skenario riil penambahan kuota Uang Bebas.

## 2. Berkas yang Berubah

| Berkas | Status | Alasan Perubahan |
| :--- | :--- | :--- |
| `src/lib/month-generator.ts` | MODIFIED | Menambahkan `calculateAllocatedInstallmentTarget`, mengintegrasikannya ke `buildInheritedMonthCategories` & `buildInitialMonthCategories`, serta merelokasi sisa dana ke Uang Bebas. |
| `src/actions/__tests__/months.test.ts` | MODIFIED | Menambahkan 3 unit tests untuk validasi formula plafon sisa pokok cicilan dan relokasi surplus ke Uang Bebas. |
| `docs/UNHANDLED-SCENARIOS.md` | MODIFIED | Memperbarui status SC-05 dari `⚠️ Open` menjadi `🟡 IMPLEMENTED (Awaiting Approval)`. |
| `laporan.md` | MODIFIED | Mencatat Checkpoint 1 SC-05 dan merotasi Checkpoint 5 lama ke tabel arsip milestone (mekanisme *rolling window*). |

## 3. Hasil Verifikasi

- **Typecheck (`tsc --noEmit`):** `PASS` (0 error)
- **Unit & Integration Tests (`bun test`):** `PASS` (95 pass, 0 fail across 7 test files, 433 assertions)
- **Production Build (`bun run build`):** `PASS` (Next.js 16 Turbopack build sukses, 11/11 routes terkompilasi bersih)
- **Design & Invariant Audit:** Bebas `font-mono` (100% `tabular-nums`), bebas emoji literal di `src/`.

## 4. Status

`COMPLETED ✅ — Approved by Kenzo (2026-11-23 19:34 WIB)`
