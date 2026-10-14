---
date: 2026-10-14
time: "23:49 WIB"
timezone: Asia/Jakarta
task: Global Scroll Smooth, Solid Navbar Tanpa Border-B & Smart Hide/Reveal on Scroll
prompt: trakhir, tambahin scroll smoth di layout html nya agar semua elemen/page terdampak, lalu hilangin border bottom pada navbar, hilagin transparant navbar, warnanya solid aja, klo di scroll ke bawah, navbar ikut kescroll naik, tertapi saat aku scroll sedikit keatas, nabar langsung muncul dengan transisike bawah mulus
author: Antigravity
status: APPROVED
---

# Laporan Perubahan: Global Scroll Smooth & Smart Reveal Navbar Landing Page Fase F3

## 1. Ringkasan Capaian
1. **Penerapan Global `scroll-smooth` pada Layout HTML (`layout.tsx` & `globals.css`):**
   - Menambahkan kelas `scroll-smooth` pada tag `<html>` di `src/app/layout.tsx` dan layer `html` di `src/app/globals.css`.
   - Seluruh perpindahan anchor link halaman (`#fitur`, `#cara-kerja`, `#keamanan`, `#perbandingan`, `#faq`) dan scroll pengguna otomatis berjalan mulus tanpa lompatan kasar di semua halaman.
2. **Penyempurnaan Tampilan Solid Navbar Tanpa Border Bottom (`LandingNavbar.tsx`):**
   - Menghapus garis `border-b` pada navbar dan mobile drawer untuk tampilan yang lebih modern, bersih, dan menyatu.
   - Mengubah latar belakang dari transparan/blur (`bg-background/85 backdrop-blur-md`) menjadi warna solid `bg-background`.
3. **Smart Hide on Scroll Down & Reveal on Scroll Up (`LandingNavbar.tsx`):**
   - Menerapkan listener scroll performan tinggi (`useRef` delta scroll):
     - Saat scroll ke bawah: navbar bertransisi naik keluar dari layar (`-translate-y-full transition-transform duration-300 ease-in-out`).
     - Saat scroll ke atas sedikit saja: navbar langsung meluncur turun dengan mulus (`translate-y-0`) dan mengapung dengan bayangan halus (`shadow-xs`).
     - Saat berada di posisi paling atas halaman (`scrollY <= 10`): navbar selalu tampil normal tanpa bayangan.
   - Menambahkan elemen spacer `h-16` untuk menjaga kestabilan posisi elemen di bawah header tanpa layout shift.
4. **Rancang Bangun Mockup Ponsel Titanium Murni CSS 2D (`MobileShowcase.tsx`):**
   - Menghapus total ketergantungan file gambar raster eksternal (`public/img/mobile-view.png`) dan komponen `next/image`.
   - Menggantinya dengan chassis ponsel iPhone Titanium murni CSS vektor (`rounded-[50px]`, tombol fisik samping, Dynamic Island vektor, dan status bar iOS).
   - Menetapkan orientasi 2D depan tegak lurus (0 derajat tilt/kemiringan) dengan proporsi ramping `w-[280px] sm:w-[312px]` dan `min-h-[580px] sm:min-h-[595px]`.
   - Menerapkan animasi melayang halus (`animate-float` dan `animate-float-shadow`) dengan perlindungan `prefers-reduced-motion`.
5. **Geometri Simbol Status Presisi Bulat Sempurna (`ComparisonTable.tsx`):**
   - Mengoreksi seluruh simbol centang, warning, dan silang di matriks perbandingan agar bulat sempurna 1:1 tanpa distorsi oval (`shrink-0 aspect-square rounded-full`).
   - Menambahkan padding mikro `p-[1px]` dengan ukuran kontainer `size-5` (20x20px) dan ikon `size-3` (`strokeWidth={2.5}`).
6. **Penghapusan Menyeluruh Kelas `font-mono` pada Angka dan Elemen UI:**
   - Menghapus seluruh penerapan kelas `font-mono` pada angka nominal uang, rasio, badge, dan penomoran langkah di landing page publik agar tipografi lebih harmonis menggunakan jenis font standar (sans-serif) aplikasi dengan perataan `tabular-nums` yang rapi.
   - File yang disesuaikan:
     - `HeroSection.tsx`: badge versi, nominal 3 kartu ringkasan KPI, dan 3 baris alokasi pos anggaran.
     - `BentoFeatures.tsx`: micro preview bar pada 6 pilar fondasi.
     - `MetricsStrip.tsx`: angka 4 metrik utama (100%, < 5d, 0, 100%).
     - `MobileShowcase.tsx`: display nominal kasir kilat (`Rp 35.000`).
     - `WorkflowSection.tsx`: nomor urut 4 langkah alur finansial (`01`, `02`, `03`, `04`).
     - `LandingFooter.tsx`: badge `PWA` pada footer.
