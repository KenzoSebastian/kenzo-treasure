---
name: financial-integrity
description: "Use for implementing or reviewing Kenzo Treasury cashflow, liabilities, savings, wishlist allocations, month sweep, undo, and offline mutations where balances must not double-count."
---
# Financial integrity
1. Announce actual Project skill name, path and reason.
2. Identify authoritative data, mutation boundary, actor identity and account/month ownership.
3. Check create/edit/delete/undo/retry/concurrent/offline-replay paths and whether operations transfer rather than create money.
4. Design atomic DB transaction plus idempotency key or stable mutation ID; define reversal and reconciliation.
5. Verify positive/negative amounts, insufficient funds, partial failures, cross-user denial, month boundaries and repeated request behavior with focused tests.
6. Report actual tests and remaining risks; do not claim a balance is correct solely from a successful build.
