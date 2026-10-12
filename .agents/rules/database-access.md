---
trigger: model_decision
description: "Standar autentikasi Supabase, koneksi PostgreSQL melalui Drizzle, otorisasi pengguna, Row Level Security, kontrak Server Actions, transaksi atomik, dan keamanan migrasi database Kenzo Treasury."
---

# Standar Database & Autentikasi — Kenzo Treasury

Aktif saat mengerjakan autentikasi, Server Actions, akses database, perubahan schema, migrasi, atau operasi yang melibatkan data pengguna.

## 1. Autentikasi & Otorisasi

- Gunakan **Supabase Auth** sebagai satu-satunya pengelola kredensial dan password pengguna (`auth.users`).
- Jangan membuat sistem hashing atau penyimpanan password aplikasi secara terpisah di tabel aplikasi.
- Kolom `password` di tabel `public.users` telah resmi dihapus melalui migrasi terverifikasi `0001_busy_hiroim.sql`. Tabel `public.users` kini murni berfungsi sebagai tabel profil pengguna (`id`, `email`, `full_name`).
- Pastikan ID profil pengguna (`public.users.id`) terhubung 1:1 dan bernilai sama persis dengan ID pengguna yang terautentikasi di Supabase Auth (`auth.users.id`).
- Setiap Server Action yang mengakses data terlindungi wajib memverifikasi autentikasi dan otorisasi pengguna melalui sesi resmi (`await supabase.auth.getUser()`).
- Identitas pengguna harus berasal dari sesi autentikasi yang diverifikasi di server, bukan langsung dipercaya dari parameter `userId` yang dikirim client.
- Validasi kepemilikan seluruh record terkait (`eq(table.userId, user.id)`), termasuk relasi turunan seperti bulan, kategori, transaksi, cicilan, tabungan, dan wishlist.
- Jangan pernah mengekspos service-role key, secret key, connection string, atau kredensial database ke browser.

## 2. Drizzle, PostgreSQL & Row Level Security

- Gunakan pola akses database yang sesuai dengan arsitektur Drizzle dan Supabase yang benar-benar diterapkan proyek.
- Koneksi langsung Drizzle/PostgreSQL dengan role berprivilege tinggi tidak otomatis membawa konteks RLS dari pengguna Supabase yang sedang login.
- Verifikasi role database yang digunakan dan tentukan strategi otorisasi yang eksplisit:
  - RLS dengan konteks pengguna yang diteruskan secara aman; atau
  - Pemeriksaan kepemilikan di server yang diaudit dengan prinsip **least privilege**.
- Jangan menganggap penggunaan RLS saja sudah cukup tanpa memastikan query benar-benar dijalankan dalam konteks otorisasi yang sesuai.
- Aktifkan RLS pada tabel yang diekspos melalui API sesuai kebutuhan keamanan.
- Pastikan kebijakan akses mencakup operasi `SELECT`, `INSERT`, `UPDATE`, dan `DELETE` yang diperlukan.
- Gunakan pemeriksaan `USING` dan `WITH CHECK` sesuai kebutuhan untuk mencegah pembacaan atau perubahan kepemilikan data secara tidak sah.
- Uji penolakan akses lintas pengguna, termasuk penggunaan ID record milik pengguna lain.
- Dokumentasikan strategi otorisasi yang dipilih sebelum mengaktifkan endpoint atau Server Actions yang menangani data sensitif.

## 3. Kontrak Respons Server Actions

- Gunakan kontrak respons yang konsisten untuk Server Actions yang dipanggil melalui interaksi aplikasi.
- Jika sesuai dengan konvensi repository, gunakan discriminated union `ActionResponse<T>`:

