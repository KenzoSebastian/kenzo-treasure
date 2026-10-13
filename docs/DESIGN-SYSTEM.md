---
version: "1.1.0"
status: "proposed"
name: "Kenzo Treasury — Swiss Functional Minimalism"
description: "Sistem desain mobile-first untuk aplikasi keuangan pribadi: Swiss grid, tipografi tegas, data terbaca, dan antarmuka tenang tanpa dekorasi generik."
scope: "Kenzo Treasury web/PWA, bukan template landing page"
language: "id-ID"
density: "5/10 — ringkas tetapi lapang"
variance: "2/10 — konsisten dan terstruktur"
motion: "2/10 — responsif dan seperlunya"
---

# Design System — Kenzo Treasury

## 1. Arah Desain

**Swiss Functional Minimalism:** tenang, rasional, grid-based, typography-led, dan mengutamakan keterbacaan nominal keuangan. Kejelasan dan kecepatan pencatatan lebih penting daripada tampilan dekoratif.

- Karakter: profesional, personal, presisi, tidak terasa seperti landing page SaaS generik.
- Karakter Landing Page (`/`): bersih, tipografi editorial yang tegas, navigasi sticky tenang, preview antarmuka nyata (mockup dashboard), dan ajakan aksi yang transparan tanpa elemen dekoratif berlebihan (bebas gradient mencolok, glassmorphism liar, atau marketing buzzwords).
- Prinsip: setiap elemen memiliki fungsi; ruang kosong membentuk hierarki, bukan sekadar memperluas halaman.
- Kepadatan: sedang pada dashboard, lapang pada landing page dan formulir penting; tidak memaksakan whitespace kosong tanpa informasi.
- Jangan mengubah desain yang sudah disetujui secara sepihak. Gunakan existing components/tokens sebagai acuan sebelum menambah pola baru.

## 2. Palet Warna Semantik

Palet lama (hitam, putih, beige, abu-abu, taupe) menjadi **referensi karakter**, bukan kewajiban menggunakan warna mentah pada setiap komponen. Utamakan token semantik dengan pasangan light/dark yang jelas.

| Peran token | Light | Dark | Pemakaian |
|---|---|---|---|
| `background` | `#F7F6F2` | `#151A18` | Kanvas aplikasi |
| `foreground` | `#202521` | `#F4F2EC` | Teks utama |
| `card` | `#FFFFFF` | `#1E2521` | Panel data, modal |
| `card-foreground` | `#202521` | `#F4F2EC` | Teks dalam panel |
| `primary` | `#242A25` | `#D3B69D` | Aksi utama |
| `primary-foreground` | `#FFFFFF` | `#151A18` | Teks aksi utama |
| `muted-foreground` | `#616860` | `#AEB7B0` | Keterangan sekunder |
| `accent` | `#795A43` | `#C4A184` | Penekanan terbatas, bukan semua elemen |
| `border` | `#DCDFD9` | `#39433D` | Pemisah dan outline |
| `ring` | `#795A43` | `#D3B69D` | Focus indicator |

- Gunakan token shadcn/Tailwind yang sudah ada. Tabel di atas adalah **target desain**, bukan klaim bahwa CSS aplikasi saat ini sudah menggunakan nilai tersebut.
- Pasangan `foreground/background`, `primary-foreground/primary`, dan `muted-foreground/background` di atas telah dicek secara matematis mencapai kontras teks minimal 4,5:1. Tetap uji seluruh state UI aktual.
- Status keuangan memakai warna semantik yang konsisten: aman/positif, waspada, negatif/error, dan informasi; jangan gunakan warna saja untuk menyampaikan makna. Sertakan teks atau ikon yang jelas.
- Jangan memakai warna status untuk dekorasi. Taupe digunakan sebagai aksen editorial secara hemat.
- Hindari pure-black luas, gradient dekoratif, glassmorphism, neon, dan glow.

## 3. Typography & Format Data

- Gunakan **Inter** yang sudah ada di proyek (atau font sans-serif eksisting). Jangan memasang font baru hanya untuk mengikuti tren.
- Display/heading menggunakan weight 600–700 dan tracking rapat yang tetap terbaca.
- Body default `1rem` dengan line-height sekitar 1.5–1.6; label `0.875rem`; metadata `0.75rem` hanya bila kontras dan ukurannya tetap nyaman dibaca.
- Skala desktop referensi: H1 `2.25rem`, H2 `1.5rem`, H3 `1.125rem`; skala mobile mengikuti konteks, bukan memaksa headline hero pada dashboard.
- Untuk semua nominal dan kolom angka: `font-variant-numeric: tabular-nums`, rata kanan saat berbentuk tabel, dan format `id-ID` Rupiah secara konsisten.
- Label harus eksplisit: bedakan **Saldo tabungan**, **Sisa anggaran**, **Terpakai**, **Target**, dan **Total pemasukan**. Jangan memberi label "Total tabungan" pada hasil pemasukan minus pengeluaran tanpa aturan bisnis yang jelas.
- Gunakan monospace hanya untuk kode/identitas teknis bila relevan, **bukan** sebagai default seluruh nominal finansial.
- Gunakan microcopy ringkas dan manusiawi dalam Bahasa Indonesia; hindari jargon promosi seperti “Elevate”, “Unleash”, “Next-Gen”, “Seamless”.

