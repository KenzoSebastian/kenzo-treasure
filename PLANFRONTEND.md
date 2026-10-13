# PLANFRONTEND.md — Roadmap Pengembangan Frontend Kenzo Treasury

Dokumen ini adalah rencana kerja frontend bertahap (granular) untuk **Kenzo Treasury**. Setiap fase memiliki checklist mandiri dan **wajib mengikuti Protokol Eksekusi & Approval Gate** di [`AGENTS.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/AGENTS.md).

> [!IMPORTANT]
> **ATURAN KERJA AGENT:**
> 1. Kerjakan **hanya 1 fase per turn/sesi**. Dilarang melompat ke fase lain.
> 2. Sebelum mulai, baca [`PRD.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/PRD.md) dan [`AGENTS.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/AGENTS.md).
> 3. Setelah fase selesai, laporkan daftar file yang diubah/dibuat beserta fungsinya secara detail.
> 4. **DILARANG MENCENTANG (`- [x]`)** checklist sebelum Kenzo memberikan approval eksplisit.
> 5. **Testing UI:** Dilarang screenshot otomatis / browser automation; berikan checklist panduan testing manual agar Ken yang menguji di browser/ponsel.

---

## 🗂️ Daftar Fase Frontend

### Fase F1: Inisialisasi Next.js 16, Tailwind CSS v4 & Theme Provider
- [x] Inisialisasi proyek Next.js 16 (App Router, TypeScript, React 19).
- [x] Setup Tailwind CSS v4 dengan semantic color tokens.
- [x] Setup `next-themes` untuk Dark Mode & Light Mode adaptif tanpa flicker (FOUC).
- [x] Konfigurasi viewport mobile `min-h-[100dvh]` dan anti horizontal overflow (`overflow-x-hidden`) di `src/app/layout.tsx`.
- [x] Setup TanStack Query v5 provider untuk instant optimistic UI dan background cache.

---

### Fase F2: Setup Komponen Atomik Shadcn UI & Design Tokens
- [ ] Inisialisasi CLI Shadcn UI (`npx shadcn@latest init` gaya New York).
- [ ] Pasang komponen atomik dasar: `Button`, `Card`, `Dialog`, `AlertDialog`, `Drawer`, `Input`, `Label`.
- [ ] Pasang komponen data & navigasi: `Badge`, `Progress`, `Tabs`, `Table`, `Separator`, `Popover`, `Calendar`, `Select`.
- [ ] Pasang `sonner` untuk toaster notifikasi modern dan Undo banner.
- [ ] Konfigurasi Lucide React icons.

---

### Fase F3: Halaman Depan Publik (Public Landing Page 12 Sections)
- [ ] Buat Navbar presisi `src/components/features/landing/LandingNavbar.tsx` (Logo Kenzo Treasury, nav anchor links, theme toggle, tombol aksi Masuk `/login` & Mulai `/register`).
- [ ] Buat Hero section `src/components/features/landing/HeroSection.tsx` (Badge pill v1.0, headline presisi finansial, dual CTA buttons, preview mockup dashboard).
- [ ] Buat Problem vs Solution section `src/components/features/landing/ProblemSolutionSection.tsx` (Perbandingan Notion/Excel lama vs Kenzo Treasury PWA).
- [ ] Buat Metrics & KPI strip `src/components/features/landing/MetricsStrip.tsx` (Rp 4jt gaji pokok, 7 pos wajib, <5 detik quick add, 100% kedaulatan data).
- [ ] Buat Bento Grid 6 Pilar Finansial `src/components/features/landing/BentoFeatures.tsx` (Siklus Mandiri, Dynamic Buffer, Finite Debt, Safety Months Vault, Gamified Wishlist, AI Review).
- [ ] Buat Sub-Second Mobile Showcase `src/components/features/landing/MobileShowcase.tsx` (Visual Quick Add Drawer, input numpad ponsel, 5-second Undo toast).
- [ ] Buat Workflow 4 Langkah Siklus `src/components/features/landing/WorkflowSection.tsx` (Generate Bulan, Catat Harian, Alokasi Sinking Fund, Tutup Buku & Evaluasi AI).
- [ ] Buat Security & Sovereignty section `src/components/features/landing/SecuritySection.tsx` (RLS PostgreSQL, HTTP-only cookies, 1-Click Backup JSON/CSV, Offline mode).
- [ ] Buat Comparison Matrix table `src/components/features/landing/ComparisonTable.tsx` (Kenzo Treasury vs Apps Keuangan Biasa vs Notion/Spreadsheet).
- [ ] Buat Interactive FAQ Accordion `src/components/features/landing/FaqAccordion.tsx` (PWA install, keamanan data, freelance adjustment, undo kesalahan).
- [ ] Buat Final CTA Banner & Brand Footer `src/components/features/landing/LandingFooter.tsx` (Ajakan mulai, status kedaulatan data, status teknologi Next.js 16/Supabase, copyright).
- [ ] Susun komposisi 12 section secara terintegrasi langsung di `src/app/page.tsx` dengan desain Swiss Functional Minimalism dan dark/light mode adaptif.

---

### Fase F4: App Shell, Mobile Layout & Navigasi Utama Dashboard
- [ ] Buat komponen header aplikasi `src/components/layout/AppHeader.tsx` (Logo Kenzo Treasury, Theme Toggle, Profile/Logout).
- [ ] Buat navigasi bawah mobile `src/components/layout/MobileBottomNav.tsx` (Dashboard, Pos Anggaran, Wishlist, Analytics).
- [ ] Buat layout wrapper responsif `src/components/layout/DashboardLayout.tsx`.
- [ ] Buat komponen fail-closed: Skeleton loading cards dan Error boundary fallback dengan tombol retry.

---

### Fase F5: Dropdown Pemilih Bulan & Trigger 1-Click Generator
- [ ] Buat komponen `src/components/features/months/MonthSelector.tsx`:
  - Dropdown daftar bulan aktif & bulan riwayat lampau.
  - Indikator status bulan (`🟢 Berjalan` vs `🔒 Terkunci / Diarsipkan`).
- [ ] Buat tombol shortcut template `➕ Buat Bulan Baru`:
  - Trigger konfirmasi dialog `<AlertDialog />` sebelum generate.
  - Integrasi mutasi Server Action `createMonthlyCycle` dengan loading state dan feedback toast Sonner.

---

### Fase F6: Executive Summary Card & Cashflow KPI Bulanan
- [ ] Buat komponen kartu ringkasan eksekutif `src/components/features/dashboard/ExecutiveSummaryCard.tsx`:
  - Total Pemasukan Bulan Berjalan (Format Rupiah IDR).
  - Total Pengeluaran Terpakai.
  - Saldo Tabungan Bersih (*Net Savings*).
- [ ] Pasang visual bar progress kesehatan anggaran (`Healthy` warna hijau, `Warning` kuning, `Overbudget` merah).

---

### Fase F7: Presentasi 7 Pos Anggaran Wajib & Indikator Status
- [ ] Buat komponen grid pos pengeluaran `src/components/features/categories/BudgetCategoryList.tsx`.
- [ ] Buat kartu individu pos `src/components/features/categories/BudgetCategoryCard.tsx`:
  - Icon pos (`✝️`, `⚡`, `💰`, `⛽`, `🍿`, `📱`, `👩‍👦`).
  - Target Alokasi vs Realisasi Terpakai vs Sisa Budget.
  - Progress bar persentase penggunaan pos.
  - Badge penanda status pos (`Aman`, `Mendekati Limit >80%`, `Overbudget`).
  - Fitur collapsible / accordion untuk membuka rincian log transaksi harian di dalam pos tersebut.

---

### Fase F8: Mobile Sub-Second Quick Add Drawer (<5 Detik)
- [ ] Buat tombol floating action / sticky bottom `+ Catat Pengeluaran` di tampilan mobile.
- [ ] Buat Drawer modal kilat `src/components/features/transactions/QuickTransactionDrawer.tsx`:
  - Input nominal uang dengan format angka otomatis dan numberpad ponsel (`inputMode="numeric"`).
  - Selector cepat pos kategori anggaran (icon + nama pos).
  - Selector cepat metode bayar (QRIS, Tunai, Debit, Transfer).
  - Input keterangan singkat transaksi.
- [ ] Integrasikan React Hook Form + Zod resolver dengan optimistic response (tutup drawer $< 50$ ms).

---

### Fase F9: Sub-Log Riwayat Transaksi & 5-Second Undo Toast
- [ ] Buat daftar transaksi harian di dalam masing-masing pos `src/components/features/transactions/TransactionSubList.tsx`.
- [ ] Tampilkan baris transaksi: tanggal, nominal Rupiah, keterangan, dan badge metode bayar.
- [ ] Pasang tombol aksi hapus transaksi:
  - Memanggil `softDeleteTransaction` Server Action.
  - Memunculkan notifikasi Toast Sonner dengan countdown timer 5 detik dan tombol **"↩️ Batalkan (Undo)"**.
  - Jika tombol Undo ditekan dalam 5 detik, transaksi langsung pulih instan di layar.

---

### Fase F10: Komponen Pemasukan Gaji vs Freelance (Alokasi Dinamis)
- [ ] Buat seksi manajemen pemasukan bulanan `src/components/features/incomes/IncomeSection.tsx`.
- [ ] Tampilkan kartu `💵 Gaji Pokok: Rp 4.000.000` (terikat ke 7 pos wajib).
- [ ] Tampilkan kartu pemasukan tambahan (Freelance Edit Video, Project Luar, dll.).
- [ ] Buat formulir modal `Tambah Pemasukan Tambahan` dengan notifikasi alokasi dinamis otomatis ke pos *🍿 Uang Bebas / Tabungan*.

---

### Fase F11: Kartu Tracking Cicilan / Utang Bertarget Lunas
- [ ] Buat kartu khusus cicilan `src/components/features/liabilities/LiabilityTrackerCard.tsx`:
  - Tracking Cicilan iPhone: Target Rp 17.640.000 (Rp 735.000/bln x 24 bulan), akumulasi terbayar (Rp 5.000.000+).
  - Tracking Talangan Mama: Target Rp 2.500.000 (Rp 500.000/bln).
  - Baris progress pelunasan dengan meter persentase.
  - Sisa bulan berjalan menuju lunas.
- [ ] Tampilkan badge `🏆 100% LUNAS` dan status pensiun pos saat utang lunas.

---

### Fase F12: Gamified Dream Wishlists Grid & Kompresor Foto WebP
- [ ] Buat halaman / seksi impian `src/components/features/wishlists/WishlistGrid.tsx`.
- [ ] Buat kartu barang impian `src/components/features/wishlists/WishlistCard.tsx`:
  - Foto barang impian (Mobil, Kamera, Gadget) dengan loading skeleton.
  - Progress bar tabungan terkumpul vs target harga barang.
  - Milestone badges: `50%`, `75%`, `90%`, `95%`, dan `🎉 100% Tercapai!`.
- [ ] Buat utilitas kompresi gambar client-side `src/lib/image-compressor.ts`:
  - Otomatis mengubah gambar upload apa pun menjadi WebP (<200KB, max 1200px) sebelum dikirim ke Supabase Storage.
- [ ] Buat form modal `Tambah Barang Impian Baru` dengan drag-and-drop preview gambar.

---

### Fase F13: Modal Alokasi Sinking Fund & Milestone Confetti
- [ ] Buat Drawer/Modal alokasi dana `src/components/features/wishlists/AllocateWishlistDrawer.tsx`:
  - Menampilkan sisa Saldo Tabungan Bebas yang tersedia.
  - Input nominal alokasi dengan quick pill shortcut (`10%`, `25%`, `50%`, `Semua Saldo`).
  - Opsi tarik balik dana dari wishlist ke tabungan bebas.
- [ ] Pasang efek animasi selebrasi Confetti (`canvas-confetti`) saat alokasi mencapai milestone penting (terutama 100% Lunas).
- [ ] Tampilkan tabel log riwayat mutasi alokasi di dalam detail wishlist.

---

### Fase F14: Tampilan Brankas Dana Darurat & Safety Months Meter
- [ ] Buat kartu Brankas Dana Darurat `src/components/features/savings/EmergencyVaultCard.tsx`:
  - Tampilan visual brankas dengan indikator kunci keamanan.
  - Nominal Saldo Dana Darurat terkumpul vs Target Ideal (Rp 18.000.000).
  - Meter *Safety Months* (contoh: "🛡️ Bertahan Aman selama 4.2 Bulan Biaya Hidup").
- [ ] Buat modal `Setor / Tarik Dana Darurat` dengan proteksi konfirmasi ganda.

---

### Fase F15: Dashboard Grafik Analytics Recharts
- [ ] Pasang dependensi visualisasi `recharts`.
- [ ] Buat komponen analitik `src/components/features/analytics/AnalyticsDashboard.tsx`:
  - Toggle Switch antara **Grafik Batang (Bar Chart)** dan **Grafik Garis (Line Chart)**.
  - Grafik Pertumbuhan Saldo Tabungan dari bulan ke bulan.
  - Grafik Perbandingan Cashflow Bulanan (Pemasukan vs Pengeluaran).
  - Tab perbandingan tahunan (Tahun 2026 vs 2027).
- [ ] Pastikan chart responsif di layar HP tanpa lag dan mendukung dark mode styling.

---

### Fase F16: Modal Review Finansial Bulanan AI (Gemini 1.5 Flash)
- [ ] Buat tombol trigger `[✨ Evaluasi Bulan Ini dengan AI]` di panel penutupan buku bulanan.
- [ ] Buat modal dialog review cerdas `src/components/features/ai/AiMonthlyReviewModal.tsx`:
  - Animasi loading shimmering saat AI sedang menganalisis data.
  - Kartu evaluasi pos paling hemat vs pos overbudget.
  - Kartu skor disiplin finansial.
  - Rekomendasi taktis penyesuaian alokasi untuk bulan berikutnya.

---

### Fase F17: Antarmuka Export Data & Backup Mandiri
- [ ] Buat panel pengaturan data `src/components/features/settings/DataExportPanel.tsx`.
- [ ] Pasang tombol aksi:
  - `📥 Download CSV Transaksi Bulanan`.
  - `📊 Download Excel (.xlsx) Rekap Keuangan`.
  - `💾 Full JSON Backup (Kedaulatan Data)`.
- [ ] Berikan feedback status unduhan yang jelas kepada pengguna.

---

### Fase F18: PWA Setup, Status Sinkronisasi Offline & Ergonomi Mobile
- [ ] Setup Web App Manifest (`public/manifest.json`), icons, dan meta theme color.
- [ ] Buat indikator banner status konektivitas `src/components/common/NetworkStatusBanner.tsx`:
  - Menampilkan badge "🟡 Mode Offline — Disimpan di perangkat" saat koneksi terputus.
  - Otomatis trigger background sync TanStack Query saat kembali online.
- [ ] Audit touch targets seluruh tombol mobile (minimal $48 \times 48\text{ px}$).
- [ ] Verifikasi uji kontras Dark & Light Mode di seluruh layar.

