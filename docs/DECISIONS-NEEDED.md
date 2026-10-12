# Kenzo Treasury — Open decisions before implementation

The items below are **not** automatically approved requirements. Resolve only those needed for the upcoming requested phase.

| Decision | Recommended starting direction / Status | Needed before |
|---|---|---|
| Existing `users.password` column vs Supabase Auth | **RESOLVED (2026-10-12):** Supabase Auth adalah otoritas tunggal akun. Kolom `password` di `users` telah dihapus via migrasi non-destruktif; `public.users` bertindak murni sebagai profil yang terikat 1:1 ke `auth.users.id`. | B2 (Done) |
| Authorization for Drizzle direct PostgreSQL | **RESOLVED (2026-10-12):** Server Actions wajib memeriksa sesi Supabase SSR (`getUser()`) dan menyertakan filter kepemilikan eksplisit (`eq(table.userId, user.id)`) pada setiap query/mutasi Drizzle. | B2/B5 (Agreed) |
| Existing migrated schema vs `drizzle-kit push --force` | Reconcile migration history; use reviewed non-destructive migration | Any DB changes |
| Duplicate monthly cycles | Add unique `(user_id, year, month_index)` and atomic generator | B5 |
| Dynamic free budget on income edit/delete | Calculate from authoritative income data, not additive stored counter | B6 |
| Liability payment edit/undo and retries | Ledger or reconciled atomic aggregate with idempotency | B7/B9 |
| 5s undo vs immediate server soft-delete | Specify user-visible timing and durable audit retention | B9/F8 |
| Insufficient savings / negative balance | Reject negative available balance by default unless explicitly allowed | B10/B11 |
| Month close/reopen after savings sweep | Exactly-once sweep with reversal/adjustment event | B5/B11 |
| Offline transactions and duplicates | Stable client operation IDs and unique server constraint | B9/F17 |
| Definition of savings rate/net savings | Distinguish income-expense surplus from actual transferred savings | B12/F14 |
| PWA implementation | Pick one Next.js 16-compatible maintained approach after documentation checks | F17 |
| AI model | Select a currently supported documented Gemini model (not `gemini-1.5-flash`) | B13/F15 |

**Do not** change past approved checkmarks to resolve these questions. Make a new reviewed change for future work when necessary.
