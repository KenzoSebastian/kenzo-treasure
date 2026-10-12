/**
 * ==============================================================================
 * Kenzo Treasury — Database Schema & Drizzle ORM Entity Definition
 * ==============================================================================
 *
 * ── Kenapa skema ini ada ──────────────────────────────────────────────────────
 *
 * Sistem ini menggantikan database Notion lama yang sebelumnya memakai satu tabel
 * global dengan filter tanggal. Arsitektur lama memiliki kelemahan fatal:
 * lambat, sulit membatasi anggaran bulanan secara deterministik, dan pos utang/
 * cicilan tidak memiliki status finite settlement (pelunasan bertarget).
 *
 * Skema ini menegakkan prinsip:
 * 1. Siklus Bulanan Terisolasi (Isolated Monthly Cycles): Setiap bulan memiliki
 *    lembar kerja mandiri (`months`), sehingga kalkulasi cashflow tiap siklus
 *    tidak saling mengontaminasi.
 * 2. Multi-Tenant by Design: Setiap data terikat pada `user_id` dengan integritas
 *    relasional cascading foreign key.
 * 3. Finite Debt Lifecycle: Cicilan (iPhone & Mama) memiliki target lunas di tabel
 *    `liabilities` yang ditautkan langsung ke pos anggaran bulanan.
 * 4. Uang dalam Integer Utuh: Seluruh nominal uang disimpan dalam format integer
 *    Rupiah murni (bukan float) untuk menghindari floating-point rounding bugs.
 *
 * ── Integritas Audit Trail ───────────────────────────────────────────────────
 *
 * Seluruh 9 tabel wajib memiliki kolom `created_at` dan `updated_at` untuk
 * keperluan tracking perubahan, invalidasi cache TanStack Query, dan sinkronisasi
 * antrean mutasi saat kembali online (PWA offline queue).
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  pgEnum,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ══════════════════════════════════════════════════════════════════════════════
   ENUMS
   ══════════════════════════════════════════════════════════════════════════════ */

/**
 * Kelompok pos anggaran bulanan:
 * - `pos_wajib`: Pos prioritas utama (Perpuluhan, Listrik, Cicilan iPhone, Talangan Mama).
 * - `kebutuhan`: Kebutuhan harian operasional (Bensin, Jajan).
 * - `uang_bebas_tabungan`: Pos fleksibel untuk simpanan atau pengeluaran bebas.
 */
export const categoryGroupEnum = pgEnum("category_group", [
  "pos_wajib",
  "kebutuhan",
  "uang_bebas_tabungan",
]);

/**
 * Metode pembayaran transaksi harian:
 * Mendukung pencatatan cepat multi-channel (Cash, Kartu Debit, QRIS, Transfer Bank).
 */
export const transactionMethodEnum = pgEnum("transaction_method", [
  "cash",
  "debit",
  "qris",
  "transfer",
]);

/* ══════════════════════════════════════════════════════════════════════════════
   1. TABEL: users (Profil Pengguna — Terikat 1:1 ke Supabase Auth auth.users)
   ══════════════════════════════════════════════════════════════════════════════ */

export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // ID UUID yang sama persis dengan auth.users.id Supabase Auth
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ══════════════════════════════════════════════════════════════════════════════
   2. TABEL: savings_account (Brankas Akumulasi Saldo & Dana Darurat)
   ══════════════════════════════════════════════════════════════════════════════ */

