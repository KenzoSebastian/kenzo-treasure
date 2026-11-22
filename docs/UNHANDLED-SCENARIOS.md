# Kenzo Treasury — Matriks Skenario Tidak Terduga & Edge Cases Finansial

Dokumen ini memetakan seluruh skenario ekstrem, tindakan pengguna tak terduga (*wild user behaviors*), dan *edge cases* integritas finansial pada **Kenzo Treasury**. Dokumen ini menjadi pedoman perbaikan arsitektur dan pengetatan sistem (*defensive engineering*) agar tidak ada celah hitung ganda (*double-counting*), kebocoran Zero-Based Budgeting (ZBB), atau saldo menguap.

---

## 1. Ringkasan Matriks Skenario & Prioritas Risiko

| ID | Domain | Nama Skenario | Tingkat Keparahan | File / Modul Terdampak | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SC-01** | Liabilities | Pembayaran Cicilan Dobel & Percepatan Pokok dari Uang Bebas | 🔴 Kritis | `src/actions/liabilities.ts` | **COMPLETED ✅** |
| **SC-02** | Month Lifecycle | Reopen Month Tidak Menarik Kembali Saldo Disapu (*Double-Counting*) | 🔴 Kritis | `src/actions/months.ts` | **COMPLETED ✅** |
| **SC-03** | ZBB Budget | Edit Target Pos Reguler Tanpa Rebalancing Uang Bebas (*ZBB Drift*) | 🔴 Kritis | `src/actions/categories.ts` | ⚠️ Open |
| **SC-04** | ZBB Budget | Tambah Pos Anggaran Kustom Tanpa Kuota Uang Bebas (*ZBB Leak*) | 🔴 Kritis | `src/actions/categories.ts` | ⚠️ Open |
| **SC-05** | Liabilities | Bulan Terakhir Cicilan: Sisa Pokok < Cicilan Normal (*Dana Menganggur*) | 🔴 Kritis | `src/lib/month-generator.ts` | ⚠️ Open |
| **SC-06** | Incomes | Hapus Pemasukan Freelance saat Kuotanya Sudah Dibelanjakan (*Shock Deficit*) | 🔴 Kritis | `src/actions/incomes.ts` | ⚠️ Open |
| **SC-07** | Wishlists | Alokasi / Penarikan Dana pada Barang yang Sudah Terbeli (*Magic Money*) | 🔴 Kritis | `src/actions/wishlists.ts` | ⚠️ Open |
| **SC-08** | Liabilities | Edit Total Pokok Utang < Total Sudah Dibayar (*Inkonsistensi Server*) | 🟡 Sedang | `src/actions/liabilities.ts` | ⚠️ Open |
| **SC-09** | Liabilities | Hapus Cicilan dengan Riwayat Transaksi Menghasilkan Pos Hantu Bulan Depan | 🟡 Sedang | `src/actions/liabilities.ts` | ⚠️ Open |
| **SC-10** | Wishlists | Alokasi Wishlist Melebihi Sisa Kebutuhan (*Over-Allocation*) | 🟡 Sedang | `src/actions/wishlists.ts` | ⚠️ Open |
| **SC-11** | Wishlists | Ketiadaan Fitur Edit / Hapus Wishlist & Penyelamatan Dana Tersimpan | 🟡 Sedang | `src/actions/wishlists.ts` | ⚠️ Open |
| **SC-12** | Liabilities | Mengedit Cicilan Menjadi Lunas Tidak Mengembalikan Kuota Bulan Berjalan | 🟡 Sedang | `src/actions/liabilities.ts` | ⚠️ Open |
| **SC-13** | Month Lifecycle | Pembuatan Bulan Baru Tanpa Tutup Buku Bulan Lama (*Lompat Bulan*) | 🟡 Sedang | `src/actions/months.ts` | ⚠️ Open |
| **SC-14** | Month Lifecycle | Tutup Buku Tidak Menyapu Sisa Kuota Pos yang Belum Terpakai (*Uang Menguap*) | 🔴 Kritis | `src/actions/months.ts` | **COMPLETED ✅** |
| **SC-15** | Savings | Transfer Dana Darurat saat Target Rp 0 atau Sudah 100% Tercapai | 🟢 Rendah | `src/actions/savings.ts` | ⚠️ Open |
| **SC-16** | Transactions | Hard Delete Permanen Menghilangkan Riwayat Jejak Audit Finansial | 🟢 Rendah | `src/actions/transactions.ts` | ⚠️ Open |

