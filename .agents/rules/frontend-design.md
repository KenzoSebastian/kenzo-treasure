---
trigger: glob
description: "Standar pengembangan frontend Kenzo Treasury yang mencakup desain mobile-first, aksesibilitas, Shadcn UI, Tailwind CSS v4, konsistensi styling, dark mode, dan interaksi pengguna."
globs: "src/app/**/*.tsx, src/app/**/*.css, src/app/*.css, src/components/**/*.tsx, src/components/**/*.css, src/hooks/**/*.tsx"
---

# Standar Pengembangan Frontend — Kenzo Treasury

## 1. Desain, Responsivitas & Aksesibilitas

- Terapkan pendekatan **mobile-first** dengan layout responsif, aksesibel, dan tanpa horizontal overflow yang tidak disengaja.
- Gunakan touch target minimal `48 × 48px` untuk elemen interaktif jika memungkinkan.
- Pastikan input dan formulir nyaman digunakan melalui keyboard desktop maupun keyboard virtual ponsel.
- Pertahankan kontras teks, background, border, dan indikator interaksi pada light mode maupun dark mode.
- Sediakan indikator `hover`, `focus`, `disabled`, dan `loading` yang jelas serta konsisten.
- Gunakan semantic HTML dan komponen aksesibel sesuai kebutuhan.

## 2. Tailwind CSS v4 & Design Tokens

- Gunakan utility class Tailwind yang valid dan kompatibel dengan versi proyek. Jangan mengarang nama class.
- Prioritaskan semantic design tokens seperti `bg-background`, `text-foreground`, `border-border`, dan `text-muted-foreground` daripada warna hardcoded untuk elemen yang mengikuti tema.
- Definisikan warna, font, radius, dan nilai desain bersama yang memerlukan konfigurasi khusus di `src/app/globals.css` menggunakan CSS variables serta `@theme` Tailwind v4 sesuai kebutuhan.
- Jangan membuat design token baru jika token yang tersedia sudah memenuhi kebutuhan.
- Hindari penyusunan nama class secara dinamis yang tidak dapat dideteksi Tailwind saat proses build.
- Gunakan `cn()` untuk menggabungkan class secara kondisional dan menangani konflik utility class.
- Gunakan `@utility` atau custom CSS hanya jika utility bawaan dan komponen reusable tidak sesuai.
- Hindari penggunaan `@apply` secara berlebihan hanya untuk memindahkan rangkaian utility class ke CSS.

## 3. Reusable Components & Konsistensi Styling