```typescript
type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

- Validasi input menggunakan schema yang sesuai, seperti Zod, sebelum melakukan mutasi.
- Verifikasi autentikasi, otorisasi, dan kepemilikan data sebelum menjalankan operasi.
- Jangan mengembalikan stack trace, kredensial, query sensitif, atau detail internal database kepada client.
- Gunakan pesan error yang aman dan dapat dipahami, serta pertahankan detail diagnostik yang relevan pada logging server yang aman.
- Jangan memaksakan `ActionResponse<T>` untuk seluruh fungsi internal. Bedakan Server Actions, query internal, dan Route Handlers berdasarkan tanggung jawabnya.
- Pertahankan kontrak respons repository yang sudah berjalan apabila kompatibel dan tidak menimbulkan masalah.

## 4. Integritas Data & Transaksi Atomik

- Gunakan database constraints untuk menjaga konsistensi data, termasuk foreign key, unique constraint, dan validasi nilai yang sesuai.
- Gunakan transaksi database atomik untuk operasi yang mengubah beberapa record yang saling bergantung.
- Cegah duplikasi akibat double submission, retry, concurrent requests, dan offline synchronization.
- Terapkan mekanisme idempotensi pada operasi yang berisiko dieksekusi berulang.
- Pastikan operasi pembatalan, edit, dan penghapusan transaksi menjaga konsistensi saldo serta data turunannya.
- Jangan menganggap operasi berhasil sebelum database mengonfirmasi hasilnya.
- Jika mutasi gagal, hindari partial updates yang meninggalkan data dalam kondisi tidak konsisten.
- Ikuti `.agents/rules/financial-domain.md` dan skill `financial-integrity` ketika perubahan melibatkan saldo, cicilan, pemasukan, pengeluaran, atau alokasi dana.

## 5. Koneksi Database & Pooling

- Gunakan konfigurasi dual-mode connection Supabase yang telah ditetapkan:
  - **Runtime App / Server Actions (`DATABASE_URL`):** Menggunakan port `6543` (Supavisor Transaction Pooler) dengan driver `postgres.js` dan konfigurasi `prepare: false` untuk mencegah bentrok prepared statement saat multiplexing transaksi.
  - **Migration CLI / Drizzle Kit (`DATABASE_URL_UNPOOLED`):** Menggunakan port `5432` (Direct Session Connection) yang diprioritaskan di `drizzle.config.ts` untuk eksekusi migrasi skema DDL yang membutuhkan session locking penuh.
  - **Keamanan Transport TLS:** Menggunakan `?sslmode=require` untuk koneksi terenkripsi penuh TLS v1.3. Jika di masa depan memerlukan `?sslmode=verify-full`, sediakan sertifikat privat root Supabase via environment variable `DATABASE_CA_CERT`.
- Pertahankan penggunaan driver modern `postgres` (Porsager) dan konfigurasi Drizzle singleton di `src/db/index.ts`. Dilarang beralih ke `pg` (`node-postgres`) untuk menghindari bug *ambient variable* (`PGHOST`) dan overhead runtime.
- Hindari membuat logika parsing string koneksi yang berlebihan atau menumpuk ratusan baris kode *workaround* di `src/db/index.ts`. Jaga berkas inisialisasi database tetap bersih, modular, dan terisolasi (~40 baris).

## 6. Migrasi & Keamanan Perubahan Schema

- Periksa schema aktual, file migrasi, dependensi, dan data terkait sebelum membuat perubahan database.
- Gunakan mekanisme migrasi yang sesuai dengan konfigurasi Drizzle Kit proyek.
- Tinjau SQL yang dihasilkan, dampak terhadap data, perubahan constraint, dan kompatibilitas dengan kode yang sudah berjalan.
- Jangan menjalankan migrasi destruktif, `db push --force`, atau perubahan data produksi tanpa persetujuan eksplisit.
- Untuk schema yang sudah memiliki data, utamakan migrasi bertahap yang mempertahankan data dan menyediakan strategi pemulihan.
- Jangan menghapus kolom, tabel, constraint, atau data hanya untuk menyelaraskan dokumentasi dengan implementasi baru.
- Verifikasi hasil migrasi menggunakan pemeriksaan yang relevan dan laporkan hasil aktualnya.

## 7. Dokumentasi & Verifikasi

- Periksa dokumentasi resmi dan versi dependency aktual sebelum menggunakan API Supabase, Drizzle, atau PostgreSQL yang belum terverifikasi.
- Jangan mengklaim konfigurasi keamanan, migrasi, atau query sudah benar jika belum diuji.
- Jalankan pemeriksaan yang relevan, seperti typecheck, pengujian otorisasi, pengujian transaksi, dan validasi database jika lingkungan memungkinkan.
- Untuk perubahan autentikasi dan database, prioritaskan pengujian akses lintas pengguna, input tidak valid, operasi berulang, dan concurrent mutations.
- Dokumentasikan alasan keputusan keamanan atau arsitektur yang kompleks tanpa mengulang informasi yang sudah jelas dari kode.
- Laporkan setiap perubahan file dan hasil verifikasi sesuai aturan Global Cecillia.

**Prinsip utama:** Setiap akses data harus terautentikasi dan terotorisasi secara benar. Setiap perubahan database harus aman, konsisten, dapat diverifikasi, dan tidak merusak data yang sudah ada.