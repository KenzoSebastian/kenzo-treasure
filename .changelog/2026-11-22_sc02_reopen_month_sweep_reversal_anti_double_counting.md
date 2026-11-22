---
date: 2026-11-22
time: "20:58 WIB"
timezone: Asia/Jakarta
task: "Skenario 2: Reopen Month Sweep Reversal & Anti-Double-Counting Tabungan Bebas"
prompt: "sc 02 aku masih ga paham itu gmna?? ada kasus real gaa? -> oke kerjain deh itu dulu"
author: Antigravity
---

# Skenario 2: Reopen Month Sweep Reversal & Anti-Double-Counting Tabungan Bebas

## Ringkasan Perubahan
Menyelesaikan celah finansial kritis **SC-02** pada siklus bulan (*Month Lifecycle*). Sebelumnya, ketika bulan ditutup (*Month Closing*), surplus sisa kuota Uang Bebas disapu (*Automatic Savings Sweep*) ke `savings_account.balance`. Namun ketika bulan tersebut dibuka kembali (`reopenMonth`) untuk koreksi transaksi dan kemudian ditutup ulang, sistem menyapu kembali surplus tersebut tanpa pernah menarik (*reverse*) nominal yang telah disapu sebelumnya. Hal ini menyebabkan saldo tabungan bertambah ganda (*double-counting*) dari uang yang sama.

Perubahan ini menerapkan pencatatan histori nominal sweep pada kolom `swept_amount` di tabel `months`, penarikan kembali (*reversal*) atomik dari `savings_account.balance` saat `reopenMonth`, *Anti-Defisit Guard* agar saldo tabungan tidak menjadi negatif jika dana sweep telah terlanjur dialokasikan ke kantong lain, serta transparansi visual pada UI dialog konfirmasi dan notifikasi toast.

## File yang Berubah
1. `src/db/schema.ts`: Menambahkan kolom `sweptAmount: integer("swept_amount").default(0).notNull()` pada tabel `months`.
2. `src/db/migrations/0004_add_months_swept_amount.sql`: Berkas migrasi DDL SQL untuk menambahkan kolom `swept_amount` secara idempoten.
3. `src/types/month.ts`: Menambahkan properti `sweptAmount?: number` pada tipe data `MonthSummary`.
4. `src/actions/months.ts`:
   - `closeMonth`: Menyimpan nominal yang disapu ke kolom `months.sweptAmount` saat `surplusAction === "sweep_to_savings"`.
   - `reopenMonth`: Melakukan penarikan balik (*reversal*) atomik sebesar `targetMonth.sweptAmount` dari `savings_account.balance` dengan *row-level locking* (`FOR UPDATE`). Memvalidasi `currentSavings >= previousSwept` (*Anti-Defisit Guard*) dan me-reset `months.sweptAmount = 0`.
5. `src/components/features/ai/AiMonthlyReviewModal.tsx`:
   - Menerima properti `sweptAmount?: number`.
   - Menampilkan peringatan transparan di dialog konfirmasi: *"Saldo Sweep Ditarik Kembali: -Rp xxx"*.
   - Notifikasi toast sukses yang informatif menjelaskan penarikan kembali saldo sweep.
6. `src/app/(dashboard)/dashboard/(overview)/page.tsx`: Meneruskan `sweptAmount={currentMonthDetail.sweptAmount}` ke `AiMonthlyReviewModal`.
7. `src/actions/__tests__/months.test.ts`: Menambahkan pengujian kontrak Zod `reopenMonthSchema` dan simulasi integritas finansial SC-02 (zero double-counting & anti-defisit guard).
8. `docs/UNHANDLED-SCENARIOS.md`: Memperbarui status SC-02 menjadi `IMPLEMENTED — AWAITING APPROVAL`.

## Verifikasi Kualitas
- `tsc --noEmit`: **PASS** (0 errors).
- `bun test`: **PASS** (91 pass, 0 fail, 410 expect calls across 7 test files).
- `next build` (Turbopack): **PASS** (11/11 routes generated).
- Invarian Tipografi: 100% `tabular-nums`, 0 `font-mono`.
- Invarian Desain: 0 literal emojis di `src/`.

## Status
`COMPLETED ✅ — Approved by Kenzo (2026-11-22 21:45 WIB)`
