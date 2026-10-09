---
date: 2026-10-09
task: Penambahan Aturan Alur Pasca-Approval & Rekomendasi Commit Git
prompt: Bikin 1 aturan lagi di AGENTS.md setelah selesai ngerjain sebuah fase jangan langsung loncat, centang dulu plan, lalu kasih rekomendasi commit message format [action:description] bahasa Inggris buat commit manual
author: Cecillia (Cil)
---

# Changelog: Penambahan Aturan Alur Pasca-Approval & Rekomendasi Git Commit

## 📌 Ringkasan Perubahan
Menambahkan aturan eksplisit pada Seksi 10 [`AGENTS.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/AGENTS.md) (poin 7) bahwa setelah Kenzo menyetujui hasil pengerjaan suatu fase ("oke", "lanjut", "approve"):
1. Agent **DILARANG LANGSUNG MEMULAI** fase berikutnya.
2. Agent wajib mencentang checklist di plan ([`PLANBACKEND.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/PLANBACKEND.md) / [`PLANFRONTEND.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/PLANFRONTEND.md)), menulis log `.changelog/`, dan memperbarui [`laporan.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/laporan.md).
3. Agent wajib menyajikan rekomendasi Conventional Git Commit Message berbahasa Inggris dengan format `<action>: <description>` (misal: `feat: implement authentication`, `chore: initialize next.js 16 and tailwind v4`).
4. Memberikan perintah terminal git manual untuk dijalankan oleh Kenzo, lalu menahan eksekusi (HOLD) sampai Kenzo menginstruksikan lanjut.

---

## 📁 Berkas yang Dibuat / Diubah
- [`AGENTS.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/AGENTS.md) — Menambahkan Seksi 10 Poin 7.
- [`.changelog/2026-10-09_post_approval_commit_rules.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.changelog/2026-10-09_post_approval_commit_rules.md) — Berkas audit log changelog.
- [`laporan.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/laporan.md) — Sinkronisasi log checkpoint persiapan.

---

## 💡 Keputusan Penting (Rationale)
1. **Integritas Riwayat Git:** Kenzo mengontrol commit history repositori secara mandiri dan rapi dengan format terstandarisasi.
2. **Pencegahan Scope Creep & Over-execution:** Menjaga agar agen tidak terburu-buru mengerjakan fase selanjutnya sebelum checkpoint saat ini benar-benar ter-commit dan terdokumentasi dengan baik.