- Prioritaskan komponen Shadcn UI yang sudah terpasang sebelum membuat komponen baru.
- Jika pola tampilan dan perilaku yang sama digunakan di beberapa tempat, pertimbangkan reusable React component.
- Gunakan component variants untuk variasi komponen seperti ukuran, warna, dan status apabila diperlukan.
- Jangan otomatis memindahkan utility class ke `globals.css` hanya karena digunakan lebih dari sekali.
- Gunakan `globals.css` untuk global styles, design tokens, dan pola CSS bersama yang memang bersifat global.
- Pertahankan utility class secara langsung di JSX untuk styling yang sederhana atau spesifik terhadap komponen.
- **Pemisahan Layout Halaman vs Komponen Card:** Hindari menumpuk inline markup kartu berulang di dalam file `page.tsx`. Jika terdapat layout card yang memiliki struktur dasar identik (seperti kartu metrik ringkasan kas), buatlah komponen card primitive terfokus di `src/components/features/<domain>/` dan salurkan konten/footer melalui props.
- **Prinsip Mutlak DRY (Don't Repeat Yourself) pada Antarmuka:** Dilarang keras membuat banyak file komponen yang memiliki kerangka/shell visual hampir identik (hanya berbeda judul, ikon, teks badge/link, atau konten). Wajib satukan ke dalam satu reusable card/container primitive dengan memanfaatkan props konfigurasi dan slot `children` (contoh: `DashboardHubCard` dan `CashflowSummaryCard`), serta cegah copy-paste markup kartu berulang di seluruh komponen dan halaman.
- Sebelum membuat komponen, token, atau utility baru, periksa implementasi yang sudah tersedia.
- Hindari refactoring styling di luar scope tugas tanpa alasan teknis yang jelas.

## 4. Interaksi, Feedback & State

- Gunakan `Dialog` atau `AlertDialog` dari Shadcn UI untuk konfirmasi dan interaksi modal, bukan `alert()`, `confirm()`, atau `prompt()` bawaan browser.
- Gunakan sistem toast aplikasi untuk notifikasi keberhasilan, kegagalan umum, dan aksi Undo.
- **Validasi Formulir & Error Input:** Jangan menggunakan toast di atas layar untuk kesalahan input formulir pengguna. Wajib menampilkan pesan error teks merah kecil (`text-xs text-destructive`) langsung di bawah field yang bermasalah, dan mengubah border text field menjadi merah (`border-destructive focus:ring-destructive`). Toast hanya untuk feedback status global, aksi berhasil, atau error jaringan fatal.
- Jangan menampilkan nominal keuangan asumsi ketika data masih dimuat atau terjadi kesalahan.
- Tampilkan loading state, error state, empty state, dan opsi retry yang jelas sesuai kebutuhan.
- Optimistic UI wajib disinkronkan dengan respons server yang sebenarnya.
- Jika mutasi gagal, pulihkan state sebelumnya dan tampilkan feedback kesalahan yang sesuai.
- Hindari duplikasi business logic dan kalkulasi finansial di komponen presentasi.

## 5. Verifikasi UI

- Jalankan pemeriksaan otomatis non-UI yang relevan sesuai Global Cecillia.
- Jangan menjalankan browser automation atau screenshot otomatis untuk pengujian antarmuka.
- Untuk perubahan UI, berikan checklist pengujian manual yang singkat dan disertai hasil yang diharapkan.
- Pastikan pengujian manual mencakup mobile, desktop, light mode, dan dark mode jika terdampak perubahan.
- Jangan mengklaim tampilan atau interaksi sudah teruji jika belum diverifikasi.

## 6. Aturan Tipografi & Larangan Font Mono untuk Angka

- **Dilarang Keras Menggunakan Monospace untuk Angka:** Jangan pernah menggunakan font monospace (`font-mono`) untuk angka, nominal mata uang (Rupiah), saldo, persentase, rasio, metrik, KPI, atau penomoran di antarmuka (UI).
- Semua angka dan nominal finansial wajib menggunakan font sans-serif standar (Inter / font sans aplikasi) yang proporsional.
- Gunakan utility class `tabular-nums` (`font-variant-numeric: tabular-nums`) apabila memerlukan perataan digit angka yang rapi (misalnya pada tabel data, kartu ringkasan, atau daftar pos anggaran), tanpa mengubah jenis font menjadi monospace.
- Font monospace (`font-mono`) hanya diperbolehkan secara terbatas untuk kode pemrograman, commit hash, UUID, atau debug trace teknis bila benar-benar relevan.

## 7. Standar Navigasi, Header Pintar & Scroll Mulus

- **Smart Navbar:** Header fixed/sticky menggunakan latar solid `bg-background` tanpa garis bawah (`border-b`).
- Otomatis bersembunyi meluncur ke atas (`-translate-y-full transition-transform duration-300 ease-in-out`) saat scroll ke bawah untuk memaksimalkan area baca, dan meluncur turun kembali (`translate-y-0`) saat pengguna melakukan scroll ke atas sedikit saja.
- Sediakan elemen spacer statis (misal `h-16`) di bawah header agar konten berikutnya tidak melompat (zero layout shift).
- **Global Smooth Scroll:** Aktifkan `scroll-smooth` pada elemen root `<html>` di `layout.tsx` dan layer `html` di `globals.css` agar anchor navigation dan scroll halaman berjalan mulus.

## 8. Presisi Geometri Ikon Status & Mockup Komponen

- **Rasio Ikon Status 1:1 Bulat Sempurna:** Seluruh simbol status melingkar (centang, warning, silang) wajib menggunakan kelas `shrink-0 aspect-square rounded-full` dan padding mikro internal (`p-[1px]`) agar tidak terdistorsi menjadi lonjong/oval di dalam kontainer flex/grid maupun sel tabel yang padat.
- **Mockup Native CSS:** Utamakan pembuatan frame/chassis mockup perangkat menggunakan CSS murni (vektor) daripada gambar raster eksternal (PNG/JPEG) agar tampilan selalu tajam di layar Retina, ringan, dan tidak berisiko broken-asset.

**Prinsip utama:** Gunakan styling yang konsisten, reusable, aksesibel, dan mudah dipelihara tanpa membuat abstraksi atau konfigurasi yang tidak diperlukan.

## Arah Visual & Konsistensi Desain

- Sebelum membuat atau mengubah tampilan UI, baca `docs/DESIGN-SYSTEM.md` sebagai sumber utama identitas visual proyek.
- Terapkan typography, warna, spacing, layout, radius, komposisi, dan karakter komponen sesuai dokumen tersebut.
- Jangan menggunakan estetika template AI generik atau menambahkan dekorasi hanya agar tampilan terlihat modern.
- Utamakan hierarki informasi, keterbacaan, konsistensi, dan kegunaan nyata dibanding efek visual berlebihan.
- Jangan mengubah bahasa visual proyek secara sepihak.
- Jika dokumen belum menjelaskan suatu keputusan desain, ikuti pola dari komponen yang sudah ada. Untuk keputusan visual besar, ajukan pilihan yang jelas.
- Gunakan design tokens dan komponen reusable yang tersedia sebelum membuat pola baru.
- Perlakukan referensi visual yang sudah disetujui sebagai acuan, bukan alasan untuk menyalin tampilan produk lain secara identik.