/**
 * ==============================================================================
 * Kenzo Treasury — Centralized Zod Validation Schemas Index
 * ==============================================================================
 *
 * Menggabungkan seluruh kontrak validasi client-server:
 * - Auth (Login, Register)
 * - Months (Lifecycle, Closing/Sweep, Reopen)
 * - Incomes (Multi-source, Base salary, Freelance buffer)
 * - Liabilities (Finite debt, Installments, Two-Way Opsi A)
 * - Categories (3 Group Invariants, Target budget, Reorder, Safe Delete)
 * - Transactions (Daily expenses, QRIS/Cash/Debit/Transfer, Soft-delete)
 * - Wishlists (Sinking fund, Gamified milestones, Allocations)
 * - Savings (Emergency fund transfers & target)
 * - Onboarding & Settings (User budget templates & finance defaults)
 */

export * from "./auth.schema";
export * from "./month.schema";
export * from "./income.schema";
export * from "./liability.schema";
export * from "./category.schema";
export * from "./transaction.schema";
export * from "./wishlist.schema";
export * from "./savings.schema";
export * from "./onboarding.schema";
export * from "./settings.schema";