7. **Revert Headline Hero Section (`HeroSection.tsx`):**
   - Membatalkan eksperimen layout bertingkat dan mengembalikan judul utama ke format awal yang bersih, terpadu, dan elegan: *"Atur Anggaran Bulanan Lebih Tenang Tanpa Takut Uang Bocor."* dengan garis bawah halus pada *"Tanpa Takut Uang Bocor"*.
8. **Perombakan Copywriting 12 Seksi:**
   - Seluruh teks pemasaran pada 12 seksi landing page publik dirombak dengan prinsip *Conversion Copywriting*, bebas dari pola klise AI, tanpa istilah teknis developer, dan tanpa data pribadi sensitif.
   - **Navbar:** Teks navigasi disederhanakan (*Fitur Utama, Cara Kerja, Keamanan, Perbandingan, Tanya Jawab*) dan tombol aksi dibuat jelas (*Coba Gratis*).
   - **Hero Section:** Headline hasil nyata (*outcome without pain*), microcopy jaminan (*100% Bebas Iklan, Catat Cepat di Kasir < 5 Detik, Data Tersimpan Privat*), serta kartu mockup yang realistis (*Dana Darurat: 6 Bulan Aman, Kebutuhan Pokok Terkunci, Belanja Santai*).
   - **Metrics Strip:** Nilai manfaat nyata (*Kebutuhan Pokok Aman, Catat Cepat di Kasir, Data Milik Anda Sendiri, Bebas Tawaran Pinjol*).
   - **Masalah vs Solusi:** Masalah nyata pengguna (*Rumus Spreadsheet Mudah Rusak di Ponsel, Aplikasi Berat Bikin Malas Mencatat di Kasir, Pemasukan Tambahan Mencampuradukkan Anggaran, Cicilan Tercatat Selamanya, Banjir Iklan Pinjol*) vs solusi langsung Kenzo Treasury.
   - **6 Pilar Finansial:** 6 kartu simetris dengan bahasa manusiawi (*Lembar Kerja Terpisah, Jatah Belanja Fleksibel, Cicilan Terhitung Tuntas, Tolok Ukur Dana Darurat, Tabungan Barang Impian, Saran Keuangan dari AI*).
   - **Mobile Showcase:** Narasi antrean kasir nyata, form satu tangan ramah jempol, papan angka aktif otomatis, dan tombol Batal instan 5 detik.
   - **Alur 4 Langkah:** Alur kerja mudah (*Buka Lembar Bulan Baru, Catat Pengeluaran Harian, Alokasikan Uang Tambahan, Tutup Buku & Amankan Tabungan*).
   - **Keamanan Data:** Penjelasan privasi tanpa istilah teknis asing (*Penyimpanan Privat Mandiri, Proteksi Akun Tingkat Tinggi, Unduh Data Lengkap Kapan Saja, Bisa Dipakai Tanpa Sinyal*).
   - **Matriks Perbandingan:** Komparasi jujur 9 kriteria finansial vs aplikasi pasaran dan spreadsheet.
   - **FAQ Accordion:** 6 pertanyaan penting dijawab secara to-the-point dan ramah.
   - **Final Banner & Footer:** Ajakan bertindak yang kuat (*Kelola Uang Bulanan dengan Tenang dan Rapi*, tombol *Mulai Atur Keuangan Sekarang*), bebas em dash, dan deskripsi produk yang bersahabat.
   - **SEO Metadata:** Judul dan deskripsi meta diperbarui agar selaras dengan positioning baru.

---

## 2. Berkas yang Diubah