---

## 2. Skenario yang Telah Selesai Diimplementasikan

### [SC-01] Pembayaran Cicilan Dobel & Percepatan Pokok dari Uang Bebas
- **Status:** **COMPLETED ✅** (Disetujui Kenzo pada 22 November 2026).
- **Kasus Riil:** Pengguna sudah membayar cicilan bulan ini (1x cicilan wajib). Kemudian pengguna ingin menyetor lagi di bulan yang sama untuk mempercepat pelunasan utang.
- **Solusi yang Diterapkan:**
  - Pos cicilan wajib yang sudah dibayar penuh memunculkan badge hijau `Sudah Dibayar Bulan Ini`.
  - Tombol aksi berubah menjadi `Bayar Ekstra Rp xxx`.
  - Pembayaran ekstra tidak membebani pos wajib, melainkan memotong sisa kuota `uang_bebas_tabungan` secara atomik di bawah transaksi database dengan tag rekonsiliasi `[ref:liability:<uuid>]`.
  - Validasi ketat memblokir pembayaran jika `sisa uang bebas < nominal cicilan`.
  - Fitur Undo 5 detik merekonsiliasi balik saldo utang dan transaksi secara akurat.

---

## 3. Rincian Skenario Kritis yang Belum Tertangani (🔴 Prioritas Tinggi)

### [SC-02] Reopen Month Tidak Menarik Kembali Saldo yang Sudah Disapu (*Bug Double-Counting*)
- **Status:** **COMPLETED ✅** (Disetujui Kenzo pada 22 November 2026)
- **Tingkat Keparahan:** 🔴 **Sangat Kritis (Double-Counting Saldo Tabungan)**
- **Modul Terdampak:** `src/actions/months.ts` (`closeMonth` & `reopenMonth`)
- **Kasus Riil:**
  1. Pengguna menutup buku bulan Februari 2026. Sisa Uang Bebas sebesar Rp 1.500.000 otomatis disapu (*month sweep*) ke `savings_account.balance`. Saldo tabungan bertambah dari Rp 2.000.000 $\rightarrow$ Rp 3.500.000.
  2. Dua hari kemudian, pengguna ingat ada 1 struk jajan yang belum tercatat.
  3. Pengguna menekan tombol "Buka Kembali Bulan Ini" (*Reopen Month*), mencatat struk Rp 50.000, lalu menutup buku bulan kembali.
- **Celah di Kode Eksisting:**
  - Fungsi `reopenMonth` saat ini HANYA mengubah `isClosed = false`.
  - Sistem sama sekali TIDAK mengurangi kembali nominal Rp 1.500.000 dari `savings_account.balance`!
  - Ketika bulan ditutup lagi, `closeMonth` mengeksekusi sweep ulang sebesar Rp 1.450.000.
  - **Hasil Akhir:** Tabungan pengguna bertambah ganda (+Rp 2.950.000) dari uang yang sama! Uang tercipta dari angin (*magic money*), melanggar Invarian Domain Finansial 6.
- **Solusi Best Practice:**
  1. Tambahkan kolom `swept_amount` (integer, default 0) pada tabel `months`.
  2. Saat `closeMonth`, simpan nominal yang disapu ke kolom `months.swept_amount`.
  3. Saat `reopenMonth`, periksa apakah `savings_account.balance >= months.swept_amount`.
  4. Lakukan pembalikan (*reversal*) atomik di dalam `db.transaction`: kurangi `savings_account.balance` sebesar `months.swept_amount` dan setel ulang `months.swept_amount = 0`.
  5. Jika saldo tabungan bebas ternyata sudah terlanjur dialokasikan ke wishlist atau dipindahkan ke dana darurat sehingga saldo bebas < sweptAmount, tampilkan dialog pencegahan: *"Dana sweep sebesar Rp X sudah terpakai di kantong tabungan lain. Tarik kembali dana dari Wishlist/Dana Darurat terlebih dahulu sebelum membuka kembali bulan ini."*

