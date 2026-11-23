---
date: 2026-11-23
time: "19:54 WIB"
timezone: Asia/Jakarta
task: "Skenario SC-08: Validasi Server-Side Total Pokok Utang Tidak Boleh Lebih Kecil dari yang Sudah Dibayar"
prompt: "kmu kerjain trus ya sampe sc 16, tiap sc kmu git commit dulu, hanya kli ini aja aku ijinin kmu commit"
author: Antigravity
---

# Skenario SC-08: Validasi Server-Side Total Pokok Utang Tidak Boleh Lebih Kecil dari yang Sudah Dibayar

## 1. Ringkasan Perubahan

Menyelesaikan skenario **SC-08** dari `docs/UNHANDLED-SCENARIOS.md`:
- **Masalah:** Ketika cicilan sudah berjalan dan pengguna telah membayar sejumlah pokok (misal sudah terbayar Rp 15.000.000 dari total utang Rp 30.000.000), pengeditan parameter cicilan pada Server Action `updateLiability` sebelumnya belum memvalidasi `nextTotal >= existing.paidAmount`. Jika pengguna memasukkan total pokok baru yang lebih kecil (misal Rp 10.000.000), progres pelunasan menjadi anomali (>100%) dan sisa utang bernilai negatif.
- **Solusi:**
  1. Menambahkan validasi server-side di dalam transaksi atomik dengan *row-level locking* (`FOR UPDATE`):
     `if (nextTotal < existing.paidAmount) throw new Error("TOTAL_LESS_THAN_PAID:" + existing.paidAmount);`
  2. Menampilkan pesan error user-friendly lengkap dengan nominal yang sudah dibayar:
     `"Total pokok utang tidak boleh lebih kecil dari nominal yang sudah dibayar (Rp xxx)."`
  3. Menambahkan unit test di `src/actions/__tests__/backend-phases-b7-b13.test.ts`.

## 2. Berkas yang Berubah

| Berkas | Status | Alasan Perubahan |
| :--- | :--- | :--- |
| `src/actions/liabilities.ts` | MODIFIED | Menambahkan validasi `nextTotal < existing.paidAmount` pada `updateLiability` dan mengembalikan pesan error terformat. |
| `src/actions/__tests__/backend-phases-b7-b13.test.ts` | MODIFIED | Menambahkan unit test validasi batas minimum total pokok utang terhadap `paidAmount`. |
| `docs/UNHANDLED-SCENARIOS.md` | MODIFIED | Memperbarui status SC-08 menjadi `COMPLETED ✅`. |
| `laporan.md` | MODIFIED | Menambahkan Checkpoint 1 SC-08 dengan status `COMPLETED ✅`. |

## 3. Hasil Verifikasi

- **Typecheck (`tsc --noEmit`):** `PASS` (0 error)
- **Unit & Integration Tests (`bun test`):** `PASS` (99 pass, 0 fail across 7 test files, 443 assertions)
- **Production Build (`bun run build`):** `PASS` (Next.js 16 Turbopack build sukses, 11/11 routes terkompilasi)
- **Design & Invariant Audit:** Bebas `font-mono` (100% `tabular-nums`), bebas emoji literal di `src/`.

## 4. Status

`COMPLETED ✅ — Approved by Kenzo (Explicit continuous batch authorization)`
