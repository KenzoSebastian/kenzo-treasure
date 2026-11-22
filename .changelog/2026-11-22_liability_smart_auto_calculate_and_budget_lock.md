---
date: 2026-11-22
time: "14:24 WIB"
timezone: Asia/Jakarta
task: Penyelarasan Kontrak Cicilan: Kalkulasi Otomatis Timbal Balik, Penguncian Pos Cicilan & Modal Edit Cicilan Terpusat
prompt: tadi kan aku coba bikin tes cicil, di tracking cicilan, itukan otomatis bikin pos baru kan di atasnya, trus aku iseng ganti/edit targetnya jadi 100.000, kok ga berubah juga ya di card cicilan, itu masih 200 ribu, itu kenapaa?? aku mau tnya dulu; okee pilihan 2 deh, sama tolong itu kan tenor nya 12 bulan , tapi itu kok sampe 85 bulan tersisa?? atau nnti pas buat/edit cicilan cicilan per bulannya itu otomatis dari total cicilan dibagi tenor?? atau gmna?? best practicenya gmna; okee kerjain sekarang
author: Antigravity
---

# Penyelarasan Kontrak Cicilan — Smart Auto-Calculate, Penguncian Pos Cicilan & Modal Edit Terpusat

## 1. Ringkasan Perubahan
Memperbaiki integritas data finansial antara modul **Pos Anggaran Bulanan (`budgetCategories`)** dan modul **Tracking Cicilan & Utang Bertarget Lunas (`liabilities`)**:
- **Akar Masalah:**
  1. Pos cicilan di kartu anggaran sebelumnya memiliki tombol edit target (ikon pensil), sehingga pengguna bisa mengubah alokasi bulan berjalan tanpa menyinkronkan data kontrak induk `liabilities.monthlyPayment`. Akibatnya terjadi desinkronisasi (pos anggaran Rp 100.000 vs kartu cicilan tetap Rp 200.000).
  2. Pembuatan cicilan sebelumnya tidak menerapkan kalkulasi otomatis antara Total Pokok Utang, Tenor Bulan, dan Cicilan per Bulan. Pengguna bisa menginput total Rp 17.000.000, tenor 12 bulan, namun cicilan Rp 200.000/bln. Karena sisa bulan dihitung dari $\lceil \text{Sisa Pokok} / \text{Cicilan Bulanan} \rceil$, sistem menampilkan "85 Bulan Tersisa" (karena Rp 17.000.000 / Rp 200.000 = 85 bulan), yang berkontradiksi dengan label tenor 12 bulan.
- **Solusi Komprehensif (Pilihan 2 — Strict Lock & Centralized Edit with Smart Auto-Calculate):**
  1. **Penguncian Pos Cicilan di `BudgetCategoryCard.tsx` & Eliminasi Teks "Kontrak Utang":**
     - Tombol pensil edit target dihilangkan jika pos memiliki `category.liabilityId`, menjaga tampilan pos anggaran bersih tanpa lencana teks "Kontrak Utang" yang canggung/tertekuk.
     - Di lapisan server action (`src/actions/categories.ts` -> `updateCategoryTarget`), penolakan mutasi dilakukan secara tegas jika `catWithMonth.liabilityId` terdeteksi (*defense-in-depth*).
  2. **Smart Bidirectional Auto-Calculate (Kalkulasi Timbal Balik Otomatis & Pembulatan Ribuan Rapi):**
     - Diterapkan pada modal Tambah Cicilan dan modal Edit Cicilan.
     - Rumus matematis: Cicilan bulanan dihitung dari $\lceil (\text{totalAmount} / \text{tenorMonths}) / 1000 \rceil \times 1000$ (dibulatkan ke atas ke kelipatan ribuan Rupiah terdekat agar nominal rapi dan tidak bernomor ganjil/pecahan receh, contoh: Rp 4.000.000 / 12 bln menghasilkan Rp 334.000, bukan Rp 333.334).
     - Tenor dihitung balik: $\text{tenorMonths} = \max(1, \lceil \text{totalAmount} / \text{monthlyPayment} \rceil)$.
     - Saat Total Pokok atau Tenor diubah $\rightarrow$ Cicilan per Bulan otomatis terhitung rapi.
     - Saat Cicilan per Bulan disesuaikan manual $\rightarrow$ Tenor otomatis dihitung ulang secara real-time.
     - Menghilangkan kontradiksi matematis selamanya (misal: utang 17jt dengan tenor 12 bulan otomatis terisi Rp 1.417.000/bln dan sisa bulan tepat 12 bulan).
  3. **Modal Edit Cicilan Terpusat di `LiabilityTrackerCard.tsx`:**
     - Menambahkan tombol edit (ikon pensil kecil) di samping nama cicilan pada setiap kartu cicilan aktif.
     - Menampilkan modal dialog edit dengan form: Nama, Total Pokok Utang, Tenor Pelunasan, Cicilan per Bulan (dengan kalkulasi otomatis timbal balik), dan `IconPicker`.
     - Menggunakan server action `updateLiability` yang secara atomik memperbarui tabel `liabilities`, menyinkronkan pos anggaran siklus berjalan terkait di `budgetCategories`, serta menyesuaikan alokasi saldo `Uang Bebas / Tabungan` secara seimbang (*Zero-Based Budgeting invariant*).
  4. **Fitur Hapus Cicilan (Opsi B — Langsung di Kartu dengan Proteksi Atomik):**
     - Menambahkan tombol hapus (ikon tempat sampah `Trash2` warna merah) di header setiap kartu cicilan aktif.
     - Menampilkan dialog konfirmasi hapus modal box standar (*fixed header, scrollable body, edge-to-edge footer*).
     - Server action `deleteLiability`: Menghapus data `liabilities`, dan jika pos anggaran terkait di bulan berjalan belum memiliki riwayat transaksi, pos tersebut ikut dihapus dan sisa plafon anggarannya otomatis dikembalikan utuh ke `Uang Bebas / Tabungan` secara atomik (*Zero-Based Budgeting*).
     - Jika sudah ada riwayat transaksi pembayaran riil, tautan pos anggaran dilepas (`liabilityId = null`) agar catatan pengeluaran harian pengguna tidak hilang atau korup.
  5. **Penyelarasan Status Semantik 'Target Terpenuhi' (Hijau Emerald) saat Penyerapan Pas 100%:**
     - Ketika realisasi pos anggaran tepat sama dengan targetnya (`spent === target` dan `sisa === 0`), status pos tidak lagi menampilkan peringatan kuning/oranye *"Mendekati Limit >80%"*, melainkan lencana hijau sukses: **`Target Terpenuhi`**.
     - Progress bar pada kartu juga bernuansa hijau emerald (`bg-emerald-500`), memberikan afirmasi positif bahwa kuota pos tercapai sempurna tanpa mengalami kebocoran anggaran atau overbudget.
     - Ambang batas waspada *"Mendekati Limit >80%"* kini hanya aktif jika pengeluaran berada di antara 80% hingga kurang dari 100% (`spent < target`).
  6. **Kepatuhan Standar Modal Box & Tipografi:**
     - Header fixed, scrollable body, dan solid edge-to-edge footer sesuai aturan modal box Kenzo Treasury.
     - Bebas 100% dari emoji literal (menggunakan ikon semantik Lucide `Info`, `Lock`, `Pencil`, `Trash2`).
     - Seluruh angka Rupiah dan persentase menggunakan font proporsional standar dengan kelas `tabular-nums` tanpa `font-mono`.