---

### [SC-03] Edit Target Pos Reguler Tanpa Rebalancing Uang Bebas (*ZBB Drift*)
- **Tingkat Keparahan:** 🔴 **Kritis (Pelanggaran Zero-Based Budgeting)**
- **Modul Terdampak:** `src/actions/categories.ts` (`updateCategoryTarget`)
- **Kasus Riil:**
  1. Gaji Pokok Kenzo: Rp 4.000.000.
  2. Alokasi awal: Pos Wajib Rp 1.500.000, Kebutuhan Pokok Rp 1.500.000, Uang Bebas Rp 1.000.000. Total anggaran = Rp 4.000.000 (ZBB seimbang 100%).
  3. Di tengah bulan, Kenzo mengedit target "Kebutuhan Pokok" naik menjadi Rp 2.000.000 (+Rp 500.000).
- **Celah di Kode Eksisting:**
  - `updateCategoryTarget` hanya memperbarui kolom `targetBudget` pada baris kategori yang bersangkutan.
  - Target pos `uang_bebas_tabungan` TIDAK disesuaikan.
  - **Hasil Akhir:** Total target pos menjadi Rp 4.500.000, padahal pemasukannya hanya Rp 4.000.000. Terjadi defisit perencanaan tak kasat mata (*ZBB drift*).
  - Sebaliknya, jika Kenzo menurunkan target pos dari Rp 1.500.000 ke Rp 1.000.000, kelebihan Rp 500.000 tidak kembali ke Uang Bebas, melainkan hilang dari total alokasi bulan berjalan.
- **Solusi Best Practice (Zero-Sum Conservation):**
  1. Bungkus mutasi di dalam `db.transaction` dengan *row-level locking* (`FOR UPDATE`) pada pos yang diedit dan pos `uang_bebas_tabungan`.
  2. Hitung selisih: $\Delta = \text{newTarget} - \text{oldTarget}$.
  3. **Jika $\Delta > 0$ (Target Naik):** Validasi apakah sisa kuota dan saldo Uang Bebas mencukupi ($\ge \Delta$). Jika ya, potong target `uang_bebas_tabungan` sebesar $\Delta$. Jika tidak, tolak dengan pesan: *"Sisa Uang Bebas tidak mencukupi untuk menambah target pos ini."*
  4. **Jika $\Delta < 0$ (Target Turun):** Kembalikan surplus $|\Delta|$ ke `uang_bebas_tabungan`.

---

### [SC-04] Tambah Pos Anggaran Kustom Tanpa Mengambil Kuota dari Uang Bebas (*ZBB Leak*)
- **Tingkat Keparahan:** 🔴 **Kritis (Kebocoran Plafon Anggaran)**
- **Modul Terdampak:** `src/actions/categories.ts` (`addCustomCategory`)
- **Kasus Riil:**
  1. Kenzo membuat pos kustom baru di tengah bulan, misalnya "Langganan Cloud" dengan target Rp 300.000.
- **Celah di Kode Eksisting:**
  - `addCustomCategory` langsung menyisipkan baris baru ke `budget_categories` dengan `targetBudget: 300000`.
  - Sistem tidak menyentuh atau memotong kuota dari `uang_bebas_tabungan`.
  - **Hasil Akhir:** Total kuota belanja yang direncanakan bulan itu membengkak menjadi $\text{Total Gaji} + \text{Rp 300.000}$.
- **Solusi Best Practice:**
  1. Serupa dengan alur `createLiability` saat mengalokasikan ke bulan berjalan: pembuatan pos kustom baru wajib memotong kuota dari `uang_bebas_tabungan` secara atomik.
  2. Tolak penambahan pos baru jika sisa kuota Uang Bebas tidak mencukupi untuk mendanai target pos baru tersebut.

---