export const savingsAccount = pgTable("savings_account", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  balance: integer("balance").default(0).notNull(), // Saldo tabungan bebas (Rp)
  emergencyFundTarget: integer("emergency_fund_target").default(18000000).notNull(), // Target Safety Fund (misal 6x pengeluaran = Rp 18.000.000)
  emergencyFundBalance: integer("emergency_fund_balance").default(0).notNull(), // Saldo dana darurat saat ini
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ══════════════════════════════════════════════════════════════════════════════
   3. TABEL: liabilities (Utang & Cicilan Bertarget Lunas)
   ══════════════════════════════════════════════════════════════════════════════ */

export const liabilities = pgTable("liabilities", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(), // Contoh: "📱 Cicilan Pokok iPhone", "👩‍👦 Talangan Mama"
  totalAmount: integer("total_amount").notNull(), // Total kewajiban (e.g. 17.640.000 / 2.500.000)
  paidAmount: integer("paid_amount").default(0).notNull(), // Akumulasi nominal terbayar
  monthlyPayment: integer("monthly_payment").notNull(), // Target bayar per bulan (e.g. 735.000 / 500.000)
  totalMonths: integer("total_months"), // Estimasi durasi (misal 24 bulan)
  isSettled: boolean("is_settled").default(false).notNull(), // True bila paidAmount >= totalAmount
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ══════════════════════════════════════════════════════════════════════════════
   4. TABEL: months (Siklus Kerja Bulanan Terisolasi)
   ══════════════════════════════════════════════════════════════════════════════ */

export const months = pgTable("months", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(), // Label tampilan manusia, misal: "Oktober 2026"
  year: integer("year").notNull(), // 2026
  monthIndex: integer("month_index").notNull(), // 1 - 12
  isClosed: boolean("is_closed").default(false).notNull(), // Status tutup buku (read-only archive)
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ══════════════════════════════════════════════════════════════════════════════
   5. TABEL: incomes (Log Pemasukan Rutin & Dinamis)
   ══════════════════════════════════════════════════════════════════════════════ */

export const incomes = pgTable("incomes", {
  id: uuid("id").defaultRandom().primaryKey(),
  monthId: uuid("month_id")
    .references(() => months.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  source: text("source").notNull(), // Contoh: "Gaji Pokok", "Freelance Video Editing"
  amount: integer("amount").notNull(), // Nominal Rupiah integer
  date: date("date").notNull(),
  isBaseSalary: boolean("is_base_salary").default(false).notNull(), // True untuk gaji pokok rutin
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ══════════════════════════════════════════════════════════════════════════════
   6. TABEL: budget_categories (Pos-pos Anggaran per Siklus Bulan)
   ══════════════════════════════════════════════════════════════════════════════ */

export const budgetCategories = pgTable("budget_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  monthId: uuid("month_id")
    .references(() => months.id, { onDelete: "cascade" })
    .notNull(),
  liabilityId: uuid("liability_id").references(() => liabilities.id, {
    onDelete: "set null",
  }), // Ditautkan jika pos anggaran ini membayar cicilan tertentu
  name: text("name").notNull(), // Contoh: "⚡ Listrik Rumah", "🍔 Jajan"
  icon: text("icon").default("💰"),
  group: categoryGroupEnum("group").notNull(),
  targetBudget: integer("target_budget").notNull(), // Batas plafon anggaran (Rp)
  isTemporary: boolean("is_temporary").default(false).notNull(), // True jika pos ini pensiun setelah utang lunas
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ══════════════════════════════════════════════════════════════════════════════
   7. TABEL: transactions (Log Pengeluaran Harian)
   ══════════════════════════════════════════════════════════════════════════════ */

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  categoryId: uuid("category_id")
    .references(() => budgetCategories.id, { onDelete: "cascade" })
    .notNull(),
  amount: integer("amount").notNull(), // Nominal pengeluaran (Rp)
  date: date("date").notNull(), // Tanggal pengeluaran
  description: text("description").notNull(), // Keterangan transaksi
  method: transactionMethodEnum("method").default("qris").notNull(),
  isDeleted: boolean("is_deleted").default(false).notNull(), // Soft delete untuk mendukung fitur Undo Toast 5s
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ══════════════════════════════════════════════════════════════════════════════
   8. TABEL: wishlists (Barang Impian & Sinking Fund)
   ══════════════════════════════════════════════════════════════════════════════ */

export const wishlists = pgTable("wishlists", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(), // Contoh: "🚗 Honda Civic", "📷 Sony A7 IV"
  targetAmount: integer("target_amount").notNull(), // Target harga barang (Rp)
  savedAmount: integer("saved_amount").default(0).notNull(), // Alokasi dana yang terkumpul (Rp)
  icon: text("icon").default("🎯"),
  imageUrl: text("image_url"), // URL gambar WebP di Supabase Storage bucket 'wishlist-images'
  isPurchased: boolean("is_purchased").default(false).notNull(), // True bila milestone 100% tercapai dan dibeli
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ══════════════════════════════════════════════════════════════════════════════
   9. TABEL: wishlist_allocations (Riwayat Setor / Tarik Tabungan Impian)
   ══════════════════════════════════════════════════════════════════════════════ */

export const wishlistAllocations = pgTable("wishlist_allocations", {
  id: uuid("id").defaultRandom().primaryKey(),
  wishlistId: uuid("wishlist_id")
    .references(() => wishlists.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  amount: integer("amount").notNull(), // Positif (+) untuk setor, Negatif (-) untuk penarikan balik
  notes: text("notes"), // Catatan transaksi alokasi
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ══════════════════════════════════════════════════════════════════════════════
   RELASI DRIZZLE ORM (Relational Queries Support)
   ══════════════════════════════════════════════════════════════════════════════ */

export const usersRelations = relations(users, ({ one, many }) => ({
  savingsAccount: one(savingsAccount),
  months: many(months),
  incomes: many(incomes),
  liabilities: many(liabilities),
  transactions: many(transactions),
  wishlists: many(wishlists),
  wishlistAllocations: many(wishlistAllocations),
}));

export const savingsAccountRelations = relations(savingsAccount, ({ one }) => ({
  user: one(users, {
    fields: [savingsAccount.userId],
    references: [users.id],
  }),
}));

export const monthsRelations = relations(months, ({ one, many }) => ({
  user: one(users, {
    fields: [months.userId],
    references: [users.id],
  }),
  incomes: many(incomes),
  categories: many(budgetCategories),
}));

export const incomesRelations = relations(incomes, ({ one }) => ({
  month: one(months, {
    fields: [incomes.monthId],
    references: [months.id],
  }),
  user: one(users, {
    fields: [incomes.userId],
    references: [users.id],
  }),
}));

export const liabilitiesRelations = relations(liabilities, ({ one, many }) => ({
  user: one(users, {
    fields: [liabilities.userId],
    references: [users.id],
  }),
  categories: many(budgetCategories),
}));

export const budgetCategoriesRelations = relations(
  budgetCategories,
  ({ one, many }) => ({
    month: one(months, {
      fields: [budgetCategories.monthId],
      references: [months.id],
    }),
    liability: one(liabilities, {
      fields: [budgetCategories.liabilityId],
      references: [liabilities.id],
    }),
    transactions: many(transactions),
  })
);

export const transactionsRelations = relations(transactions, ({ one }) => ({
  category: one(budgetCategories, {
    fields: [transactions.categoryId],
    references: [budgetCategories.id],
  }),
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const wishlistsRelations = relations(wishlists, ({ one, many }) => ({
  user: one(users, {
    fields: [wishlists.userId],
    references: [users.id],
  }),
  allocations: many(wishlistAllocations),
}));

export const wishlistAllocationsRelations = relations(
  wishlistAllocations,
  ({ one }) => ({
    wishlist: one(wishlists, {
      fields: [wishlistAllocations.wishlistId],
      references: [wishlists.id],
    }),
    user: one(users, {
      fields: [wishlistAllocations.userId],
      references: [users.id],
    }),
  })
);

/* ══════════════════════════════════════════════════════════════════════════════
   TYPE INFERENCE EXPORTS
   ══════════════════════════════════════════════════════════════════════════════ */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type SavingsAccount = typeof savingsAccount.$inferSelect;
export type NewSavingsAccount = typeof savingsAccount.$inferInsert;

export type Month = typeof months.$inferSelect;
export type NewMonth = typeof months.$inferInsert;

export type Income = typeof incomes.$inferSelect;
export type NewIncome = typeof incomes.$inferInsert;

export type Liability = typeof liabilities.$inferSelect;
export type NewLiability = typeof liabilities.$inferInsert;

export type BudgetCategory = typeof budgetCategories.$inferSelect;
export type NewBudgetCategory = typeof budgetCategories.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type Wishlist = typeof wishlists.$inferSelect;
export type NewWishlist = typeof wishlists.$inferInsert;

export type WishlistAllocation = typeof wishlistAllocations.$inferSelect;
export type NewWishlistAllocation = typeof wishlistAllocations.$inferInsert;

export type CategoryGroup = (typeof categoryGroupEnum.enumValues)[number];
export type TransactionMethod = (typeof transactionMethodEnum.enumValues)[number];