## 4. Grid, Spacing & Layout

- Basis spacing `4px`; gunakan ritme utama `8/12/16/24/32/48px` dari token yang konsisten. Spacing 4–8rem hanya untuk halaman marketing atau pemisahan seksi besar jika memang diperlukan.
- Konten desktop maksimal sekitar `1280px`, menyesuaikan kepadatan data; padding horizontal mobile `16px` dan desktop `24–32px` jika ruang memungkinkan.
- Gunakan CSS Grid atau Flex sesuai struktur; pada desktop boleh memakai grid 2–4 kolom jika berguna untuk overview. **Larangan tiga kolom setara hanya relevan untuk section marketing generik, bukan data dashboard.**
- Mobile: utamakan ringkasan saldo, bulan aktif, pos anggaran, dan aksi cepat; sekunder seperti analitik panjang boleh berada lebih bawah/di halaman tersendiri.
- Jangan ada horizontal overflow pada halaman. Tabel lebar boleh memakai scroll horizontal **lokal dan disengaja** jika transformasi menjadi kartu tidak masuk akal.
- Gunakan `min-h-[100dvh]` atau solusi viewport yang sesuai; perhatikan safe-area, sticky action, keyboard virtual, dan posisi toast/drawer.
- Hindari kartu bersarang berlapis, terlalu banyak divider, dan ruang kosong besar yang menghambat scanning.
- Kontrak z-index jika diperlukan: `base: 0`, `sticky: 100`, `overlay: 200`, `modal: 300`, `toast: 500`; sesuaikan dengan portal/komponen bawaan agar tidak bentrok.

## 5. Bentuk, Permukaan, Elevasi

- Sudut tegas tetapi tidak kaku: radius `sm: 2px`, `md: 4px`, `lg: 8px`; tidak ada keharusan radius `0px` untuk semua komponen.
- Gunakan border halus untuk struktur; bayangan hanya untuk layer yang benar-benar melayang (dialog, popover) jika membantu pemisahan.
- Card data: satu permukaan, satu hierarki judul, satu fokus informasi. Jangan meletakkan ikon dekoratif dalam kotak berwarna di setiap judul.
- Button: primary jelas, secondary outline/ghost, destructive eksplisit. Hover/focus/disabled/loading harus mudah dibedakan.
- Input: label tetap terlihat di atas field, focus ring jelas. Jangan mengandalkan placeholder sebagai label. **Saat input salah:** jangan memunculkan toast melayang di atas; wajib mengubah border input menjadi merah (`border-destructive focus:ring-destructive`) dan menampilkan pesan error merah kecil (`text-xs text-destructive`) persis di bawah field yang bermasalah. Toast hanya dipakai untuk status aksi global/sukses/undo.

## 6. Komponen & Interaksi

- Gunakan komponen shadcn yang **benar-benar terpasang**, lalu perluas dengan variants bila pola berulang. Tidak semua kesamaan class perlu dipindahkan ke `globals.css`.
- `globals.css`: token light/dark, theme mapping, base typography, dan global styles. JSX: utilities lokal. `components/ui`: primitive reusable. `components/features`: komposisi spesifik domain.
- Tampilan daftar pos: nominal target/terpakai/sisa dan status memiliki hierarki konsisten; progress bar mendukung teks, bukan menggantikan teks.
- Quick Add transaksi: jumlah nominal menjadi fokus pertama, keyboard numerik nyaman, kategori mudah dipilih, jumlah langkah minimal, aksi submit terlindung dari duplikasi.
- Gunakan dialog/alert dialog aplikasi dan toast untuk feedback; hindari browser `alert/confirm/prompt`.
- State wajib: loading, empty, error, disabled, saving, success, offline/pending sync, dan rollback mutasi gagal; tampilkan hanya jika relevan.
- Tidak boleh menampilkan saldo palsu ketika query gagal. Gunakan placeholder/skeleton atau pesan error jelas tanpa mengarang angka.
- Untuk transaksi offline, bedakan **tersimpan di perangkat** dari **berhasil tersinkronisasi**.
- Untuk angka risiko: warna status, label, dan progress tidak boleh bertentangan.

