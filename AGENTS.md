# Kenzo Treasury — Aturan Proyek

Kenzo Treasury adalah aplikasi manajemen keuangan pribadi berbasis web progresif (PWA) dengan pendekatan mobile-first.

Aturan Global Cecillia sudah mencakup komunikasi, kualitas kode, verifikasi, penggunaan skills, pelaporan setiap perubahan file, serta dokumentasi changelog dan progres lintas proyek. Jangan menduplikasi aturan tersebut di sini.

## 1. Sumber Acuan

- **Kebutuhan dan perilaku produk:** `PRD.md`. Baca hanya bagian yang relevan dengan tugas.
- **Rencana dan status implementasi:** `PLANBACKEND.md`, `PLANFRONTEND.md`, dan `laporan.md`.
- **Implementasi aktual:** Source code, skema database, migrasi, `package.json`, dan lockfile. Dokumentasi tidak boleh dianggap sebagai bukti bahwa suatu fitur sudah berjalan.
- **Aturan teknis khusus proyek:** `.agents/rules/financial-domain.md`, `.agents/rules/database-access.md`, `.agents/rules/frontend-design.md`, dan `.agents/rules/project-architecture.md`. Gunakan sesuai relevansi tugas.
- **Riwayat persetujuan:** Fase B1 dan F1 sudah disetujui. Jangan menghapus, membatalkan centang, atau mengubah riwayatnya tanpa instruksi eksplisit.

## 2. Alur Pengerjaan Proyek

- Kerjakan **hanya satu fase yang diminta secara eksplisit** dalam setiap iterasi. Baca fase terkait, bagian PRD yang diperlukan, dan kode yang relevan.
- Setelah implementasi selesai tetapi belum disetujui, laporkan status `IMPLEMENTED — AWAITING APPROVAL`. Jangan mencentang checklist fase tersebut.
- Checklist hanya boleh dicentang setelah ada persetujuan eksplisit yang menyebutkan fase, misalnya `approve B2` atau `approve F2`. Respons umum seperti `oke` tidak otomatis dianggap sebagai persetujuan fase.
- Setelah fase disetujui:
  1. Centang hanya checklist yang sudah diverifikasi dan disetujui pada dokumen rencana terkait.
  2. Tambahkan informasi persetujuan pada catatan `.changelog/` yang sesuai.
  3. Perbarui status fase di `laporan.md`.
  4. Sarankan pesan Git commit menggunakan format Conventional Commits beserta perintah staging untuk file yang relevan.
  5. Jangan melakukan commit, push, atau memulai fase berikutnya tanpa instruksi baru.
- Gunakan skill `.agents/skills/phase-delivery/SKILL.md` untuk pengerjaan dan penyelesaian fase.
- Gunakan skill `.agents/skills/financial-integrity/SKILL.md` untuk perubahan yang berkaitan dengan transaksi, saldo, anggaran, cicilan, atau mutasi keuangan lainnya.
- Jangan menerapkan usulan audit yang belum disetujui atau menjalankan migrasi database destruktif secara sepihak. Periksa `docs/REVIEW-AUDIT.md` dan `docs/DECISIONS-NEEDED.md` jika relevan.

## 3. Struktur dan Arsitektur Proyek

- Ikuti konvensi arsitektur dalam `.agents/rules/project-architecture.md` serta struktur direktori yang didokumentasikan di `docs/PROJECT-STRUCTURE.md`.
- Sebelum membuat modul, memindahkan file, atau mengubah struktur proyek, baca hanya bagian dokumentasi yang relevan.
- Utamakan kondisi repository aktual apabila berbeda dari dokumentasi. Laporkan ketidaksesuaian tersebut tanpa langsung mengubah struktur di luar cakupan tugas.
- Pertahankan pemisahan tanggung jawab antarmodul dan ikuti konvensi penamaan yang sudah digunakan.
- Jangan membuat folder, file, dependency, atau abstraksi baru tanpa kebutuhan teknis yang jelas.
- Perlakukan peta struktur sebagai panduan arsitektur, bukan daftar file yang wajib dibuat seluruhnya.

**Prinsip utama:** Pahami kebutuhan, ikuti sumber acuan yang relevan, kerjakan perubahan secara terarah, verifikasi hasil aktual, dan patuhi persetujuan setiap fase.

## 4. Konvensi Runtime & Dependency

