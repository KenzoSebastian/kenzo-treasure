---
name: phase-delivery
description: "Use when implementing, verifying or closing a named Kenzo Treasury phase from PLANBACKEND.md or PLANFRONTEND.md, including strict approval checks and manual commit recommendations."
---
# Named phase delivery
1. Announce actual Project skill path/scope/reason before using. Confirm requested phase ID and status in the relevant plan and `laporan.md`.
2. Read that phase's tasks, relevant PRD sections and related code, not entire PRD or both plans. Preserve B1/F1 approved history.
3. Execute only the named phase, report each changed file and run applicable non-UI checks; give manual UI checklist if applicable.
4. Update `.changelog/` and `laporan.md` under **Global change-documentation** workflow after actual edits. Mark work `IMPLEMENTED / AWAITING APPROVAL` until named-phase approval; don't check items yet.
5. Upon explicit approval of the named phase: check only confirmed items, update report and append approval to existing changelog (don't duplicate implementation). Suggest `feat: ...`/`fix: ...` commit and `git add <exact-paths>`; never commit/push or advance automatically.
6. If implementation uncovers a schema/requirements discrepancy, report it rather than pretending legacy approved work did not happen.
