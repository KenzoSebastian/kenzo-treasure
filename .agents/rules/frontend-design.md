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
- Sebelum membuat komponen, token, atau utility baru, periksa implementasi yang sudah tersedia.
- Hindari refactoring styling di luar scope tugas tanpa alasan teknis yang jelas.

## 4. Interaksi, Feedback & State

- Gunakan `Dialog` atau `AlertDialog` dari Shadcn UI untuk konfirmasi dan interaksi modal, bukan `alert()`, `confirm()`, atau `prompt()` bawaan browser.
- Gunakan sistem toast aplikasi untuk notifikasi keberhasilan, kegagalan, dan aksi Undo.
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