- Gunakan Bun sebagai runtime dan package manager utama sesuai konfigurasi proyek.
- Gunakan `bun install`, `bun add`, dan `bun run` untuk operasi dependency serta script proyek.
- Jangan menggunakan npm, Yarn, atau pnpm untuk memodifikasi dependency tanpa alasan kompatibilitas yang jelas.
- Pertahankan lockfile yang digunakan repository dan jangan membuat lockfile dari package manager lain.
- Verifikasi versi dependency melalui `package.json`, lockfile, dan dokumentasi resmi saat diperlukan.
- Jangan melakukan upgrade dependency tanpa kebutuhan teknis atau instruksi eksplisit.

## 5. Standar Tampilan & Tipografi

- Wajib mengikuti `.agents/rules/frontend-design.md` dan `docs/DESIGN-SYSTEM.md`.
- **Dilarang keras menggunakan font monospace (`font-mono`)** untuk angka, nominal uang/mata uang (Rupiah), saldo, persen, rasio, metrik, atau penomoran pada antarmuka (UI). Semua angka wajib menggunakan font sans-serif proporsional standar dengan `tabular-nums` jika membutuhkan perataan digit.

## 6. Pemisahan Tanggung Jawab Modul & Anti-Hardcode Finansial

- **Pemisahan Server Actions vs Queries vs Domain Services:**
  - `src/actions/`: HANYA untuk mutasi data server (write operations: create, update, delete, toggle). Dilarang menumpuk query data agregasi, fungsi pembacaan data panjang, atau konstanta template ke dalam file Server Action.
  - `src/lib/queries/`: Khusus fungsi pembacaan data (read/query) yang dapat dipanggil langsung oleh React Server Components tanpa overhead Server Action RPC.
  - `src/lib/`: Khusus fungsi kalkulasi domain murni, generator data (`*-generator.ts`), atau helper integrasi.
  - `src/types/`: Kontrak tipe bersama domain terkait (`src/types/<domain>.ts`).
- **Anti-Hardcode Finansial (Database-First Invariant):**
  - **Dilarang keras men-hardcode nominal finansial** (seperti nominal cicilan 735.000, 500.000, atau sisa saldo) dan pencocokan keyword string kaku di dalam kode logika.
  - Seluruh data utang, nominal cicilan (`monthlyPayment`), status pelunasan (`isSettled`), serta daftar pos kategori bulanan **wajib dibaca secara dinamis langsung dari tabel database** (`liabilities`, `budgetCategories`, `months`).
  - Pembuatan bulan baru wajib mewarisi (*inherit*) susunan pos anggaran dan target dari bulan sebelumnya yang ada di database jika riwayat tersedia, bukan selalu mereset ke template statis awal. Baseline template hanya digunakan sebagai *fallback* saat database benar-benar kosong (first-time user).

## 7. Arsitektur Halaman Bersih & Pemisahan Komponen Fitur (Clean Page Architecture)

- **Pemisahan Server Page vs Komponen Fitur:**
  - Berkas halaman `src/app/**/page.tsx` di Next.js App Router HANYA berfungsi sebagai **Server Component orchestrator** (mengambil data sesi/auth, membaca query database via `src/lib/queries/`, mengurai `searchParams`, lalu menyalurkan data ke komponen anak).
  - **Dilarang keras menumpuk inline markup kartu berulang, rincian komponen UI panjang, atau styling card repetitif di dalam `page.tsx`**.
  - Seluruh kartu metrik kas (`CashflowSummaryCard`), kartu item pos anggaran (`BudgetCategoryCard` & `BudgetCategoryList`), kartu preview hub (`DashboardHubCard`), dan widget interaktif **wajib dipisahkan ke dalam folder `src/components/features/<domain>/`**.
  - Setiap layout kartu yang memiliki struktur berulang (seperti metrik arus kas) wajib dibuat sebagai komponen *layout card primitive* yang reusable dan menerima konten/footer via props, bukan di-copy-paste berulang kali di halaman.
  - **Prinsip Mutlak DRY (Don't Repeat Yourself) & Generalisasi Shell Kartu:** Dilarang keras menduplikasi struktur kartu (*shell/layout/border/padding*) ke dalam banyak file terpisah jika perbedaannya hanya sebatas judul, ikon, teks, tautan, atau konten anak. Komponen antarmuka yang memiliki pola layout seragam wajib disatukan ke dalam satu *reusable primitive* (seperti `DashboardHubCard` untuk card hub preview dan `CashflowSummaryCard` untuk metrik kas) dengan memanfaatkan props konfigurasi dan slot `children`.