## 7. Grafik & Data Visualization

- Label sumbu, tooltip, periode, unit Rupiah, dan rentang angka harus terbaca di mobile.
- Minimalkan gridlines dan dekorasi; utamakan nilai serta perbandingan yang bermakna.
- Warna grafik memakai palet semantik dengan kontras yang memadai dan pembeda selain warna (label, pola/garis, tooltip yang aksesibel).
- Gunakan format nilai konsisten antar card, tabel, grafik, dan ekspor; hindari grafik yang menyesatkan karena skala sumbu tidak dijelaskan.
- Render grafik hanya ketika membantu keputusan pengguna; jangan menambah chart sebagai pengisi halaman.

## 8. Motion & Accessibility

- Default transisi interaksi singkat sekitar `120–200ms`; animasi besar hanya untuk momen produk yang memang bermakna dan tidak mengganggu pekerjaan.
- Jangan memakai entrance animation bertingkat untuk seluruh daftar transaksi atau setiap navigasi halaman.
- Hormati `prefers-reduced-motion`; jangan menggantungkan pemahaman UI pada animasi.
- Target kontras teks minimum WCAG AA: `4.5:1` untuk teks normal dan `3:1` untuk teks besar; komponen grafis/interaktif yang relevan minimal `3:1` terhadap warna bersebelahan. AAA dapat menjadi aspirasi untuk teks penting, tetapi jangan mengklaim kepatuhan tanpa audit nyata.
- Ukuran target sentuh ideal minimal `48×48px` pada aksi utama mobile; pastikan label, navigasi keyboard, focus indicator, dan error form bisa dipahami.
- Jangan memaksa shimmer animasi jika skeleton statis sudah cukup.

## 9. Anti-Pattern: Hindari Tampilan AI Generik

- Jangan membuat hero besar, gradient, glassmorphism, floating blobs, atau kartu statistik 3 kolom hanya karena lazim pada template SaaS.
- Jangan menggunakan ikon untuk setiap kalimat atau menambah badge tanpa makna.
- Jangan memakai ilustrasi stock, foto acak, atau placeholder gambar eksternal sebagai dekorasi dashboard finansial.
- Jangan pakai lorem ipsum atau nominal fiktif pada UI produksi; gunakan empty state atau fixture yang jelas hanya di development.
- Hindari copywriting hiperbolik dan teks yang membuat aplikasi terasa seperti iklan.
- Jangan mengubah desain semua halaman hanya demi konsistensi visual jika pengguna hanya meminta satu perubahan kecil.
- **Khusus ikon pos anggaran:** PRD saat ini memakai emoji sebagai data kategori. Jangan diam-diam menghapus atau menggantinya. Untuk UI baru, utamakan sistem ikon Lucide; migrasi emoji kategori memerlukan keputusan produk tersendiri.

## 10. Kriteria Pemeriksaan Sebelum UI Dinyatakan Selesai

1. Konsisten dengan token dan komponen aktual; tidak ada class Tailwind yang dikarang.
2. Angka Rupiah, label, dan perbandingan keuangan benar dan konsisten; tidak menampilkan data palsu.
3. Layout dapat dipakai di mobile dan desktop; tidak ada overflow halaman tidak disengaja.
4. Light/dark, focus, error, disabled, loading, dan empty state ditangani sesuai konteks.
5. Aksi cepat, keyboard virtual, dan aksesibilitas tidak dikorbankan untuk dekorasi.
6. Motion punya tujuan dan menghormati reduced motion.
7. Pemeriksaan otomatis non-UI dijalankan jika relevan; **hasil uji visual/UI dilaporkan sebagai belum terverifikasi** sampai pengujian manual Ken dilakukan.

## 11. Implementasi & Sumber Kebenaran

- Dokumen ini adalah **spesifikasi visual**, bukan kode CSS yang sudah terpasang.
- Gunakan `src/app/globals.css` untuk menerapkan semantic CSS variables light/dark dan `@theme inline` Tailwind v4 sesuai setup shadcn yang **sebenarnya**. Baca CSS yang ada sebelum melakukan perubahan; jangan menulis ulang seluruhnya.
- `frontend-design.md` mengatur cara mengimplementasikan; dokumen ini menjelaskan target hasil visual.
- Jika spesifikasi bertentangan dengan PRD atau UI yang sudah disetujui, laporkan konflik dan pilih perubahan terkecil sampai ada keputusan.
- Referensi visual/screenshot produk yang disetujui dapat ditambahkan ke `docs/design-references/` tanpa memasukkan gambar atau narasi panjang ke Global Rules.

**Prinsip:** *Functional clarity over decorative novelty. Konsisten tanpa terasa generik.*
