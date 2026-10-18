# Struktur Proyek — Kenzo Treasury

> **Status: blueprint, bukan inventaris repository.** Disusun dari peta `AGENTS.md` lama, `PRD.md`, `PLANBACKEND.md`, `PLANFRONTEND.md`, dan `laporan.md`. Belum diverifikasi terhadap folder source code aktual. **Jangan membuat semua file di bawah ini sekaligus.** Buat hanya ketika fitur/fase yang sesuai dikerjakan.

## 1. Prinsip organisasi

- **Route-first, feature-oriented:** Next.js App Router menentukan route, sedangkan komponen dan proses bisnis dikelompokkan berdasarkan domain.
- **Batas lapisan yang jelas:** UI tidak mengakses database secara langsung; mutasi server memvalidasi input dan otorisasi; aturan finansial tidak diduplikasi di komponen.
- **Prinsip DRY (Don't Repeat Yourself) & Reusability:** Komponen antarmuka yang memiliki kerangka visual atau pola styling serupa (seperti kartu ringkasan atau kartu hub) wajib diabstraksi menjadi *reusable primitive* dengan memanfaatkan props konfigurasi dan slot `children`, bukan diduplikasi menjadi beberapa file terpisah yang redundan.
- **Ikuti repository:** bila struktur aktual berbeda dari blueprint, periksa alasan dan jangan melakukan pemindahan massal tanpa kebutuhan.
- **Nama direktori adalah konvensi, bukan target jumlah file.** Jangan membuat folder kosong atau boilerplate untuk fitur yang belum dikerjakan.

## 2. Peta direktori yang direncanakan

```text
kenzo-treasure/
├── AGENTS.md                         # Instruksi agent khusus proyek (ringkas)
├── PRD.md                            # Spesifikasi produk
├── PLANBACKEND.md                    # Roadmap dan checklist backend
├── PLANFRONTEND.md                   # Roadmap dan checklist frontend
├── laporan.md                        # Ringkasan status dan checkpoint proyek
├── .changelog/                      # Satu catatan ringkas per tugas/perubahan bermakna
├── .agents/
│   ├── rules/
│   │   ├── financial-domain.md       # Invarian keuangan
│   │   ├── database-access.md        # Auth, akses DB, RLS
│   │   ├── frontend-design.md        # Konvensi implementasi UI
│   │   └── project-architecture.md   # Aturan penempatan file
│   └── skills/
│       ├── phase-delivery/SKILL.md
│       └── financial-integrity/SKILL.md
├── docs/
│   ├── PROJECT-STRUCTURE.md          # Blueprint ini
│   ├── DESIGN-SYSTEM.md              # Identitas visual yang disepakati
│   ├── REVIEW-AUDIT.md               # Audit bila tersedia
│   └── DECISIONS-NEEDED.md           # Keputusan terbuka bila tersedia
├── public/
│   ├── icons/                        # Ikon instalasi PWA jika diperlukan
│   └── manifest.json                 # Manifest jika dipakai konfigurasi PWA
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # Root URL '/' — Public Landing Page (Navbar publik, Hero, Fitur, CTA, Footer)
│   │   ├── (auth)/                   # Zona Autentikasi Publik
│   │   │   ├── login/page.tsx        # Halaman Masuk Akun
│   │   │   └── register/page.tsx     # Halaman Registrasi Akun
│   │   ├── (dashboard)/              # Zona Workspace Privat Terproteksi
│   │   │   └── dashboard/
│   │   │       ├── page.tsx          # Panel Utama (Ikhtisar Finansial Bulanan)
│   │   │       ├── wishlists/page.tsx# Sinking Fund & Wishlist Barang Impian
│   │   │       ├── analytics/page.tsx# Grafik Tren Tabungan & Cashflow
│   │   │       ├── vault/page.tsx    # Brankas Dana Darurat (Safety Months)
│   │   │       └── settings/page.tsx # Pengaturan & Ekspor Data Backup
│   │   ├── api/                      # Route Handler bila diperlukan
│   │   ├── globals.css               # Tailwind/theme/global CSS
│   │   ├── layout.tsx                # Root layout
│   │   └── providers.tsx             # Komposisi provider
│   ├── actions/                      # Mutasi dan operasi server terotorisasi
│   │   ├── auth.ts
│   │   ├── months.ts
│   │   ├── incomes.ts
│   │   ├── liabilities.ts
│   │   ├── categories.ts
│   │   ├── transactions.ts
│   │   ├── wishlists.ts
│   │   ├── savings.ts
│   │   ├── analytics.ts               # Hanya bila antarmuka server memang perlu
│   │   ├── ai-review.ts
│   │   └── export.ts
│   ├── components/
│   │   ├── ui/                        # Primitif/reusable Shadcn UI
│   │   ├── layout/                    # Header, navigasi, shell aplikasi
│   │   ├── features/
│   │   │   ├── landing/               # Komponen Halaman Depan (Navbar, Hero, Fitur, CTA, Footer)
│   │   │   ├── months/                # MonthSelector, CreateMonthDialog
│   │   │   ├── dashboard/             # CashflowSummaryCard, DashboardHubCard
│   │   │   ├── categories/            # BudgetCategoryCard, BudgetCategoryList
│   │   │   ├── transactions/
│   │   │   ├── incomes/
│   │   │   ├── liabilities/
│   │   │   ├── wishlists/
│   │   │   ├── savings/
│   │   │   ├── analytics/
│   │   │   ├── ai/
│   │   │   └── settings/
│   │   └── common/                   # Hanya untuk komponen lintas fitur
│   ├── db/
│   │   ├── index.ts                  # Koneksi/klien DB
│   │   ├── schema.ts                 # Skema Drizzle
│   │   └── migrations/               # Contoh; cek `drizzle.config.ts` aktual
│   ├── hooks/                        # Hook React, bukan business logic server
│   │   ├── use-mobile.ts
│   │   ├── use-offline-sync.ts
│   │   └── use-countdown.ts
│   ├── lib/
│   │   ├── queries/                  # Modul query pembacaan data (read access layer untuk Server Components)
│   │   │   └── months.ts             # getActiveMonth, getAllMonths, getMonthDetailById
│   │   ├── month-generator.ts        # Generator pos anggaran bulanan dinamis (inherit dari DB & relokasi cicilan)
│   │   ├── query-client.ts
│   │   ├── financial-calculations.ts  # Fungsi domain murni; Single Source of Truth rumus finansial
│   │   ├── image-compressor.ts
│   │   ├── utils.ts
│   │   ├── formatters.ts
│   │   ├── supabase/                 # Helper SSR/browser bila diperlukan
│   │   └── ai/                       # Adaptor provider AI bila fitur dibuat
│   ├── schemas/                     # Kontrak validasi Zod
│   │   ├── auth.schema.ts
│   │   ├── month.schema.ts
│   │   ├── income.schema.ts
│   │   ├── liability.schema.ts
│   │   ├── category.schema.ts
│   │   ├── transaction.schema.ts
│   │   └── wishlist.schema.ts
│   ├── types/                       # Tipe bersama yang benar-benar diperlukan
│   │   ├── index.ts                  # ActionResponse dsb
│   │   └── month.ts                  # MonthlyCycleDetail, MonthSummary, CategoryDetailItem
│   └── proxy.ts                     # Next.js 16 Edge Proxy (Session Refresh & Route Protection)
├── drizzle.config.ts
├── next.config.ts
├── package.json
├── bun.lock                          # Contoh; ikuti lockfile yang benar-benar ada
├── postcss.config.mjs
├── tsconfig.json
└── .gitignore
```

**Penjelasan status:** daftar nama pada pohon di atas terutama berasal dari blueprint `AGENTS.md` lama, **bukan bukti** semuanya telah dibuat. `bun.lock` hanyalah contoh lockfile yang mungkin digunakan; periksa file aktual. Route group `(auth)` dan `(dashboard)` tidak otomatis membuat segmen URL. Posisi dan nama migrasi mengikuti `drizzle.config.ts` aktual.

## 3. Tanggung jawab setiap lapisan

| Lokasi | Isi yang tepat | Hindari |
|---|---|---|
| `src/app/` | Halaman, layout, route handler, boundary loading/error | Query DB atau rumus finansial yang disalin berulang dalam JSX |
| `src/actions/` | Mutasi server yang terotentikasi/terotorisasi dan penghubung ke domain/data | Menjadi gudang seluruh query atau logika presentasi |
| `src/components/ui/` | Komponen UI umum dan adaptasi Shadcn | Aturan khusus cicilan, tabungan, atau ownership |
| `src/components/features/<domain>/` | Komponen dan presentasi khusus satu fitur | Duplikasi komponen generik lintas fitur |
| `src/components/layout/` | Shell, header, navigasi, layout | Perhitungan atau mutasi data |
| `src/db/` | Skema, koneksi, migrasi dan helper persistensi | UI, secret client, atau asumsi hak akses user |
| `src/schemas/` | Validasi input dan kontrak yang dibagi | Mendefinisikan ulang tipe yang dapat diinferensikan |
| `src/hooks/` | State UI, event handling, komposisi React | Proses keuangan otoritatif yang seharusnya di server |
| `src/lib/` | Formatters, utilitas murni, adaptor integrasi | File serbaguna tanpa domain yang jelas |
| `src/types/` | Tipe lintas modul bila diperlukan | Tipe duplikat dari Drizzle/Zod |
| `public/` | Aset publik, ikon/manifest PWA | Kredensial, data privat pengguna |
| `docs/` | Dokumentasi arsitektur, desain dan keputusan | Menyalin seluruh kode sumber sebagai spesifikasi kedua |

## 4. Konvensi domain fitur

Gunakan domain `months`, `incomes`, `categories`, `transactions`, `liabilities`, `wishlists`, `savings`, `analytics`, `ai`, dan `settings` **bila fiturnya ada**. Nama yang sama dapat muncul di `actions/` dan `components/features/` karena perannya berbeda. Buat modul bersama hanya untuk kebutuhan lintas domain yang jelas.

### Contoh alur transaksi

1. `src/components/features/transactions/` menangani form, status loading dan umpan balik pengguna.
2. `src/schemas/transaction.schema.ts` memvalidasi bentuk input.
3. `src/actions/transactions.ts` memastikan sesi dan kepemilikan kategori/bulan, lalu memanggil lapisan data/domain yang sesuai.
4. `src/db/` menyimpan data dan menjamin constraint/transaksi atomik bila diperlukan.
5. `src/lib/financial-calculations.ts` atau modul domain murni lain menghitung nilai turunan tanpa mengakses React.

Ini contoh pembagian tanggung jawab, **bukan klaim implementasi saat ini**. Operasi baca dapat dilakukan lewat Server Components atau modul server lain yang sesuai; tidak semua data harus diakses menggunakan Server Actions.

## 5. Dokumentasi dan keputusan desain

- `docs/DESIGN-SYSTEM.md` menjelaskan identitas visual; `src/app/globals.css` menyimpan token dan global style yang benar-benar diterapkan.
- `docs/PROJECT-STRUCTURE.md` berisi **rancangan struktur**; implementasi aktual dan konfigurasi proyek menentukan fakta saat ini.
- `.changelog/` mencatat tugas yang mengubah repository; `laporan.md` merangkum status proyek. Ikuti aturan dokumentasi Global Cecillia tanpa membuat satu changelog untuk setiap file.
- Perubahan struktur yang disepakati diperbarui di dokumen ini secara terarah. Jangan mengubah checklist di plan tanpa approval yang diminta.

## 6. Catatan untuk fase implementasi berikutnya

Berdasarkan plan dan laporan yang diberikan, **F1 dan B1 sudah ditandai selesai/approved**. B2/F2 dan fase berikutnya masih dijadwalkan; jangan mengasumsikan semua folder pada blueprint telah dibuat.

- Sebelum B2, tinjau konflik **Supabase Auth** dengan kolom password aplikasi dan instruksi hashing tersendiri. Perubahan schema/database memerlukan migrasi yang aman.
- Sesi autentikasi dan proteksi rute telah dimigrasikan ke konvensi resmi Next.js 16 menggunakan `src/proxy.ts` (menggantikan konvensi `middleware.ts` lama).
- Jangan mengunci nomor versi dependency, port pooler, atau nama model AI berdasarkan diagram lama. Periksa manifest, lockfile, konfigurasi, dan dokumentasi versi terkait.

## 7. Checklist saat menambah/memindahkan file

1. Apakah file serupa sudah ada? Apakah perubahan ini masih dalam fase yang diminta?
2. Apa tanggung jawabnya dan lapisan/domain yang paling dekat?
3. Apakah perubahan memengaruhi import, route, validasi, otorisasi atau migrasi?
4. Apakah diperlukan pembaruan dokumentasi arsitektur karena keputusan yang benar-benar baru?
5. Sudahkah perubahan diuji sesuai scope dan dilaporkan tanpa mengklaim hasil yang belum diverifikasi?


## 8. Komposisi Providers

- Gunakan `src/app/providers.tsx` sebagai tempat komposisi React Context Providers.
- Pisahkan konfigurasi dan inisialisasi SDK atau client yang kompleks ke modul khusus jika membantu pengujian dan pemeliharaan.
- Jangan menempatkan business logic, query database, atau kalkulasi finansial di dalam provider wrapper.
- Pertahankan lifecycle dan scope instance yang benar, khususnya untuk TanStack Query agar cache tidak terbagi secara tidak sengaja antar-request pengguna.
- Jangan memecah provider sederhana menjadi banyak file tanpa manfaat nyata.