### [SC-05] Bulan Terakhir Cicilan: Sisa Pokok < Cicilan Normal (*Dana Menganggur*)
- **Tingkat Keparahan:** 🔴 **Kritis (Integritas Alokasi Kas & Over-Budgeting)**
- **Modul Terdampak:** `src/lib/month-generator.ts` (`buildInheritedMonthCategories` & `buildInitialMonthCategories`)
- **Kasus Riil:**
  1. Kenzo memiliki cicilan HP Rp 12.000.000 dengan angsuran Rp 1.000.000 per bulan.
  2. Karena Kenzo sempat melakukan pembayaran ekstra, sisa pokok utang saat ini tinggal **Rp 250.000**.
  3. Saat Kenzo membuat siklus bulan baru, pos cicilan HP di-generate oleh sistem.
- **Celah di Kode Eksisting:**
  - Generator pos di `src/lib/month-generator.ts` (baris 296 & 329) men-set target pos cicilan sebesar `activeLiability.monthlyPayment` (tetap Rp 1.000.000 kaku).
  - Akibatnya, uang Rp 1.000.000 dianggarkan di pos wajib, padahal utangnya hanya bersisa Rp 250.000.
  - Ketika Kenzo melunasi sisa Rp 250.000, pos tersebut lunas, tetapi dana **Rp 750.000 tersandera menganggur** di pos cicilan sampai akhir bulan dan tidak bisa dipakai untuk kebutuhan lain.
- **Solusi Best Practice:**
  1. Pada generator pos anggaran baru, tentukan target anggaran cicilan dengan rumus dinamis:
     $$\text{Target Anggaran} = \min(\text{liability.monthlyPayment}, \text{liability.totalAmount} - \text{liability.paidAmount})$$
  2. Selisih penghematan $(\text{liability.monthlyPayment} - \text{Target Anggaran})$ otomatis dialihkan untuk memperbesar plafon `uang_bebas_tabungan` sejak hari pertama bulan baru.

---

### [SC-06] Hapus Pemasukan Freelance saat Kuotanya Sudah Dibelanjakan (*Shock Deficit*)
- **Tingkat Keparahan:** 🔴 **Kritis (Defisit Anggaran Mendadak Tanpa Warning)**
- **Modul Terdampak:** `src/actions/incomes.ts` (`deleteIncome` & `updateIncome`)
- **Kasus Riil:**
  1. Kenzo mencatat pemasukan sampingan *freelance* sebesar Rp 3.000.000.
  2. Sesuai prinsip *Dynamic Freedom Buffer*, kuota Uang Bebas Kenzo bertambah Rp 3.000.000.
  3. Kenzo kemudian berbelanja Rp 2.500.000 menggunakan kuota Uang Bebas tersebut.
  4. Keesokan harinya, karena ternyata klien menunda pembayaran atau ada kesalahan input, Kenzo menghapus catatan pemasukan freelance Rp 3.000.000 tersebut.
- **Celah di Kode Eksisting:**
  - `deleteIncome` langsung menghapus baris pemasukan dari tabel `incomes`.
  - Dynamic Freedom Buffer langsung menyusut kembali ke baseline gaji pokok.
  - Karena belanja aktual Rp 2.500.000 sudah tercatat, sisa Uang Bebas langsung anjlok ke angka negatif yang sangat dalam (Defisit -Rp 1.500.000).
- **Solusi Best Practice:**
  1. Sebelum mengeksekusi penghapusan atau pengurangan nominal pemasukan, periksa kesehatan arus kas bulan berjalan:
     $$\text{Total Pemasukan Baru} - \text{Total Pengeluaran Aktual Bulan Ini}$$
  2. Jika penghapusan pemasukan menyebabkan sisa Uang Bebas menjadi negatif ($< 0$), sistem wajib memunculkan dialog konfirmasi bahaya:
     *"Pemasukan ini telah terpakai untuk belanja sebesar Rp X. Menghapusnya akan menyebabkan anggaran bulan ini defisit sebesar -Rp Y. Apakah Anda yakin ingin melanjutkan?"*

---

