---
date: 2026-10-09
time: "23:18 WIB"
timezone: Asia/Jakarta
task: Penguncian Aturan Clean Architecture & Anti-Campur Tanggung Jawab
prompt: Bikin clean code arsitektur, jangan campur wrapping, initialization, dan logic dalam satu berkas, catat di AGENTS.md
author: Antigravity
---

# Changelog: Aturan Clean Architecture & Anti-Campur Tanggung Jawab

## 📌 Ringkasan Perubahan
Menambahkan aturan nomor 9 pada Seksi 5 [`AGENTS.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/AGENTS.md) mengenai *Strict Single Responsibility*. Aturan ini secara mutlak melarang pencampuran inisialisasi library, wrapper context/provider, komponen tampilan antarmuka, business logic, dan kalkulasi matematis dalam satu berkas.

---

## 📁 Berkas yang Dibuat / Diubah
- [`AGENTS.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/AGENTS.md) — Menambahkan Seksi 5 Poin 9 (Clean Architecture & Anti-Campur Tanggung Jawab).
- [`laporan.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/laporan.md) — Sinkronisasi log persiapan & aturan main.

---

## 💡 Pemisahan Lapisan Teknis (Strict Boundary)
- **Inisialisasi SDK / Library:** Terisolasi di `src/lib/` (misal: `query-client.ts`).
- **Context Wrappers:** Murni komposisi JSX tanpa instansiasi di `src/app/providers.tsx` atau layouts.
- **Presentasi Antarmuka:** Komponen murni render visual di `src/components/`.
- **Logika Bisnis & Mutasi:** Terisolasi di `src/hooks/` atau `src/actions/`.
- **Kalkulasi Finansial:** Murni rumus matematis di `src/lib/financial-calculations.ts`.