## 2. File Changes
- `[MODIFIED] src/schemas/liability.schema.ts`: Menambahkan skema validasi `deleteLiabilitySchema` (`liabilityId: uuid`).
- `[MODIFIED] src/actions/liabilities.ts`: Mengimplementasikan server action `deleteLiability` dengan atomik transaksi database, penghapusan pos anggaran nir-transaksi, pengembalian sisa alokasi ke Uang Bebas, dan revalidasi rute.
- `[MODIFIED] src/lib/financial-calculations.ts`: Menambahkan fungsi `calculateMonthlyInstallment` (dengan pembulatan ke atas ke kelipatan ribuan Rupiah terdekat) dan `calculateTenorFromMonthly`.
- `[MODIFIED] src/lib/__tests__/financial-calculations.test.ts`: Menambahkan unit test komprehensif untuk memverifikasi kalkulasi cicilan bulanan yang dibulatkan ke kelipatan ribuan terdekat.
- `[MODIFIED] src/schemas/__tests__/schemas.test.ts`: Menambahkan unit test untuk memvalidasi `deleteLiabilitySchema`.
- `[MODIFIED] src/actions/categories.ts`: Menambahkan pemeriksaan `catWithMonth.liabilityId` pada server action `updateCategoryTarget` agar pos cicilan tidak dapat diubah targetnya dari luar modul cicilan.
- `[MODIFIED] src/components/features/categories/BudgetCategoryCard.tsx`: Menyembunyikan tombol edit target pada pos bertaut cicilan tanpa menampilkan badge canggung, serta menjaga tata letak bersih.
- `[MODIFIED] src/components/features/liabilities/LiabilityTrackerCard.tsx`:
  - Mengintegrasikan fungsi pembantu kalkulasi timbal balik `calculateMonthlyInstallment` dan `calculateTenorFromMonthly`.
  - Menerapkan auto-calculate real-time pada form tambah cicilan.
  - Menambahkan tombol pensil edit dan tombol tempat sampah hapus pada header kartu cicilan aktif (Opsi B).
  - Mengimplementasikan modal dialog Edit Cicilan dan dialog konfirmasi Hapus Cicilan.
- `[MODIFIED] src/components/features/__tests__/frontend-phases-f7-f18.test.tsx`: Menambahkan unit test untuk memverifikasi penonaktifan tombol edit pada pos cicilan dan kehadiran tombol edit & hapus cicilan pada `LiabilityTrackerCard`.

## 3. Hasil Verifikasi
- Static Analysis (`tsc --noEmit`): **PASS** (0 errors).
- Unit & Integration Test (`bun test`): **PASS** (89 passed, 0 failed, 378 expect calls).
- Production Build (`bun run build` via Next.js Turbopack): **PASS** (11/11 static/dynamic routes compiled).
- Zero Monospace Audit: **PASS** (0 temuan `font-mono`).
- Zero Literal Emoji Audit: **PASS** (100% ikon semantik Lucide).

## 4. Status
- `COMPLETED ✅ — Approved by Kenzo (2026-11-22 15:02 WIB)`
