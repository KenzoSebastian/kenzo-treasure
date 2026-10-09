---
date: 2026-10-09
task: Penguncian Aturan Providers Wrapper Bersih di AGENTS.md
prompt: Pastikan src/app/providers.tsx tetap bersih tanpa inisialisasi state/client di dalamnya
author: Cecillia (Cil)
---

# Changelog: Penguncian Aturan Providers Wrapper Bersih

## 📌 Ringkasan Perubahan
Menambahkan aturan arsitektur nomor 8 pada Seksi 5 [`AGENTS.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/AGENTS.md) yang melarang penulisan logika bisnis, hook state, atau inisialisasi client instances di dalam [`src/app/providers.tsx`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/src/app/providers.tsx). File ini ditetapkan sebagai *pure composition wrapper*.

---

## 📁 Berkas yang Dibuat / Diubah
- [`AGENTS.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/AGENTS.md) — Menambahkan Seksi 5 Poin 8: Providers Wrapper Bersih (Zero Business Logic / State).
- [`laporan.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/laporan.md) — Update checkpoint persiapan & arsitektur.

---

## 💡 Manfaat Arsitektur (Rationale)
1. **Separation of Concerns:** Menjamin `providers.tsx` hanya bertugas menyatukan context tree tanpa tercemar side-effects atau logika state lokal.
2. **Kemudahan Uji & Refactor:** Inisialisasi client di `src/lib/` memudahkan reuse di file lain (misal Server Actions atau unit tests) tanpa bergantung pada siklus render React component.