### [SC-07] Alokasi atau Penarikan Dana pada Barang yang Sudah Terbeli (*Magic Money*)
- **Tingkat Keparahan:** 🔴 **Kritis (Integritas Saldo Tabungan & Anti-Penciptaan Uang)**
- **Modul Terdampak:** `src/actions/wishlists.ts` (`allocateSavings` & `withdrawFromWishlist`)
- **Kasus Riil:**
  1. Barang impian "Kamera Mirrorless" (target Rp 10.000.000) sudah terkumpul tabungannya Rp 10.000.000.
  2. Kenzo membeli kamera tersebut di toko dan menekan tombol "Tandai Sudah Dibeli" (`isPurchased = true`).
  3. Uang tabungan secara fisik dan riil sudah diserahkan ke kasir toko.
  4. Pengguna iseng atau tidak sengaja menekan tombol "Tarik Dana" dari kartu barang impian tersebut.
- **Celah di Kode Eksisting:**
  - `withdrawFromWishlist` sama sekali tidak memeriksa flag `isPurchased`.
  - Sistem akan menarik dana dari wishlist dan menambahkannya kembali ke `savings_account.balance`!
  - **Hasil Akhir:** Uang yang sudah dibelanjakan di dunia nyata hidup kembali di aplikasi menjadi saldo tabungan bebas fiktif.
- **Solusi Best Practice:**
  1. Kunci secara mutlak (*hard freeze*) Server Actions `allocateSavings` dan `withdrawFromWishlist` jika `wishlist.isPurchased === true`:
     `if (targetWishlist.isPurchased) throw new Error("WISHLIST_ALREADY_PURCHASED");`
  2. Jika pengguna salah menandai barang sebagai terbeli, sediakan alur khusus "Batalkan Pembelian" dengan verifikasi sadar.

---

## 4. Rincian Skenario Sedang & Rendah (🟡 & 🟢)

### [SC-08] Edit Total Pokok Utang Menjadi Lebih Kecil dari Total yang Sudah Dibayar
- **Tingkat Keparahan:** 🟡 **Sedang (Inkonsistensi Server-Side)**
- **Modul Terdampak:** `src/actions/liabilities.ts` (`updateLiability`)
- **Kasus Riil:** Cicilan mobil sudah terbayar Rp 15.000.000 dari total utang Rp 30.000.000. Pengguna mengedit form cicilan dan mengisi total pokok baru Rp 10.000.000.
- **Celah di Kode:** Client-side form memiliki validasi, tetapi Server Action `updateLiability` belum memvalidasi `nextTotal >= existing.paidAmount`.
- **Dampak:** Progres pelunasan menjadi 150%, sisa utang menjadi anomali negatif.
- **Solusi Best Practice:** Tambahkan validasi server-side:
  `if (nextTotal < existing.paidAmount) throw new Error("TOTAL_LESS_THAN_PAID");`

---

### [SC-09] Hapus Cicilan dengan Riwayat Transaksi Menghasilkan Pos Hantu Bulan Depan
- **Tingkat Keparahan:** 🟡 **Sedang (Loop Pos Hantu / Ghost Categories)**
- **Modul Terdampak:** `src/actions/liabilities.ts` (`deleteLiability`)
- **Kasus Riil:** Pengguna menghapus komitmen cicilan di tengah bulan setelah membayar 1 kali angsuran di bulan tersebut.
- **Celah di Kode:** Di `deleteLiability` (baris 1000), sistem melepaskan relasi dengan `liabilityId = null` dan mengubah `isTemporary = false` agar riwayat transaksi tetap aman.
- **Dampak:** Karena `liabilityId = null` dan `isTemporary = false`, generator bulan depan (`month-generator.ts`) menganggap pos ini adalah "Pos Operasional Reguler Permanen", sehingga pos cicilan yang sudah dihapus akan terus muncul kembali setiap bulan baru!
- **Solusi Best Practice:** Pertahankan `isTemporary = true` pada pos yang dilepas keterikatannya dari cicilan yang dihapus.

---

