# Product Requirements Document (PRD)
## Project: Kenzo Treasury (Web App)
**Version:** 1.0.0  
**Owner:** Kenzo Sebastian  
**Tech Lead / Architect:** Cecillia  
**Status:** Approved / Ready for Implementation  
**Target Platform:** Mobile-First Web Application (PWA) & Responsive Desktop  

---

## 1. Executive Summary & Vision

### 1.1 Product Vision
**Kenzo Treasury** adalah aplikasi web manajemen anggaran dan keuangan pribadi mandiri yang dirancang khusus untuk menggantikan keterbatasan lembar kerja Notion. Aplikasi ini mengusung filosofi **Zero-Friction Logging**, **Siklus Anggaran Bulanan Terisolasi (Isolated Monthly Cycles)**, dan **Kalkulasi Reaktif Real-Time**.

### 1.2 Core Problem Statement (Notion Pain Points)
1. **Clutter & Performa:** Notion menggabungkan data transaksi dalam database besar atau memerlukan hierarki nested page yang lambat dibuka di perangkat mobile.
2. **Keterbatasan Otomasi Template:** Pembuatan lembar bulan baru di Notion memerlukan duplikasi manual karena keterbatasan trigger tombol terprogram via API.
3. **UX Input Lambat di Mobile:** Menambah pengeluaran harian (misal: bensin Rp 20.000) di Notion memerlukan banyak klik navigasi.
4. **Kalkulasi Formula Kaku:** Formula kalkulasi sisa anggaran dan status rollup di Notion lambat dan tidak instan merespons perubahan baris data.

### 1.3 Key Value Proposition
- **1-Click Month Generator:** Pembuatan siklus anggaran bulanan baru langsung dari template master 7 pos wajib.
- **Sub-Second Quick Add:** Drawer/modal input transaksi di ponsel dengan waktu pencatatan $< 5$ detik.
- **Reaktivitas Instan:** Penambahan transaksi harian langsung meng-update kolom `Terpakai`, `Sisa`, dan `Status` pos anggaran secara otomatis.
- **PWA Ready:** Dapat dipasang di layar utama iOS / Android seperti aplikasi native.

---

## 2. Tech Stack Architecture

| Layer | Teknologi | Justifikasi |
|---|---|---|
| **Framework** | Next.js 16 (App Router) + React 19 | Server Components untuk kecepatan load, Server Actions untuk mutasi data, dan SSR auth session. |
| **Runtime & Package Manager** | Bun (v1.4+) | JavaScript runtime super cepat, instalasi dependensi instan, dan eksekusi skrip tanpa overhead npm/Node. |
| **UI Components & Styling** | Shadcn UI (New York style) + Tailwind CSS v4 + Lucide React | Komponen atomik modern, aksesibel (Radix Primitives), type-safe, dan full customizable tanpa dependency bloat. |
| **Database** | Supabase (PostgreSQL) | Managed Postgres relasional dengan skalabilitas tinggi, Row Level Security (RLS), dan backup otomatis. |
| **ORM & Migrations** | Drizzle ORM + Drizzle Kit | Full TypeScript-safe schema, zero-overhead runtime, dan query builder yang bersih dan terprediksi. |
| **Authentication** | Supabase Auth | Autentikasi aman berbasis cookie-session (`@supabase/ssr`), mendukung Email/Password dan Google OAuth. |
| **PWA Engine** | Serwist / `@ducanh2912/next-pwa` | Web App Manifest dan Service Worker untuk caching aset dan instalasi di Home Screen ponsel. |
| **Object Storage** | Supabase Storage (`wishlist-images`) | Penyimpanan foto barang impian bawaan Supabase (100% gratis 1GB, terintegrasi penuh, RLS terproteksi). |
| **Data Visualization** | Recharts | Visualisasi grafik batang (Bar Chart) & grafik garis (Line Chart) yang interaktif, responsif, dan ringan. |
| **Client Cache & State** | TanStack Query v5 (React Query) | Instant caching, optimistic UI, dan background sync untuk revalidasi mutasi data super mulus. |
| **Form & Validation** | React Hook Form + Zod (`@hookform/resolvers/zod`) | Validasi form type-safe, performa tinggi (uncontrolled components tanpa re-render berlebih), integrasi native komponen Form Shadcn UI. |
| **Theme System** | next-themes | Mendukung Dark Mode & Light Mode adaptif otomatis sesuai preferensi sistem HP/OS. |
| **AI Intelligence** | Google Gemini 1.5 Flash (`@google/genai`) | Analisis review bulanan instan, hemat biaya, dan memberikan rekomendasi evaluasi tutup buku cerdas. |
| **Push Notification** | Web Push API + Service Worker | Notifikasi pengingat malam catat transaksi dan peringatan pos mendekati overbudget (80%). |
| **Hosting & CI/CD** | Vercel | Integrasi otomatis dengan GitHub, edge caching, dan deployment zero-configuration. |

---

## 3. Data Architecture & Database Schema

Sistem menggunakan database relasional dengan isolasi per user dan per siklus bulan. Setiap transaksi terikat pada pos anggaran tertentu dalam suatu bulan.

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    users     │───1:N─│    months    │───1:N─│   incomes    │
└──────────────┘       └──────────────┘       └──────────────┘
       │                      │
       │                      │ 1:N
       │               ┌──────────────────────┐
       │               │  budget_categories   │────────N:1──┐
       │               └──────────────────────┘             │
       │                      │                             │
       │                      │ 1:N                         ▼
       │               ┌──────────────────────┐    ┌─────────────────┐
       ├───────────1:N─│     transactions     │    │   liabilities   │
       │               └──────────────────────┘    │ (Cicilan iPhone,│
       │                                           │  Talangan Mama) │
       │ 1:1                                       └─────────────────┘
