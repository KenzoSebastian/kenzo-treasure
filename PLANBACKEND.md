# PLANBACKEND.md — Roadmap Pengembangan Backend Kenzo Treasury

Dokumen ini adalah rencana kerja backend bertahap (granular) untuk **Kenzo Treasury**. Setiap fase memiliki checklist mandiri dan **wajib mengikuti Protokol Eksekusi & Approval Gate** di [`AGENTS.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/AGENTS.md).

> [!IMPORTANT]
> **ATURAN KERJA AGENT:**
> 1. Kerjakan **hanya 1 fase per turn/sesi**. Dilarang melompat ke fase lain.
> 2. Sebelum mulai, baca [`PRD.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/PRD.md) dan [`AGENTS.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/AGENTS.md).
> 3. Setelah fase selesai, laporkan daftar file yang diubah/dibuat beserta fungsinya secara detail.
> 4. **DILARANG MENCENTANG (`- [x]`)** checklist sebelum Kenzo memberikan approval eksplisit.

---

## 🗂️ Daftar Fase Backend

### Fase B1: Konfigurasi Drizzle ORM, Koneksi PostgreSQL & Base Schema
- [x] Setup dependensi database (`drizzle-orm`, `drizzle-kit`, `postgres`, `@supabase/supabase-js`).
- [x] Buat file konfigurasi koneksi database di `src/db/index.ts`.
- [x] Buat konfigurasi Drizzle Kit di `drizzle.config.ts`.
- [x] Tulis skema lengkap 9 tabel di `src/db/schema.ts` (`users`, `savings_account`, `months`, `incomes`, `liabilities`, `budget_categories`, `transactions`, `wishlists`, `wishlist_allocations`) lengkap dengan `created_at` dan `updated_at`.
- [x] Ekspor type inference Drizzle (`$inferSelect`, `$inferInsert`) untuk semua tabel.
- [x] Generate file migrasi SQL perdana via `drizzle-kit generate`.

---

### Fase B2: Supabase SSR Client, Proxy Session & Auth Helpers
- [x] Setup dependensi autentikasi `@supabase/ssr`.
- [x] Buat helper Supabase Client SSR di `src/lib/supabase/server.ts` (menggunakan cookies).
- [x] Buat helper Supabase Client Browser di `src/lib/supabase/client.ts`.
- [x] Buat helper session refresh & proteksi rute (`src/proxy.ts`): memproteksi workspace privat (`/dashboard/*`) dan mengizinkan akses publik ke halaman depan (`/`) serta auth (`/login`, `/register`).
- [x] Tautkan profil pengguna ke Supabase Auth (sinkronisasi profil `users` saat signup/login perdana).
- [x] Buat Server Actions autentikasi di `src/actions/auth.ts` (`login`, `register`, `logout`, `getCurrentUser`).

---

### Fase B3: Financial Calculation Engine (Single Source of Truth)
- [x] Buat berkas terpusat `src/lib/financial-calculations.ts` sebagai satu-satunya sumber rumus finansial.
- [x] Implementasikan fungsi rumus sisa anggaran pos: `calculateRemainingBudget(target, spent)`.
- [x] Implementasikan fungsi status anggaran pos: `getBudgetStatus(target, spent)` (`healthy`, `warning`, `overbudget`).
- [x] Implementasikan fungsi progress utang: `calculateDebtProgress(paid, total)` & cek pelunasan (`isSettled`).
- [x] Implementasikan fungsi safety months dana darurat: `calculateSafetyMonths(balance, monthlyFixedExpense)`.
- [x] Implementasikan fungsi saldo tabungan bebas: `calculateFreeSavings(...)`.
- [x] Buat unit test mandiri di `src/lib/__tests__/financial-calculations.test.ts` untuk memverifikasi akurasi matematika finansial tanpa desimal/floating point bug.

---

### Fase B4: Shared Zod Validation Schemas (Client-Server Contract)
- [x] Setup dependensi `@hookform/resolvers` dan `zod`.
- [x] Buat `src/schemas/auth.schema.ts` (validasi email, password, nama lengkap).
- [x] Buat `src/schemas/month.schema.ts` (validasi tahun, index bulan, tutup buku).
- [x] Buat `src/schemas/income.schema.ts` (validasi nominal integer > 0, sumber, tanggal).
- [x] Buat `src/schemas/liability.schema.ts` (validasi nominal total, cicilan bulanan, nama utang).
- [x] Buat `src/schemas/category.schema.ts` (validasi target budget, nama pos, icon, group).
- [x] Buat `src/schemas/transaction.schema.ts` (validasi nominal pengeluaran, tanggal bulan berjalan, metode bayar).
- [x] Buat `src/schemas/wishlist.schema.ts` (validasi target barang, nominal alokasi setor/tarik).

---

### Fase B5: Server Actions — Month Lifecycle & Master 7 Category Generator
- [ ] Buat `src/actions/months.ts`.
- [ ] Implementasikan `createMonthlyCycle(userId, year, monthIndex)`:
  - Generate record tabel `months`.
  - Otomatis generate baris `incomes` default `💵 Gaji Pokok: Rp 4.000.000`.
  - Otomatis generate 7 pos anggaran default (`budget_categories`): Perpuluhan, Listrik, Tabungan, Bensin, Jajan, Cicilan iPhone, Talangan Mama.
  - Link otomatis ke record `liabilities` aktif untuk pos cicilan.
- [ ] Implementasikan `getActiveMonth(userId)` dan `getAllMonths(userId)`.
- [ ] Implementasikan `closeMonth(monthId)` untuk mengunci siklus bulan.

---

### Fase B6: Server Actions — Multi-Source Incomes Engine
- [ ] Buat `src/actions/incomes.ts`.
- [ ] Implementasikan `addIncome(monthId, data)` dengan validasi Zod.
- [ ] Implementasikan logika alokasi dinamis: deteksi apakah gaji pokok (`isBaseSalary = true`) atau pemasukan sampingan/freelance.
- [ ] Implementasikan `updateIncome(incomeId, data)` dan `deleteIncome(incomeId)`.
- [ ] Implementasikan `getMonthlyIncomes(monthId)` dengan total rekapitulasi pemasukan.

---

### Fase B7: Server Actions — Finite Liabilities & Installment Tracker
- [ ] Buat `src/actions/liabilities.ts`.
- [ ] Implementasikan `getLiabilities(userId)` (daftar cicilan aktif vs yang sudah 🏆 lunas).
- [ ] Implementasikan `createLiability(data)` untuk menambah pos cicilan bertarget baru.
- [ ] Implementasikan `recordInstallmentPayment(liabilityId, amount, transactionId)`:
  - Update akumulasi `paidAmount`.
  - Auto-set `isSettled = true` jika `paidAmount >= totalAmount`.
  - Update pos kategori terkait agar di bulan berikutnya dinonaktifkan/pensiun.

---

### Fase B8: Server Actions — Budget Categories Management
- [ ] Buat `src/actions/categories.ts`.
- [ ] Implementasikan `getCategoriesByMonth(monthId)` beserta agregasi nominal terpakai (`spentAmount`) dan sisa anggaran.
- [ ] Implementasikan `updateCategoryTarget(categoryId, newTarget)`.
- [ ] Implementasikan `addCustomCategory(monthId, data)`.
- [ ] Implementasikan `reorderCategories(categoryIds)`.

---

### Fase B9: Server Actions — Sub-Second Transactions & Soft-Delete (Undo 5s)
- [ ] Buat `src/actions/transactions.ts`.
- [ ] Implementasikan `createTransaction(data)`:
  - Validasi *Strict Month-Date Boundary* (tanggal transaksi wajib berada di rentang bulan dari `categoryId` terkait).
  - Validasi integer nominal > 0.
- [ ] Implementasikan `softDeleteTransaction(transactionId)` (ubah flag `is_deleted = true`).
- [ ] Implementasikan `restoreTransaction(transactionId)` (fitur Undo: kembalikan `is_deleted = false`).
- [ ] Implementasikan `hardDeleteExpiredTransactions()` (pembersihan transaksi yang dihapus setelah melewati window undo).
- [ ] Implementasikan `getTransactionsByMonth(monthId)` dan `getTransactionsByCategory(categoryId)`.

---

### Fase B10: Server Actions — Gamified Wishlists & Sinking Fund Ledger
- [ ] Buat `src/actions/wishlists.ts`.
- [ ] Implementasikan `getWishlists(userId)` dengan milestone status (50%, 75%, 90%, 95%, 100%).
- [ ] Implementasikan `createWishlist(data)`.
- [ ] Implementasikan `allocateSavings(wishlistId, amount, notes)`:
  - Transaksi atomik database: kurangi saldo tabungan bebas di `savings_account`, tambah `saved_amount` di `wishlists`, dan catat riwayat di `wishlist_allocations`.
- [ ] Implementasikan `withdrawFromWishlist(wishlistId, amount)` (tarik kembali dana ke tabungan bebas).
- [ ] Implementasikan `markWishlistAsPurchased(wishlistId)`.

---

### Fase B11: Server Actions — Brankas Dana Darurat (Emergency Fund Vault)
- [ ] Buat `src/actions/savings.ts`.
- [ ] Implementasikan `getSavingsAccount(userId)` (saldo tabungan bebas, saldo dana darurat, target dana darurat, dan safety months).
- [ ] Implementasikan `transferToEmergencyFund(userId, amount)`.
- [ ] Implementasikan `withdrawFromEmergencyFund(userId, amount)`.
- [ ] Implementasikan `updateEmergencyFundTarget(userId, newTarget)`.

---

### Fase B12: Server Actions — Analytics & Financial Aggregation Engine
- [ ] Buat `src/actions/analytics.ts`.
- [ ] Implementasikan query tren tabungan bulanan `getSavingsGrowthTrend(userId, year)`.
- [ ] Implementasikan query cashflow bulanan `getMonthlyCashflowSummary(userId, year)` (Pemasukan, Pengeluaran, Tabungan Bersih).
- [ ] Implementasikan query perbandingan tahunan `getYearlyComparison(userId)`.
- [ ] Implementasikan agregasi pengeluaran per kategori pos untuk pie/bar distribution.

---

### Fase B13: AI Review Engine (Google Gemini 1.5 Flash) & Data Export
- [ ] Setup `@google/genai` client di `src/lib/ai/gemini.ts`.
- [ ] Buat Server Action `generateMonthlyReview(monthId)`:
  - Siapkan prompt terstruktur dengan data cashflow bulan berjalan.
  - Hasilkan analisis pos hemat vs boros, skor disiplin anggaran, dan rekomendasi alokasi bulan depan.
- [ ] Buat Server Action `exportFinancialData(userId, format)` di `src/actions/export.ts`:
  - Format CSV transaksi bulanan.
  - Format Full JSON backup untuk kedaulatan data.
