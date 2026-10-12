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