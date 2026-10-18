---
trigger: model_decision
description: "Aturan arsitektur Kenzo Treasury untuk menentukan lokasi file, menambah atau memindahkan modul, menjaga batas tanggung jawab, dan mengikuti struktur repository yang sebenarnya."
---

# Arsitektur Proyek — Kenzo Treasury

## Sumber acuan
- Gunakan `docs/PROJECT-STRUCTURE.md` sebagai **peta arsitektur yang direncanakan**, bukan bukti bahwa semua file sudah ada.
- Sebelum membuat, memindahkan, mengganti nama, atau memecah file, periksa struktur **repository aktual** dan implementasi yang relevan. Jangan mengarang keberadaan file.
- Jika peta berbeda dari kode aktual, pertahankan kode yang bekerja, laporkan selisihnya, dan usulkan pembaruan dokumentasi jika memang diperlukan. Jangan merombak struktur hanya demi menyamakan diagram.
- Baca hanya bagian peta dan dokumen terkait tugas; jangan membuka seluruh PRD/roadmap tanpa kebutuhan.

## Penempatan dan pemisahan tanggung jawab
- `src/app/`: route, layout, loading/error UI, dan komposisi halaman Next.js App Router. Terbagi menjadi 3 zona akses:
  1. **Halaman Depan Publik (`/`):** Landing page langsung di root path (`src/app/page.tsx`) yang memuat Navbar publik, Hero Section, Value Proposition/Fitur, dan CTA konversi.
  2. **Autentikasi Publik (`/login`, `/register`):** Formulir masuk & daftar akun di `src/app/(auth)/`.
  3. **Workspace Terproteksi (`/dashboard/*`):** Panel dashboard finansial privat di `src/app/(dashboard)/dashboard/` (ikhtisar bulanan, pos anggaran, wishlist, analitik, vault, dan pengaturan).
  **Prinsip Clean Page:** Berkas `page.tsx` HANYA bertindak sebagai data fetcher/orchestrator. Dilarang keras menumpuk inline markup kartu berulang, visual card repetitif, atau rincian komponen UI panjang di dalam `page.tsx`.
- `src/components/ui/`: primitive atau komponen Shadcn yang dapat dipakai ulang; `src/components/layout/`: kerangka navigasi/layout aplikasi & dashboard; `src/components/features/<domain>/`: komponen fitur modular (termasuk `dashboard/` untuk metrik arus kas & preview hub, `categories/` untuk kartu & daftar pos anggaran, serta `landing/` untuk seksi halaman depan). Komponen dengan struktur visual berulang wajib diabstraksi menjadi layout card primitive yang reusable.
- `src/actions/`: HANYA untuk mutasi server (write operations: create, update, delete, action); validasi input Zod, autentikasi sesi, dan otorisasi tetap wajib. Dilarang menumpuk query data agregasi, fungsi pembacaan data panjang, atau konstanta template di sini.
- `src/lib/queries/`: modul query pembacaan data (read-only access layer) yang dapat dipanggil langsung oleh React Server Components tanpa overhead Server Action RPC.
- `src/db/`: schema, koneksi, dan migrasi; ikuti lokasi migrasi yang **benar-benar dikonfigurasi** oleh Drizzle, bukan asumsi dari diagram.
- `src/schemas/`: validasi Zod yang layak digunakan lintas client/server, di-re-export terpusat via `src/schemas/index.ts` (`@/schemas`); `src/hooks/`: hook React; `src/lib/`: utilitas murni, generator domain (`*-generator.ts`), adaptor SDK, atau helper terfokus.
- `src/types/`: tipe bersama domain terkait (`src/types/<domain>.ts`), di-re-export terpusat via `src/types/index.ts` (`@/types`) sebagai single entry point; utamakan inferensi tipe Drizzle/Zod untuk mencegah definisi ganda.
- **Prinsip Public Entry Point & Barrel Export:** Setiap direktori atau modul yang menampung banyak berkas sejenis (seperti kontrak tipe, skema validasi, fungsi utilitas, custom hooks, atau komponen fitur) wajib menyediakan berkas `index.ts` sebagai pintu masuk tunggal (*single entry point*). Berkas internal di-re-export melalui `index.ts`, sehingga pemanggil dari luar selalu mengimpor secara bersih langsung dari nama foldernya (misal: `@/types`, `@/schemas`, `@/hooks`) tanpa perlu bergantung pada struktur path berkas di dalamnya.
- `public/`: aset statis/PWA; `docs/`: dokumentasi desain dan keputusan teknis; `.changelog/` dan `laporan.md`: dokumentasi perubahan sesuai Global Cecillia.
- **Invarian Database-Driven:** Dilarang keras men-hardcode nominal finansial (seperti nominal cicilan) atau string keyword di dalam kode. Seluruh data utang, cicilan, dan kategori wajib dibaca secara dinamis langsung dari database, serta mewarisi (*inherit*) konfigurasi bulan sebelumnya.

## Keputusan perubahan struktur
- Ikuti penamaan, import alias, konfigurasi, dan idiom yang sudah ada. Hindari folder abstrak baru atau satu-file-per-function tanpa manfaat nyata.
- Buat reusable component atau modul bersama hanya jika tanggung jawab jelas dan memang dibutuhkan; jangan menggeneralisasi pola yang hanya digunakan satu fitur.
- **Prinsip DRY (Don't Repeat Yourself) pada Komponen & Logika:** Hindari duplikasi logika maupun struktur presentasi. Jika dua atau lebih komponen berbagi 80%+ kerangka layout (misal: kartu hub navigasi, kartu metrik), satukan menjadi satu komponen dasar yang menerima slot `children` atau props konfigurasi, alih-alih membuat file terpisah untuk setiap variasi sepele.
- Kelompokkan kode yang erat kaitannya; cegah circular imports serta ketergantungan dari domain/server ke komponen UI.
- Saat menambahkan modul, pilih lokasi paling dekat dengan domain pemakai. Sesuaikan dokumentasi **hanya jika struktur resmi memang berubah**, tanpa membuat changelog tambahan untuk setiap file satu per satu.
- Jangan memodifikasi file atau fase di luar instruksi, jangan menimpa perubahan pengguna, dan jangan mengubah schema produksi tanpa izin yang diperlukan.

## Integrasi aturan lain
- Tampilan: `.agents/rules/frontend-design.md` dan `docs/DESIGN-SYSTEM.md`.
- Mutasi keuangan: `.agents/rules/financial-domain.md` serta skill `financial-integrity`.
- Database dan autentikasi: `.agents/rules/database-access.md`.
- Fase pengerjaan: `AGENTS.md`, `PLANBACKEND.md`, dan `PLANFRONTEND.md`.
- Global Cecillia tetap mengatur verifikasi, pelaporan file, changelog, dan batas keselamatan; jangan duplikasi isi lengkapnya di sini.