┌──────────────────────┐                                    ▲
│   savings_account    │────────────────────────────────────┘
└──────────────────────┘
       │
       │ 1:N
┌──────────────────────┐       ┌───────────────────────┐
│      wishlists       │───1:N─│ wishlist_allocations  │
│ (Mobil, Kamera, dll) │       │ (Riwayat Alokasi Dana)│
└──────────────────────┘       └───────────────────────┘
```

### 3.1 Drizzle Schema Definition

```typescript
// src/db/schema.ts
import { pgTable, uuid, text, timestamp, integer, pgEnum, boolean, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const categoryGroupEnum = pgEnum('category_group', [
  'pos_wajib',
  'kebutuhan',
  'uang_bebas_tabungan'
]);

export const transactionMethodEnum = pgEnum('transaction_method', [
  'cash',
  'debit',
  'qris',
  'transfer'
]);

// 1. Users Profile (Terikat 1:1 ke auth.users.id Supabase Auth)
export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // ID UUID yang sama persis dengan auth.users.id
  email: text('email').notNull().unique(),
  fullName: text('full_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 2. Savings Account (Akumulasi Saldo Tabungan & Dana Darurat)
export const savingsAccount = pgTable('savings_account', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  balance: integer('balance').default(0).notNull(), // dalam satuan Rupiah (Tabungan Bebas)
  emergencyFundTarget: integer('emergency_fund_target').default(18000000).notNull(), // Target Dana Darurat (e.g. 6x pengeluaran = Rp 18jt)
  emergencyFundBalance: integer('emergency_fund_balance').default(0).notNull(), // Saldo Dana Darurat terkumpul
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 3. Liabilities (Cicilan & Utang Bertarget Lunas / Finite Lifetime)
export const liabilities = pgTable('liabilities', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(), // Contoh: "📱 Cicilan Pokok iPhone", "👩‍👦 Talangan Mama"
  totalAmount: integer('total_amount').notNull(), // e.g. 17640000 (iPhone 735k x 24bln), 2500000 (Mama)
  paidAmount: integer('paid_amount').default(0).notNull(), // Akumulasi terbayar (e.g. 5000000)
  monthlyPayment: integer('monthly_payment').notNull(), // Target cicilan per bulan (e.g. 735000 / 500000)
  totalMonths: integer('total_months'), // 24 bulan (optional info)
  isSettled: boolean('is_settled').default(false).notNull(), // true jika paidAmount >= totalAmount
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 4. Months (Lembar Kerja Bulanan Terisolasi)
export const months = pgTable('months', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(), // Contoh: "Oktober 2026"
  year: integer('year').notNull(), // 2026
  monthIndex: integer('month_index').notNull(), // 1 - 12
  isClosed: boolean('is_closed').default(false).notNull(), // Penanda bulan aktif vs diarsipkan
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 5. Incomes (Daftar Pemasukan: Gaji Pokok, Freelance, Edit Video, dll.)
export const incomes = pgTable('incomes', {
  id: uuid('id').defaultRandom().primaryKey(),
  monthId: uuid('month_id').references(() => months.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  source: text('source').notNull(), // Contoh: "Gaji Pokok", "Freelance Edit Video"
  amount: integer('amount').notNull(), // Nominal pemasukan (Rp)
  date: date('date').notNull(),
  isBaseSalary: boolean('is_base_salary').default(false).notNull(), // true untuk gaji rutin Rp 4jt
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 6. Budget Categories (Pos-pos Anggaran dalam 1 Bulan)
export const budgetCategories = pgTable('budget_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  monthId: uuid('month_id').references(() => months.id, { onDelete: 'cascade' }).notNull(),
  liabilityId: uuid('liability_id').references(() => liabilities.id, { onDelete: 'set null' }), // Link ke cicilan jika pos ini adalah cicilan
  name: text('name').notNull(), // Contoh: "⚡ Listrik Rumah", "📱 Cicilan Pokok iPhone"
  icon: text('icon').default('💰'),
  group: categoryGroupEnum('group').notNull(),
  targetBudget: integer('target_budget').notNull(), // Nominal alokasi (Rp)
  isTemporary: boolean('is_temporary').default(false).notNull(), // true jika pos memiliki masa lunas
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 7. Transactions (Log Pengeluaran Harian)
export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  categoryId: uuid('category_id').references(() => budgetCategories.id, { onDelete: 'cascade' }).notNull(),
  amount: integer('amount').notNull(), // Nominal pengeluaran (Rp)
  date: date('date').notNull(), // Tanggal transaksi
  description: text('description').notNull(), // Keterangan (e.g. "Bayar Cicilan iPhone Bulan ke-7")
  method: transactionMethodEnum('method').default('qris').notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(), // Soft delete untuk fitur Undo (5s toast)
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 8. Wishlists (Barang Impian: Mobil, Kamera, Gadget, dll.)
export const wishlists = pgTable('wishlists', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(), // Contoh: "🚗 Honda Civic / Mobil Impian"
  targetAmount: integer('target_amount').notNull(), // Nominal harga target (Rp)
  savedAmount: integer('saved_amount').default(0).notNull(), // Akumulasi alokasi tabungan terkumpul
  icon: text('icon').default('🎯'),
  imageUrl: text('image_url'), // URL gambar dari Supabase Storage bucket 'wishlist-images'
  isPurchased: boolean('is_purchased').default(false).notNull(), // true jika sudah kebeli (100%)
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 9. Wishlist Allocations (Log Riwayat Alokasi Dana dari Tabungan)
export const wishlistAllocations = pgTable('wishlist_allocations', {
  id: uuid('id').defaultRandom().primaryKey(),
  wishlistId: uuid('wishlist_id').references(() => wishlists.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  amount: integer('amount').notNull(), // Nominal alokasi (+ setor atau - tarik balik ke tabungan)
  notes: text('notes'), // Catatan (e.g. "Alokasi dari sisa gaji Oktober")
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relasi ORM
export const monthsRelations = relations(months, ({ many }) => ({
  incomes: many(incomes),
  categories: many(budgetCategories),
}));

export const incomesRelations = relations(incomes, ({ one }) => ({
  month: one(months, { fields: [incomes.monthId], references: [months.id] }),
}));

export const liabilitiesRelations = relations(liabilities, ({ many }) => ({
  categories: many(budgetCategories),
}));

export const budgetCategoriesRelations = relations(budgetCategories, ({ one, many }) => ({
  month: one(months, { fields: [budgetCategories.monthId], references: [months.id] }),
  liability: one(liabilities, { fields: [budgetCategories.liabilityId], references: [liabilities.id] }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  category: one(budgetCategories, { fields: [transactions.categoryId], references: [budgetCategories.id] }),
}));

export const wishlistsRelations = relations(wishlists, ({ many }) => ({
  allocations: many(wishlistAllocations),
}));

export const wishlistAllocationsRelations = relations(wishlistAllocations, ({ one }) => ({
  wishlist: one(wishlists, { fields: [wishlistAllocations.wishlistId], references: [wishlists.id] }),
}));
```

---

## 4. Master Template 7 Pos Anggaran & Multi-Source Income Logic

### 4.1 Master Template 7 Pos Anggaran (Baseline Default)
Saat user menekan **"➕ Buat Bulan Baru"**, sistem secara otomatis meng-generate pemasukan awal `💵 Gaji Pokok: Rp 4.000.000` dan 7 baris pos anggaran default:

| Urutan | Pos Pengeluaran | Icon | Kategori Group | Target Budget (Rp) | Tipe Pos | Catatan & Target Pelunasan |
|---|---|---|---|---|---|---|
| 1 | Perpuluhan | ✝️ | Pos Wajib | Rp 400.000 | Rutin | 10% dari gaji pokok Rp 4.000.000 |
| 2 | Cicilan Pokok iPhone | 📱 | Pos Wajib | Rp 735.000 | Cicilan (Sementara) | Total Rp 17.640.000 (24 bln), Terbayar Rp 5.000.000 |
| 3 | Talangan Mama | 👩‍👦 | Pos Wajib | Rp 500.000 | Cicilan (Sementara) | Total Utang Rp 2.500.000 (5 bulan pelunasan) |
| 4 | Listrik Rumah | ⚡ | Pos Wajib | Rp 1.000.000 | Rutin | Tagihan operasional bulanan |
| 5 | Bensin | ⛽ | Kebutuhan | Rp 250.000 | Rutin | Transportasi harian |
| 6 | Jajan Popo | 👵 | Kebutuhan | Rp 200.000 | Rutin | Alokasi keluarga |
| 7 | Uang Bebas / Tabungan | 🍿 | Uang Bebas / Tabungan | Rp 915.000* | Rutin + Dynamic | Baseline Rp 915k + auto-add freelance |
| **Total** | | | | **Rp 4.000.000** | | **Balanced Zero-Based Budget** |

### 4.2 Multi-Source Income Mechanics (Opsi A — Dynamic Freedom Buffer)
Pengguna tidak hanya bergantung pada gaji Rp 4.000.000, melainkan dapat menerima cuan tambahan kapan saja (freelance, edit video, bonus, side project).

- **Aturan Alokasi (Opsi A):**
  1. **Pos Wajib & Kebutuhan Tetap Terkunci:** Pos 1 s/d 6 (Total: Rp 3.085.000) tidak berubah agar disiplin finansial tetap terjaga.
  2. **Pemasukan Tambahan Otomatis Memperbesar "🍿 Uang Bebas / Tabungan":**
     $$\text{Target Uang Bebas} = \text{Rp 915.000 (Base)} + \sum(\text{Pemasukan Tambahan Non-Gaji})$$
     *Contoh:* Jika di pertengahan bulan Kenzo menginput pemasukan *"Freelance Edit Video: Rp 1.500.000"*, maka:
     - Total Pemasukan Bulan: $\text{Rp 4.000.000} + \text{Rp 1.500.000} = \text{Rp 5.500.000}$.
     - Target Pos Uang Bebas/Tabungan otomatis naik dari Rp 915.000 menjadi **Rp 2.415.000**.
  3. **End-of-Month Sweep:** Sisa anggaran dari pos Uang Bebas ini di akhir bulan otomatis disapu ke **Total Saldo Tabungan**.

### 4.3 Pos Cicilan & Finite Lifetime Mechanics (Progress Tracker Pelunasan)
Pos anggaran cicilan memiliki batas akhir pelunasan (*finite lifecycle*):
1. **Initial Baseline Tracking:**
   - **📱 Cicilan Pokok iPhone:** Target Total $\text{Rp 735.000} \times 24 = \text{Rp 17.640.000}$. Nilai awal yang sudah dibayar: **Rp 5.000.000** (Progress awal: $28.3\%$, Sisa: Rp 12.640.000).
   - **👩‍👦 Talangan Mama:** Target Total **Rp 2.500.000**. Cicilan per bulan: Rp 500.000.
2. **Sinkronisasi Otomatis:** Setiap kali transaksi pembayaran dicatat di pos cicilan pada bulan berjalan, nilai `paid_amount` pada tabel `liabilities` otomatis terakumulasi bertambah.
3. **Otomasi Begitu Lunas (`is_settled = true`):**
   - Mendapat badge visual **🏆 LUNAS**.
   - Saat klik **➕ Buat Bulan Baru** di bulan berikutnya: Pos yang berstatus lunas **otomatis TIDAK DIMUNCULKAN LAGI** dalam daftar pos anggaran baru.
   - **Cashflow Reallocation:** Nominal cicilan yang sudah lunas (misal: Rp 735.000 atau Rp 500.000) otomatis membebaskan kapasitas finansial dan langsung dialihkan menambah target baseline **🍿 Uang Bebas / Tabungan**, sehingga kapasitas tabungan/belanja Kenzo bertambah seiring berkurangnya utang.

---

## 5. Functional Requirements (FR)

### Modul 1: Autentikasi & Proteksi Akses
- **FR-1.1:** Pengguna wajib login menggunakan Supabase Auth (Email/Password atau Google OAuth).
- **FR-1.2:** Sesi autentikasi ditangani secara SSR via `@supabase/ssr` middleware untuk mencegah flashing konten.
- **FR-1.3:** Row Level Security (RLS) di Postgres menjamin pengguna hanya bisa membaca dan mengubah data miliknya (`auth.uid() = user_id`).

### Modul 2: Header Dashboard & Hero Financial Overview
- **FR-2.1 Hero Card Tabungan:** Menampilkan akumulasi `Total Saldo Tabungan` secara prominent dengan tombol pintas untuk setor/tarik manual jika ada mutasi di luar sistem.
- **FR-2.2 Cashflow Metric:** Menampilkan ringkasan dinamis bulan aktif:
  - Total Pemasukan Bulan Berjalan: $\sum \text{incomes}$ (Gaji Pokok + Freelance).
  - Pos Wajib (Locked): `Rp 3.085.000`.
  - Total Terpakai Saat Ini: Sum seluruh transaksi bulan berjalan.
  - Sisa Anggaran Bebas / Tabungan: Sisa kuota kas yang bisa dibelanjakan atau ditabung.
- **FR-2.3 Progress Bar Keseluruhan:** Bar status visual persentase pengeluaran terhadap total pemasukan bulan berjalan.

### Modul 3: Manajemen Siklus Bulan & "➕ Buat Bulan Baru"
- **FR-3.1 1-Click Generator:** Tombol `➕ Buat Bulan Baru` berada di posisi atas dashboard.
- **FR-3.2 Modal Konfirmasi Bulan Baru:**
  - Pilihan Nama Bulan & Tahun (otomatis terisi bulan berjalan berikutnya).
  - Pilihan Gaji Pokok Awal (default: Rp 4.000.000 dimasukkan ke tabel `incomes` dengan `is_base_salary = true`).
  - Opsi: *"Pindahkan sisa uang bebas bulan sebelumnya ke saldo tabungan"* (Checklist: default checked).
  - **Filter Otomatis Pos Lunas:** Sistem memfilter dan hanya meng-generate pos-pos aktif; pos cicilan yang sudah berstatus `is_settled = true` otomatis dilewati.
- **FR-3.3 Isolasi Data:** Bulan yang baru otomatis menjadi bulan aktif utama. Bulan-bulan lama otomatis diarsipkan ke bagian riwayat di bawahnya tanpa menghilangkan data detailnya.

### Modul 4: Manajemen Multi-Source Pemasukan (`incomes`)
- **FR-4.1 Tombol `[➕ Catat Pemasukan]`:** Tombol cepat di samping ringkasan arus kas atau via Quick Add.
- **FR-4.2 Form Pemasukan:**
  - Sumber / Keterangan (e.g., "Freelance Edit Video YouTube", "Project Web", "Bonus").
  - Nominal (Rp) dengan inputMode numeric.
  - Tanggal penerimaan uang.
- **FR-4.3 Reaktivitas Alokasi (Opsi A):** Submit pemasukan langsung mengeksekusi penambahan target budget pada pos `🍿 Uang Bebas / Tabungan` secara real-time.

### Modul 5: Tabel Anggaran & Kalkulasi Reaktif Real-Time
- **FR-5.1 Kolom Data Pos Anggaran:**
  1. `Pos Pengeluaran`: Nama pos + Icon.
  2. `Target Budget`: Nominal batas anggaran dalam Rupiah (Pos Uang Bebas otomatis bertambah jika ada freelance).
  3. `Terpakai`: Jumlah seluruh transaksi harian yang masuk ke pos ini (otomatis terhitung).
  4. `Sisa`: Hasil pengurangan otomatis:
     $$\text{Sisa} = \text{Target Budget} - \text{Terpakai}$$
  5. `Status Badge`:
     - 🟢 **Aman**: $\text{Terpakai} < 80\% \times \text{Target}$
     - 🟡 **Waspada**: $80\% \times \text{Target} \le \text{Terpakai} \le 100\% \times \text{Target}$
     - 🔴 **Overbudget**: $\text{Terpakai} > \text{Target}$
  6. `Visual Progress Bar`: Bar progres mini di bawah nama pos dengan warna adaptif (Hijau $\rightarrow$ Kuning $\rightarrow$ Merah).
- **FR-5.2 Custom Pos:** User dapat menambah, mengedit nominal target, atau menghapus pos anggaran di bulan berjalan.

### Modul 6: Drill-Down Transaksi Harian & Quick Add Modal
- **FR-6.1 Quick Add Drawer (Mobile-First):** Tombol aksi cepat floating `(+) Catat Transaksi` di pojok kanan bawah tampilan mobile (bisa pilih tab: Pengeluaran atau Pemasukan).
- **FR-6.2 Detail Pos Modal:** Mengklik baris pos anggaran (misal: "⛽ Bensin") akan membuka drawer/dialog yang menampilkan:
  - Riwayat seluruh transaksi di pos tersebut pada bulan berjalan.
  - Form input cepat: Nominal (Rp), Tanggal, Keterangan, Metode Pembayaran (QRIS, Tunai, Transfer, Debit).
  - Aksi edit dan hapus baris transaksi.
- **FR-6.3 Rollup Real-Time:** Penambahan/penghapusan transaksi langsung memperbarui nilai `Terpakai`, `Sisa`, dan `Status` di tabel induk secara instan via Optimistic UI.
- **FR-6.4 Strict Month-Date Boundary (Anti-Ambiguitas Tanggal):**
  - **Client-Side:** Input tanggal (`<input type="date">` / DatePicker) dikunci secara ketat dengan atribut `min="YYYY-MM-01"` dan `max="YYYY-MM-[lastDayOfMonth]"`. Pengguna tidak bisa memilih tanggal di luar bulan yang bersangkutan (tanggal bulan lalu atau bulan depan otomatis disabled / abu-abu).
  - **Server-Side Validation:** Server Actions & Zod schema memvalidasi bahwa `date` mutlak berada di antara awal dan akhir bulan yang terikat pada `month_id`. Request dengan tanggal di luar periode bulan tersebut akan ditolak otomatis.

### Modul 7: Tracking Cicilan & Liabilities Hub (`liabilities`)
- **FR-7.1 Progress Bar & Metric Cicilan:** Pos anggaran yang berelasi dengan `liabilityId` menampilkan progres akumulatif pelunasan:
  - Persentase lunas: $\frac{\text{paidAmount}}{\text{totalAmount}} \times 100\%$
  - Sisa utang: $\text{totalAmount} - \text{paidAmount}$
  - Estimasi sisa bulan: $\lceil \frac{\text{Sisa Utang}}{\text{monthlyPayment}} \rceil$
- **FR-7.2 Auto-Increment dari Transaksi:** Saat transaksi dicatat pada pos cicilan tersebut, `paidAmount` di tabel `liabilities` otomatis bertambah secara atomik.
- **FR-7.3 Deteksi Lunas & Settlement Badge:** Jika `paidAmount >= totalAmount`, status berubah menjadi `is_settled = true` dan menampilkan badge 🏆 LUNAS.
- **FR-7.4 Auto-Exclusion di Bulan Baru:** Ketika siklus bulan baru dibuat, pos yang sudah lunas tidak disertakan, dan dana cicilan tersebut dialihkan ke pos Uang Bebas.

### Modul 8: Tutup Buku Akhir Bulan & Sweep Tabungan
- **FR-8.1 Selesai Bulan / Tutup Buku:** Tombol di bagian footer tabel bulan aktif.
- **FR-8.2 Automatic Savings Sweep:** Jika terdapat sisa pada pos `Uang Bebas / Tabungan`, sistem mengeksekusi penambahan saldo ke tabel `savings_account` dan menandai bulan sebagai `isClosed = true`.

### Modul 9: Tampilan Riwayat Arsip (Anti-Clutter)
- **FR-9.1 Collapsible Accordion / Month Selector:** Bulan-bulan sebelumnya tersimpan dalam daftar tertutup (collapsed) atau dropdown selector tahun/bulan.
- **FR-9.2 Read-Only Mode:** Bulan yang sudah ditutup berstatus read-only secara default, dengan opsi "Buka Kunci" jika ada revisi catatan di masa lalu.

### Modul 10: Gamified Dream Wishlist & Supabase Storage (`wishlists`)
- **FR-10.1 Manajemen Barang Impian:**
  - Pengguna dapat membuat target barang impian (contoh: *"🚗 Mobil Impian"*, *"📷 Kamera Sony"*, *"💻 MacBook Pro"*).
  - Field: Nama Barang, Target Nominal (Rp), Icon, Catatan/Deskripsi, dan Foto Barang Impian.
- **FR-10.2 Supabase Storage Bucket (`wishlist-images`) & Auto-WebP Optimization:**
  - **Auto-WebP Compression:** File foto barang impian otomatis dikompresi dan dikonversi ke format `.webp` berkualitas tinggi sebelum di-upload (menggunakan client-side compression canvas / `browser-image-compression`).
  - **Target Ukuran & Performa:** Ukuran file ditekan hingga $< 200\text{ KB}$ dengan batas dimensi maksimal $1200\text{px}$ agar loading di smartphone secepat kilat dan kuota 1GB Supabase sangat awet.
  - File `.webp` di-upload langsung ke bucket Supabase Storage (`wishlist-images`) via SDK `@supabase/supabase-js`.
  - Menggunakan kuota Free Tier Supabase (1GB gratis, zero biaya tambahan).
  - URL publik gambar disimpan di kolom `image_url` pada database.
- **FR-10.3 Alokasi Dana Tabungan (Sinking Funds):**
  - Tombol `[➕ Alokasikan dari Tabungan]`: Memindahkan saldo dari `savings_account` ke wishlist terkait.
  - Akumulasi `saved_amount` pada wishlist bertambah, sementara saldo tabungan bebas berkurang secara sinkron dalam satu transaksi database.
  - Tombol darurat `[↩️ Tarik Balik ke Tabungan]`: Mengembalikan dana alokasi ke saldo tabungan bebas jika diperlukan.
  - Setiap mutasi alokasi tercatat rapi pada tabel `wishlist_allocations`.
- **FR-10.4 Gamification Milestone Badges:**
  - Menghitung persentase progres terkumpul: $P = \frac{\text{saved\_amount}}{\text{target\_amount}} \times 100\%$.
  - Sistem otomatis menampilkan badge visual adaptif sesuai batas capaian:
    - $\ge 50\%$: 🥈 **Halfway Hero (50%)** — *"Setengah jalan Ken! Momentumnya dapet banget!"*
    - $\ge 75\%$: 🥇 **Major Milestone (75%)** — *"Tinggal 25% lagi, garis finish makin deket!"*
    - $\ge 90\%$: 🔥 **Final Stretch (90%)** — *"90%! Bau-bau barang impian udah kecium!"*
    - $\ge 95\%$: ⚡ **One Step Away (95%)** — *"95%! Dikit lagi kebeli, jangan kendor!"*
    - $100\%$: 🏆🎉 **DREAM UNLOCKED! (100%)** — Menampilkan animasi konfeti (*canvas-confetti*) layar penuh dan tombol aksi *"Tandai Sudah Dibeli"* (`is_purchased = true`).

### Modul 11: Analitik Finansial, Grafik Tabungan & Rekap Multi-Tahun
- **FR-11.1 Grafik Pertumbuhan Tabungan Interaktif (Recharts):**
  - Menampilkan tren akumulasi `Total Saldo Tabungan` dari bulan ke bulan.
  - **Toggle View:** Pengguna dapat berpindah mode tampilan grafik dengan satu klik:
    - 📊 **Chart Batang (Bar Chart):** Untuk melihat volume lompatan tabungan per bulan.
    - 📈 **Chart Garis / Area (Line / Area Chart):** Untuk melihat kurva akselerasi pertumbuhan kekayaan bersih (*net worth trajectory*).
- **FR-11.2 Rekap Arus Kas Bulan ke Bulan (Monthly Cashflow Summary):**
  - Tabel ringkasan komparasi performa finansial:
    - Total Pemasukan ($\sum \text{incomes}$)
    - Total Pengeluaran ($\sum \text{transactions}$)
    - Net Tabungan Masuk ($\text{Pemasukan} - \text{Pengeluaran}$)
    - Rasio Tabungan bulanan (*Savings Rate %*).
- **FR-11.3 Rekap Multi-Tahun (Yearly Aggregate View):**
  - Dropdown selector tahun (misal: `2026`, `2027`).
  - Card ringkasan performa tahunan:
    - Total Cuan Setahun (Gaji + Freelance).
    - Total Pengeluaran Setahun.
    - Total Tabungan yang Berhasil Disimpan Setahun.
- **FR-11.4 Mobile Responsiveness & Tooltip:**
  - Desain responsive (`ResponsiveContainer`) yang menyesuaikan lebar layar ponsel tanpa horizontal scroll.
  - Tooltip interaktif memformat angka dalam Rupiah rapi (`Rp X.XXX.XXX`).

### Modul 12: Brankas Khusus Dana Darurat (Emergency Fund Vault)
- **FR-12.1 Target Keamanan Finansial:** Target dana darurat mandiri (default: Rp 18.000.000 / ~6x biaya hidup wajib bulanan) dengan indikator ketahanan (*Safety Months Meter*).
- **FR-12.2 Alokasi Terproteksi:** Saldo dana darurat dipisahkan dari alokasi wishlist barang konsumtif agar tidak terpakai secara tidak sengaja.
- **FR-12.3 Setor & Tarik Cepat:** Form mutasi khusus brankas darurat dengan pencatatan alasan penarikan/penyetoran.

### Modul 13: Export Data & Portabilitas Mandiri (Data Sovereignty)
- **FR-13.1 Export ke CSV & Excel:** Sekali klik untuk mengunduh rekapitulasi data transaksi per bulan atau per tahun dalam format spreadsheet standar.
- **FR-13.2 Full JSON Backup:** Tombol backup mandiri untuk mengekspor seluruh basis data akun (bulan, pos anggaran, transaksi, tabungan) ke dalam satu file `.json`.

### Modul 14: AI Monthly Review & Smart Closing Advisor (Google Gemini 1.5 Flash)
- **FR-14.1 Evaluasi Tutup Buku Cerdas:** Tombol `[✨ Analisis Bulan Ini dengan AI]` saat proses tutup buku akhir bulan.
- **FR-14.2 Insight Finansial Otomatis:** Menggunakan model Google Gemini 1.5 Flash (`@google/genai`) untuk menghasilkan:
  1. Analisis pos pengeluaran yang paling hemat vs pos yang hampir bocor/overbudget.
  2. Rekomendasi nominal alokasi yang realistis untuk bulan berikutnya.
  3. Skor kesehatan finansial bulanan (*Health Score*).

### Modul 15: Notifikasi & Offline-First Resilience
- **FR-15.1 Web Push Notifications:**
  - Pengingat harian malam hari (jam 21:00) untuk mencatat pengeluaran hari ini.
  - Peringatan instan saat suatu pos anggaran menyentuh ambang batas $\ge 80\%$ (Waspada).
- **FR-15.2 Offline-First Queue (TanStack Query + IndexedDB):** Pengguna tetap bisa mencatat transaksi di basement parkir atau area tanpa sinyal. Transaksi masuk ke antrean lokal dan otomatis tersinkronisasi ke cloud Supabase begitu koneksi internet pulih.
- **FR-15.3 Soft Delete & 5-Second Undo Toast:** Penghapusan transaksi memunculkan toast banner dengan tombol `[↩️ Urungkan / Undo]` selama 5 detik sebelum perubahan dikomit ke database.


---

## 6. Non-Functional Requirements (NFR)

1. **Kecepatan & Latensi:**
   - First Contentful Paint (FCP) $< 1.0$ detik di koneksi 4G.
   - Mutasi data mutlak menggunakan React Optimistic UI sehingga perubahan angka di layar terjadi dalam $< 50$ ms sebelum request backend selesai.
2. **PWA & Offline Capability:**
   - Memiliki `manifest.json` yang valid dengan maskable icon.
   - Dapat diinstal di iPhone (Add to Home Screen) dan Android (Install App) tanpa URL bar browser.
3. **Data Security & Privacy:**
   - Tidak ada kebocoran data finansial lintas user dengan validasi ketat RLS di PostgreSQL.
   - Input nominal divalidasi di sisi server (mencegah nilai negatif ilegal atau format corrupted).
4. **Ergonomi Layar Sentuh (Mobile UX):**
   - Area klik (touch targets) minimal $48 \times 48\text{ px}$.
   - Number pad numerik otomatis muncul pada input nominal (`inputMode="numeric"`).
5. **Theme System (next-themes):**
   - Mendukung Dark Mode (OLED-friendly dark) dan Light Mode dengan transisi halus tanpa flicker (flash of unstyled content) mengikuti tema sistem OS/HP.

---

## 7. UI/UX Wireframe Structure

### 7.1 Desktop Layout View
```
┌────────────────────────────────────────────────────────────────────────┐
│  🏛️ KENZO TREASURY          [Oktober 2026 ▼]       [User Profile / Out]│
├────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────┐  ┌────────────────────────────────────┐ │
│  │ 💰 TOTAL SALDO TABUNGAN   │  │ 📊 CASHFLOW OKTOBER 2026           │ │
│  │ Rp 3.500.000              │  │ Masuk: Rp 5.500.000 (Gaji + Freelance)│
│  │ [+ Setor / Tarik Tabungan]│  │ Wajib: Rp 3.100.000 │ Bebas: Rp 2.4m│ │
│  └───────────────────────────┘  └────────────────────────────────────┘ │
│                                                                        │
│  [➕ Buat Bulan Baru]   [➕ Catat Pemasukan]   [⚡ Catat Pengeluaran]    │
│                                                                        │
│  ▼ 📅 OKTOBER 2026 (Bulan Aktif)                                       │
│  ┌───────────────────────┬────────────┬──────────┬──────────┬────────┐ │
│  │ Pos Pengeluaran       │ Target     │ Terpakai │ Sisa     │ Status │ │
│  ├───────────────────────┼────────────┼──────────┼──────────┼────────┤ │
│  │ ✝️ Perpuluhan          │ Rp 400.000 │ Rp 0     │ Rp 400k  │ 🟢 Aman│ │
│  │ 📱 Cicilan iPhone     │ Rp 735.000 │ Rp 0     │ Rp 735k  │ 🟢 Aman│ │
│  │    └ Pelunasan: [████░░░░░░░░] 28.3% (Terbayar Rp 5jt / 17.6jt)   │ │
│  │ 👩‍👦 Talangan Mama      │ Rp 500.000 │ Rp 0     │ Rp 500k  │ 🟢 Aman│ │
│  │    └ Pelunasan: [██░░░░░░░░░░] 20.0% (Terbayar Rp 500k / 2.5jt)   │ │
│  │ ⚡ Listrik Rumah      │ Rp 1.000k  │ Rp 500k  │ Rp 500k  │ 🟢 Aman│ │
│  │ ⛽ Bensin             │ Rp 250.000 │ Rp 70k   │ Rp 180k  │ 🟢 Aman│ │
│  │ 👵 Jajan Popo         │ Rp 200.000 │ Rp 0     │ Rp 200k  │ 🟢 Aman│ │
│  │ 🍿 Uang Bebas / Tab.  │ Rp 2.415k* │ Rp 104k  │ Rp 2.311k│ 🟢 Aman│ │
│  └───────────────────────┴────────────┴──────────┴──────────┴────────┘ │
│  *Target Uang Bebas otomatis = Base Rp 915k + Freelance Rp 1.5jt       │
│                                                                        │
│  ▶ 📁 RIWAYAT BULAN LALU (Arsip Collapsed)                             │
│    ▶ September 2026 (Arsip)                                            │
│    ▶ Agustus 2026 (Arsip)                                              │
│                                                                        │
│  ▼ 🎯 DREAM WISHLIST & MILESTONES HUB (Supabase Storage Pictures)     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 🚗 Honda Civic / Mobil Impian                                     │  │
│  │ Target: Rp 250.000.000 │ Terkumpul: Rp 125.000.000 (50.0%)       │  │
│  │ Badge: 🥈 [Halfway Hero - Setengah Jalan!]                       │  │
│  │ Progress: [██████████████░░░░░░░░░░░░░░] 50%                     │  │
│  │ [➕ Alokasikan dari Tabungan]   [↩️ Tarik Balik]                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  [➕ Tambah Barang Impian Baru]                                        │
│                                                                        │
│  ▼ 📊 TREN PERTUMBUHAN TABUNGAN & REKAP ARUS KAS (Tahun 2026 ▼)       │
│  Mode: [🔘 Chart Batang | ⚪ Chart Garis]                              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 📈 Pertumbuhan Akumulasi Tabungan:                               │  │
│  │ Rp 4jt ┤                 ╭──● (Okt: Rp 3.5jt)                    │  │
│  │ Rp 2jt ┤           ╭─────╯                                       │  │
│  │ Rp 0jt ┴─────┴─────┴─────┴─────┴─────                            │  │
│  │             Jun   Jul   Agu   Sep   Okt                          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────┬──────────────┬──────────────┬───────────────────┐  │
│  │ Periode      │ Pemasukan    │ Pengeluaran  │ Tabungan Masuk    │  │
│  ├──────────────┼──────────────┼──────────────┼───────────────────┤  │
│  │ Oktober 2026 │ Rp 5.500.000 │ Rp 674.000   │ +Rp 4.826.000     │  │
│  │ Sept 2026    │ Rp 4.000.000 │ Rp 3.100.000 │ +Rp 900.000       │  │
│  ├──────────────┼──────────────┼──────────────┼───────────────────┤  │
│  │ TOTAL 2026   │ Rp 21.500.00 │ Rp 18.000.00 │ +Rp 3.500.000     │  │
│  └──────────────┴──────────────┴──────────────┴───────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Mobile PWA Layout View
```
┌──────────────────────────────┐
│ 🏛️ Kenzo Treasury       👤 │
├──────────────────────────────┤
│ 💰 Total Tabungan            │
│ Rp 3.500.000                 │
│ (Bebas: Rp 2.5jt | Wishlist: 1jt)│
├──────────────────────────────┤
│ 📅 Oktober 2026 (Aktif)      │
│ Terpakai: Rp 674.000 / 5.5jt │
│ [████░░░░░░░░░░░░░░] 12.2%   │
├──────────────────────────────┤
│ ✝️ Perpuluhan         🟢 Rp 400k
│ 📱 Cicilan iPhone    🟢 Rp 735k
│    └ Progres: 28.3% (Sisa 17.1jt)
│ 👩‍👦 Talangan Mama     🟢 Rp 500k
│    └ Progres: 20.0% (Sisa 2jt)
│ ⚡ Listrik           🟢 Rp 500k
│ ⛽ Bensin            🟢 Rp 180k
│    └ Sisa Rp 180k (Terpakai Rp 70k)
│ 👵 Jajan Popo        🟢 Rp 200k
│ 🍿 Uang Bebas        🟢 Rp 2.31m
├──────────────────────────────┤
│ 🎯 Wishlist: 🚗 Mobil        │
│ Rp 125jt / 250jt (50%) 🥈    │
│ [████████░░░░░░░░]           │
├──────────────────────────────┤
│ 📊 Grafik Tabungan 2026      │
│ [Bar / Line Toggle]          │
│ 📈 [  ╭──● Rp 3.5jt ]        │
│ Total 2026: +Rp 3.5jt Simpan │
├──────────────────────────────┤
│      [➕ Bulan Baru]          │
│                              │
│       ┌───────────────┐      │
│       │ ➕ Quick Add  │  <── Floating Button
│       └───────────────┘      │
└──────────────────────────────┘
```

---

## 8. Implementation Milestones

### Fase 1: Project Setup & Database Foundations
- Inisialisasi Next.js 15 App Router + TypeScript + Tailwind CSS v4.
- Inisialisasi **Shadcn UI** (`npx shadcn@latest init`) dengan instalasi komponen dasar (`button`, `card`, `dialog`, `drawer`, `progress`, `badge`, `input`, `tabs`, `table`, `popover`, `calendar`).
- Setup Supabase project & konfigurasi koneksi PostgreSQL.
- Setup Drizzle ORM schema, relasi, dan generate migrasi SQL pertama.
- Konfigurasi Supabase Auth SSR middleware & protected route.

### Fase 2: Core Budgeting & Calculation Engine
- Implementasi Server Actions untuk CRUD Bulan (`months`) dan Pos Anggaran (`budget_categories`).
- Implementasi generator default 7 pos anggaran untuk fitur "Buat Bulan Baru".
- Kalkulasi otomatis `Terpakai`, `Sisa`, dan `Status` di server & client state.

### Fase 3: Transaction Logging & Mobile Drawer
- Komponen Drawer / Modal riwayat transaksi per pos anggaran.
- Form Quick Add transaksi dengan optimasi keyboard mobile numerik.
- Optimistic update UI agar angka langsung berubah instan saat submit transaksi.

### Fase 4: Savings Engine, Liabilities & Gamified Wishlist (Supabase Storage)
- Logika tutup buku akhir bulan dan auto-sweep sisa uang bebas ke saldo tabungan.
- Tracking pelunasan cicilan (`liabilities`) dengan progress bar dan auto-exclusion saat lunas.
- Setup Supabase Storage bucket (`wishlist-images`) untuk upload gambar barang impian dengan kompresi WebP.
- Implementasi Hub Wishlist: alokasi/tarik saldo tabungan, milestone badges (50%, 75%, 90%, 95%), dan efek konfeti saat 100%.

### Fase 5: Financial Analytics & Historical Charts (Recharts)
- Implementasi grafik pertumbuhan tabungan interaktif (Toggle Bar Chart & Line Chart via Recharts).
- Tabel rekapitulasi cashflow komparasi bulan ke bulan (Pemasukan, Pengeluaran, Tabungan Bersih, Savings Rate).
- Filter dan rekap agregat multi-tahun (Summary Tahunan).

### Fase 6: PWA, Archive & Deployment Vercel
- Accordion riwayat bulan lampau (anti-clutter & read-only mode).
- Setup Serwist PWA manifest & icon agar bisa dipasang di Home Screen ponsel.
- Deployment ke Vercel dan end-to-end testing di perangkat mobile.

---

## 9. Future Roadmap & Backlog (Next Iteration)

### 9.1 AI Smart Receipt & QRIS Screenshot Scanner
- **Deskripsi:** Fitur upload foto struk belanja fisik atau tangkapan layar (screenshot) bukti transfer/QRIS bank.
- **Mekanisme AI:** Menggunakan Google Gemini 1.5 Flash Vision untuk mengekstraksi nominal, tanggal, dan nama merchant secara instan, lalu otomatis mengisi form pencatatan transaksi tanpa ketik manual.
- **Status:** *Backlog / Ditunda untuk iterasi berikutnya (setelah MVP stabil)*.