### [SC-10] Alokasi Wishlist Melebihi Sisa Kebutuhan (*Over-Allocation*)
- **Tingkat Keparahan:** 🟡 **Sedang (Pemborosan Likuiditas Bebas)**
- **Modul Terdampak:** `src/actions/wishlists.ts` (`allocateSavings`)
- **Kasus Riil:** Wishlist tinggal butuh Rp 200.000 untuk mencapai target Rp 5.000.000. Pengguna salah ketik menyetor Rp 2.000.000 dari tabungan bebas.
- **Celah di Kode:** `allocateSavings` tidak membatasi alokasi maksimal terhadap sisa kekurangan.
- **Dampak:** Wishlist terisi 136%, menyedot likuiditas tabungan bebas yang sebenarnya masih bisa dialokasikan ke pos atau impian lain.
- **Solusi Best Practice:** Batasi alokasi maksimal sebesar $\text{targetAmount} - \text{savedAmount}$, atau sediakan tombol otomatis *"Setor Sisa Kekurangan (Rp 200.000)"*.

---

### [SC-11] Ketiadaan Fitur Edit / Hapus Wishlist & Penyelamatan Dana Tersimpan
- **Tingkat Keparahan:** 🟡 **Sedang (Dana Tersangkut / Orphaned Funds)**
- **Modul Terdampak:** `src/actions/wishlists.ts`
- **Kasus Riil:** Pengguna batal membeli barang impian yang sudah terkumpul tabungan Rp 1.500.000 dan ingin menghapus wishlist tersebut.
- **Celah di Kode:** Belum ada Server Action `deleteWishlist` dan `updateWishlist`.
- **Solusi Best Practice:** Buat Server Action `deleteWishlist` dengan mekanisme otomatis *refund*: jika `savedAmount > 0`, sistem wajib mengembalikan seluruh dana terkumpul kembali ke `savings_account.balance` secara atomik dalam satu transaksi.

---

### [SC-12] Mengedit Cicilan Menjadi Lunas Tidak Mengembalikan Kuota Bulan Berjalan
- **Tingkat Keparahan:** 🟡 **Sedang (Dana Terkunci)**
- **Modul Terdampak:** `src/actions/liabilities.ts` (`updateLiability`)
- **Kasus Riil:** Pengguna mengedit cicilan di modal Tracking Cicilan menjadi lunas (`isSettled = true`).
- **Celah di Kode:** Pos cicilan terkait di bulan berjalan yang belum ada transaksi pembayarannya tetap mempertahankan `targetBudget: monthlyPayment` dan tidak dikembalikan ke Uang Bebas.
- **Solusi Best Practice:** Jika cicilan ditandai lunas, periksa pos terkait di bulan berjalan; jika belum ada transaksi terpakai, kembalikan kuotanya ke `uang_bebas_tabungan` dan setel `targetBudget = 0`.

---

### [SC-13] Pembuatan Bulan Baru Tanpa Tutup Buku Bulan Lama (*Lompat Bulan*)
- **Tingkat Keparahan:** 🟡 **Sedang (Integritas Riwayat Finansial)**
- **Modul Terdampak:** `src/actions/months.ts` (`createMonthlyCycle`)
- **Kasus Riil:** Pengguna masih berada di bulan Januari 2026. Belum melakukan tutup buku, pengguna langsung membuat bulan Februari 2026 atau Maret 2026.
- **Celah di Kode:** `createMonthlyCycle` mengizinkan banyak bulan berstatus `isClosed = false` secara simultan. Jika bulan lama tidak pernah ditutup, proses sweep sisa saldo ke tabungan tidak pernah tereksekusi.
- **Solusi Best Practice:** Tampilkan dialog konfirmasi sebelum membuat bulan baru jika bulan aktif saat ini belum ditutup: *"Bulan Januari 2026 belum ditutup. Apakah Anda ingin tutup buku dan sapu sisa saldo ke tabungan sekarang?"*.

---

