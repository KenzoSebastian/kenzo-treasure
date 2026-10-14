---
date: 2026-10-09
time: "22:29 WIB"
timezone: Asia/Jakarta
task: Pembuatan Berkas .gitignore Proyek
prompt: Lupa gitignore kan, tambahin dulu tuh
author: Antigravity
---

# Changelog: Pembuatan Berkas .gitignore

## 📌 Ringkasan Perubahan
Membuat berkas [`.gitignore`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.gitignore) komprehensif di root repositori untuk mencegah file sensitif, artefak build, dependensi, dan generated service worker ter-commit ke git.

---

## 📁 Berkas yang Dibuat / Diubah
- [`.gitignore`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.gitignore) — Berkas konfigurasi git ignore untuk Next.js 16, Node, PWA, IDE, dan Environment Variables.
- [`laporan.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/laporan.md) — Memperbarui log checkpoint fase persiapan.

---

## 💡 Cakupan Proteksi (Rationale)
1. **Keamanan Kredensial & Secrets:** Mengabaikan `.env`, `.env.*` (kecuali `.env.example`), `env.production.local`, serta sertifikat/private keys (`*.pem`, `*.key`).
2. **Build Outputs & Dependencies:** Mengabaikan `node_modules/`, `.next/`, `out/`, `build/`, `dist/`.
3. **PWA Generated Files:** Mengabaikan output otomatis service worker dari `@ducanh2912/next-pwa` di `public/sw.js`, `public/workbox-*.js`, dsb.
4. **Scratch & Local Tests:** Mengabaikan folder ad-hoc `scratch/`, `.runtime/`, dan `.tests-backup/`.
