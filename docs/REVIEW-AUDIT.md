# Kenzo Treasury — Cross-document audit (2026-10-12)

**Sources inspected:** uploaded `PRD.md`, `AGENTS.md`, `PLANBACKEND.md`, `PLANFRONTEND.md`, `laporan.md`. This is a documentation review, **not** a verified repository/database inspection. No production schema change has been executed by this package.

## Existing approved work — preserve
- Frontend F1 is checked in `PLANFRONTEND.md`; `laporan.md` says approved on 2026-10-09.
- Backend B1 is checked in `PLANBACKEND.md`; `laporan.md` says approved on 2026-10-10, schema generated and pushed to Supabase (`drizzle-kit push --force` is **reported**, not independently verified here).
- Treat these as historical status from the documents, not proof that the current repository or deployment is healthy.

## High-priority contradictions
1. **Auth:** PRD selects Supabase Auth while Drizzle `users` contains `password`; Backend B2 says implement BCrypt/Argon2, duplicating credential storage. Prioritize a safe, data-preserving schema/auth alignment before B2; verify deployed schema and migration process.
2. **Next.js convention:** Plan B2 requests `src/middleware.ts` although project stack is Next.js 16. Official v16 uses `src/proxy.ts` / `proxy`. Authenticate/authorize in actions, not proxy alone.
3. **Direct DB access and RLS:** B1 report says runtime uses `postgres.js` through Supavisor. It doesn't establish per-user RLS identity for Drizzle queries. Confirm driver role and enforce secure ownership/authorization; verify policies rather than presuming RLS is effective.
4. **Security risk:** B1 reports `drizzle-kit push --force` against Supabase. Reconcile schema/migration history and forbid further destructive pushes until reviewed.
5. **Versions:** PRD section 2 says Next.js 16, but milestone Phase 1 says Next.js 15; package versions in AGENTS can become stale. Manifest and actual lockfile win for installed package versions.
6. **Deprecated model:** PRD, B13 and F15 name `Gemini 1.5 Flash`; replace with a supported model chosen after fresh official API verification; do not guess future compatibility.
7. **PWA ambiguity:** PRD says Serwist *or* next-pwa, AGENTS fixes next-pwa; decide based on compatibility with actual Next.js 16 build.
8. **Offline transaction duplication:** PRD FR-15 and B9 specify replay/undo with no server operation ID, reversal or conflict design. Add idempotency and tests.
9. **Delete mismatch:** PRD describes 5-second undo before deletion commit while B9 soft-deletes immediately and suggests subsequent hard deletion; decide event timing and audit-retention policy.
10. **Financial semantics:** PRD closes month and sweeps free-budget remainder, but doesn't distinguish cash already allocated to savings, transfers and actual expenses. Define ledger, correction and duplicate-close handling.
11. **Approval vs logging:** old AGENTS requires changelog and progress only on some milestones, but Ken wants every completed repository-change task recorded across projects. Global documentation rule now supplies that, while phase checklist remains gated on explicit approval.
12. **Reporting repetition:** AGENTS, both plans and Global Persona duplicate no-browser-automation, file reporting and read-entire-PRD mandates. Keep global constraints in global, project gate in project, and read only relevant PRD sections.

## Safe plan amendments (not yet applied to historical plans)
- **B2:** Replace custom password hashing task with Supabase Auth profile linking plus reviewed migration/compatibility strategy. Replace `middleware.ts` instruction with `proxy.ts` convention. Add explicit per-user authorization proof/test. Do not simply drop existing password column in a live database.
- **B5:** Prevent duplicate `(user_id, year, month_index)` and duplicate default income/categories through constraints and idempotency.
- **B6–B10:** Derive free-budget value from authoritative income, reconcile edited/deleted transactions, and make liability/save-allocation mutations atomic and replay-safe.
- **B9:** Choose a consistent soft-delete vs delayed-delete behavior; preserve financial audit trail. Remove automatic hard-delete cleanup until retention policy is agreed.
- **B13/F15:** Choose and verify a currently supported Gemini model ID.
- **F7/F8/F17:** Specify optimistic rollback, offline idempotency and UI undo interactions.
- **PRD Section 8:** Align initial Next.js milestone to deployed version, and separately define MVP vs later modules.

## References (official)
- Google Antigravity rules & triggers: https://antigravity.google/docs/rules/
- Google Antigravity skills & discovery: https://antigravity.google/docs/skills/
- Next.js 16 proxy: https://nextjs.org/docs/app/api-reference/file-conventions/proxy
- Gemini model deprecations: https://ai.google.dev/gemini-api/docs/deprecations/
- Supabase Auth SSR: https://supabase.com/docs/guides/auth/server-side