### [SC-14] Tutup Buku Tidak Menyapu Sisa Kuota Pos yang Belum Terpakai (*Uang Menguap*)
- **Status:** **COMPLETED ✅** (Disetujui Kenzo pada 22 November 2026)
- **Tingkat Keparahan:** 🔴 **Kritis (Integritas Saldo & Uang Menguap)**
- **Modul Terdampak:** `src/actions/months.ts` (`closeMonth`), `src/lib/financial-calculations.ts` (`calculateMonthSweep`)
- **Kasus Riil:** Pengguna menerima gaji Rp 5.000.000. Terdapat pos cicilan (Rp 1.417.000) dan perpuluhan (Rp 500.000). Namun hingga akhir bulan belum ada transaksi yang dicatat (pengeluaran kas = Rp 0). Saat tutup buku, sistem lama hanya menyapu jatah pos uang bebas (Rp 3.133.000), sehingga selisih Rp 1.867.000 menguap dan saldo brankas tidak sesuai saldo rekening fisik.
- **Solusi yang Diterapkan (Opsi 1):**
  - Mengubah rumus sweep tutup buku menjadi berbasis Realisasi Kas Bersih:
    $$\text{Uang Disapu} = \max(0, \text{totalIncome} - \text{totalSpent})$$
  - Jika kas keluar = Rp 0, maka Rp 5.000.000 penuh disapu ke `savings_account.balance` (Tabungan Bebas).
  - Pos yang belum dibelanjakan tidak menguap, melainkan diakui sebagai sisa uang kas fisik yang disapu ke tabungan.
  - Sinergi 100% dengan SC-02: saat *reopen month*, saldo `sweptAmount` tetap ditarik kembali secara akurat tanpa *double-counting*.

---

### [SC-15] Transfer ke Brankas Dana Darurat saat Target Rp 0 atau Sudah 100% Tercapai
- **Tingkat Keparahan:** 🟢 **Rendah (UX Guard)**
- **Modul Terdampak:** `src/actions/savings.ts` (`transferToEmergencyFund`)
- **Kasus Riil:** Pengguna belum mengisi target dana darurat (`target = 0`) atau sudah mencapai 100%, tetapi tidak sengaja mentransfer saldo tabungan bebas ke dana darurat.
- **Solusi Best Practice:** Tampilkan konfirmasi atau anjuran untuk menaikkan target dana darurat terlebih dahulu.

---

### [SC-16] Hard Delete Permanen Menghilangkan Jejak Audit Finansial
- **Tingkat Keparahan:** 🟢 **Rendah (Audit Trail)**
- **Modul Terdampak:** `src/actions/transactions.ts` (`hardDeleteExpiredTransactions`)
- **Kasus Riil:** Transaksi yang dihapus dan melewati jendela undo 30 detik dimusnahkan permanen dari database.
- **Solusi Best Practice:** Pertahankan *soft-delete* (`isDeleted = true`) permanen untuk kebutuhan analitik dan riwayat audit keuangan tahunan.

---

## 5. Rekomendasi Urutan Pengerjaan Teknis

1. **Sprint 1 (Keamanan Saldo & Anti-Double Counting):**
   - **SC-02:** Reopen Month Reversal & Anti-Double-Counting pada Month Sweep.
   - **SC-07:** Freeze Mutasi pada Wishlist yang Sudah Berstatus Terbeli.
2. **Sprint 2 (Penegakan Disiplin Zero-Based Budgeting):**
   - **SC-03:** Zero-Sum Rebalancing saat Edit Target Pos Reguler.
   - **SC-04:** Penyerapan Kuota Uang Bebas saat Tambah Pos Kustom.
   - **SC-06:** Guard Defisit saat Hapus/Ubah Pemasukan Freelance.
3. **Sprint 3 (Penyempurnaan Pelacakan Utang & Cicilan):**
   - **SC-05:** Penanganan Bulan Terakhir Cicilan (Sisa Pokok < Cicilan Normal).
   - **SC-08:** Server-side Guard Edit Pokok Utang < Total Sudah Dibayar.
   - **SC-09:** Pencegahan Pos Hantu saat Hapus Cicilan dengan Riwayat Transaksi.
   - **SC-12:** Realokasi Kuota saat Cicilan Diedit Menjadi Lunas di Bulan Terbuka.
4. **Sprint 4 (Manajemen Wishlist & Peningkatan UX):**
   - **SC-10 & SC-11:** Fitur Edit/Hapus Wishlist dengan Auto-Refund dan Proteksi Over-Allocation.
   - **SC-13 & SC-14:** Konfirmasi Tutup Buku Berantai dan Opsi Sapu Sisa Pos Reguler.
