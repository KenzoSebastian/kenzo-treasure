---
date: 2026-10-13
task: Instalasi Skill Khusus Proyek (TanStack Query, Recharts, Zod, PWA)
prompt: /find-skills tolong cari skill skill yang relevan dengan project ini, dan tolong taro di project ini, jangan di global, cari skill yang belum ada di project ini atau di global
author: Cecillia (Cil)
---

# Laporan Perubahan: Instalasi Skill Khusus Proyek

## 1. Ikhtisar Perubahan
Menemukan dan memasang 4 skill berkualitas tinggi yang sangat relevan dengan kebutuhan arsitektur dan roadmap **Kenzo Treasury**, terpasang langsung di tingkat proyek ([`.agents/skills/`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.agents/skills/)) tanpa menyentuh scope global:
1. **`tanstack-query-best-practices`** (`deckardger/tanstack-agent-skills`): Panduan optimalisasi caching, server state, query keys, dan optimistic mutation untuk `@tanstack/react-query@5.104.1`.
2. **`recharts`** (`andy-spike/skills`): Panduan pembuatan grafik visualisasi data responsif untuk Recharts v3 (cashflow, alokasi tabungan, komparasi bulanan).
3. **`zod`** (`pproenca/dot-skills`): Panduan skema validasi tipe-aman, inferensi TypeScript, dan validasi kontrak input Server Actions.
4. **`pwa-development`** (`alinaqi/maggy`): Panduan service workers, manifest PWA, strategi offline caching, dan background synchronization.

Semua skill telah diverifikasi tidak ada sebelumnya di global maupun di proyek, serta memiliki reputasi instalasi teruji di ekosistem open agent skills.

## 2. Berkas yang Ditambahkan
- [`.agents/skills/tanstack-query-best-practices/`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.agents/skills/tanstack-query-best-practices/)
- [`.agents/skills/recharts/`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.agents/skills/recharts/)
- [`.agents/skills/zod/`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.agents/skills/zod/)
- [`.agents/skills/pwa-development/`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.agents/skills/pwa-development/)
- [`skills-lock.json`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/skills-lock.json)