| Status | File | Ringkasan Perubahan |
| :--- | :--- | :--- |
| `MODIFIED` | [`src/app/layout.tsx`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/src/app/layout.tsx) | Menambahkan kelas `scroll-smooth` pada tag root `<html>` agar seluruh transisi halaman berjalan mulus |
| `MODIFIED` | [`src/app/globals.css`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/src/app/globals.css) | Menerapkan `scroll-smooth` pada layer `base html` dan keyframes animasi `float` & `float-shadow` |
| `MODIFIED` | [`src/components/features/landing/LandingNavbar.tsx`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/src/components/features/landing/LandingNavbar.tsx) | Menghapus `border-b`, mengubah background menjadi solid `bg-background`, serta menambahkan smart hide on scroll down & reveal on scroll up |
| `MODIFIED` | [`src/components/features/landing/MobileShowcase.tsx`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/src/components/features/landing/MobileShowcase.tsx) | Mengganti gambar PNG raster dengan chassis iPhone Titanium murni CSS vektor 2D upright dengan Dynamic Island & animasi floating |
| `MODIFIED` | [`src/components/features/landing/ComparisonTable.tsx`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/src/components/features/landing/ComparisonTable.tsx) | Mengoreksi geometri simbol centang, warning, dan silang agar bulat sempurna 1:1 (`aspect-square shrink-0 rounded-full p-[1px]`) |
| `MODIFIED` | [`src/components/features/landing/HeroSection.tsx`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/src/components/features/landing/HeroSection.tsx) | Mengganti headline menjadi model outcome-without-pain, menghapus pola AI tell, dan merapikan teks mockup |
| `MODIFIED` | [`src/components/features/landing/MetricsStrip.tsx`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/src/components/features/landing/MetricsStrip.tsx) | Mengganti copy metrik menjadi manfaat yang jelas bagi konsumen |
| `MODIFIED` | [`src/components/features/landing/ProblemSolutionSection.tsx`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/src/components/features/landing/ProblemSolutionSection.tsx) | Merombak teks masalah & solusi dengan bahasa keluhan nyata pengguna spreadsheet/aplikasi umum |
| `MODIFIED` | [`src/components/features/landing/BentoFeatures.tsx`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/src/components/features/landing/BentoFeatures.tsx) | Menghapus contrast reveals pada pilar dana darurat dan memoles 6 kartu menjadi copy bernilai tinggi |
| `MODIFIED` | [`src/components/features/landing/WorkflowSection.tsx`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/src/components/features/landing/WorkflowSection.tsx) | Menyusun alur 4 langkah yang mengalir alami dan menghapus `font-mono` pada nomor langkah |
| `MODIFIED` | [`src/components/features/landing/SecuritySection.tsx`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/src/components/features/landing/SecuritySection.tsx) | Menjelaskan keamanan data tanpa jargon *zero-trust* atau istilah rumit |
| `MODIFIED` | [`src/components/features/landing/FaqAccordion.tsx`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/src/components/features/landing/FaqAccordion.tsx) | Menulis ulang 6 tanya jawab secara to-the-point dan bebas dari pola klise AI |
| `MODIFIED` | [`src/components/features/landing/LandingFooter.tsx`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/src/components/features/landing/LandingFooter.tsx) | Memperbarui banner konversi penutup dan menghapus `font-mono` pada badge PWA |
| `MODIFIED` | [`src/app/page.tsx`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/src/app/page.tsx) | Memperbarui metadata title dan description agar selaras dengan positioning baru |
| `MODIFIED` | [`.agents/rules/frontend-design.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.agents/rules/frontend-design.md) | Menambahkan seksi 6 aturan larangan `font-mono` pada angka, mata uang, dan penomoran antarmuka |
| `MODIFIED` | [`docs/DESIGN-SYSTEM.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/docs/DESIGN-SYSTEM.md) | Menegaskan larangan mutlak `font-mono` pada angka dan mewajibkan `tabular-nums` di Section 3 & 10 |
| `MODIFIED` | [`PLANFRONTEND.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/PLANFRONTEND.md) | Menambahkan aturan #6 pada ATURAN KERJA AGENT terkait larangan `font-mono` untuk angka UI |
| `MODIFIED` | [`AGENTS.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/AGENTS.md) | Menambahkan seksi 5 Standar Tampilan & Tipografi dengan larangan keras `font-mono` pada angka |
| `MODIFIED` | [`.agents/skills/shadcn/rules/styling.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.agents/skills/shadcn/rules/styling.md) | Menambahkan contoh benar/salah larangan `font-mono` pada nominal dan metrik UI |

---

## 3. Hasil Verifikasi Kualitas
- **Pemeriksaan Pola Banned AI Tells:** **PASS** (0 pola contrast reveal, 0 negation list, 0 colon reveal, 0 em-dash pada short copy)
- **Pemeriksaan Istilah Teknis Developer:** **PASS** (0 kata teknis seperti Invarian, RLS, Edge Proxy, PostgreSQL, Idempoten, Sub-Second, telemetri, zero-trust)
- **Pemeriksaan Data Pribadi Sensitif:** **PASS** (0 data sensitif ditemukan)
- **`bun test` & `bun run build`**: **NOT RUN** (Sesuai instruksi eksplisit dari Kenzo untuk revisi tampilan tanpa build/test).

---

## 4. Status Fase
`APPROVED` ✅
- **Tanggal & Waktu Persetujuan:** 2026-10-14 23:59 WIB
- **Pemberi Persetujuan:** Kenzo Sebastian (Ken)
- Seluruh 12 butir checklist Fase F3 di `PLANFRONTEND.md` telah diverifikasi dan resmi disetujui (`- [x]`).
