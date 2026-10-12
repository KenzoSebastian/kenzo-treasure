---
trigger: model_decision
description: "Kenzo Treasury Supabase Auth + SSR, Drizzle direct PostgreSQL connections, per-user authorization, RLS, migrations and secure transactions."
---
# Database & auth
- Supabase Auth is the credential authority. Do not implement separate application password hashing. Profile ID should correspond to authenticated user ID; current B1 schema has a password column, so plan a SAFE reviewed migration rather than assuming it is already fixed.
- Never expose service-role/secret keys to browser code. Authenticate and authorize on every protected Server Action; check ownership of all referenced IDs, including child relations.
- Direct privileged Drizzle/Postgres connections do not implicitly carry a logged-in user's Supabase RLS context. Verify effective DB role and choose an explicit secure model (user-context RLS, or carefully audited server-side ownership checks with least privilege); document and test it before enabling sensitive APIs.
- Use RLS where accessible APIs require it, test cross-user denial, and do not rely on user-supplied `userId` for access control.
- Enforce constraints/transactions for double submissions and concurrent operations. No destructive migration, `db push --force`, or production data mutation without explicit approval and review.
- Check actual deployed Supabase connection settings and current vendor docs before changing SSL, pooling, ports, auth SSR, or migration commands; avoid rigid undocumented TLS assumptions.
