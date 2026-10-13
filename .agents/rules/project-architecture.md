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
  Jangan tempatkan logika finansial atau query DB langsung di halaman.
- `src/components/ui/`: primitive atau komponen Shadcn yang dapat dipakai ulang; `src/components/layout/`: kerangka navigasi/layout aplikasi & dashboard; `src/components/features/<domain>/`: komponen fitur (termask `landing/` untuk seksi halaman depan).
- `src/actions/`: batas mutasi server dan koordinasi kebutuhan request; validasi input, autentikasi, dan otorisasi tetap wajib. Jangan menganggap semua pembacaan data harus berupa Server Action.
- `src/db/`: schema, koneksi, dan migrasi; ikuti lokasi migrasi yang **benar-benar dikonfigurasi** oleh Drizzle, bukan asumsi dari diagram.
- `src/schemas/`: validasi Zod yang layak digunakan lintas client/server; `src/hooks/`: hook React; `src/lib/`: utilitas murni, adaptor SDK, atau helper terfokus.
- `src/types/`: tipe bersama hanya jika tidak dapat lebih tepat diletakkan dekat pemakaiannya; utamakan inferensi tipe Drizzle/Zod untuk mencegah definisi ganda.
- `public/`: aset statis/PWA; `docs/`: dokumentasi desain dan keputusan teknis; `.changelog/` dan `laporan.md`: dokumentasi perubahan sesuai Global Cecillia.

## Keputusan perubahan struktur
- Ikuti penamaan, import alias, konfigurasi, dan idiom yang sudah ada. Hindari folder abstrak baru atau satu-file-per-function tanpa manfaat nyata.
- Buat reusable component atau modul bersama hanya jika tanggung jawab jelas dan memang dibutuhkan; jangan menggeneralisasi pola yang hanya digunakan satu fitur.
- Kelompokkan kode yang erat kaitannya; cegah circular imports serta ketergantungan dari domain/server ke komponen UI.
- Saat menambahkan modul, pilih lokasi paling dekat dengan domain pemakai. Sesuaikan dokumentasi **hanya jika struktur resmi memang berubah**, tanpa membuat changelog tambahan untuk setiap file satu per satu.
- Jangan memodifikasi file atau fase di luar instruksi, jangan menimpa perubahan pengguna, dan jangan mengubah schema produksi tanpa izin yang diperlukan.

## Integrasi aturan lain
- Tampilan: `.agents/rules/frontend-design.md` dan `docs/DESIGN-SYSTEM.md`.
- Mutasi keuangan: `.agents/rules/financial-domain.md` serta skill `financial-integrity`.
- Database dan autentikasi: `.agents/rules/database-access.md`.
- Fase pengerjaan: `AGENTS.md`, `PLANBACKEND.md`, dan `PLANFRONTEND.md`.
- Global Cecillia tetap mengatur verifikasi, pelaporan file, changelog, dan batas keselamatan; jangan duplikasi isi lengkapnya di sini.
