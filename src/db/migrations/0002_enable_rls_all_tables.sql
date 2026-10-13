-- ==============================================================================
-- Kenzo Treasury — Migration 0002: Enable Row Level Security (RLS) on All Tables
-- ==============================================================================

-- 1. Enable Row Level Security (RLS) on all 9 public tables
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."savings_account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."months" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."incomes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."liabilities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."budget_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."wishlists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."wishlist_allocations" ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if any to prevent duplicate definition errors
DROP POLICY IF EXISTS "users_manage_own_profile" ON "public"."users";
DROP POLICY IF EXISTS "savings_account_manage_own" ON "public"."savings_account";
DROP POLICY IF EXISTS "months_manage_own" ON "public"."months";
DROP POLICY IF EXISTS "incomes_manage_own" ON "public"."incomes";
DROP POLICY IF EXISTS "liabilities_manage_own" ON "public"."liabilities";
DROP POLICY IF EXISTS "budget_categories_manage_own" ON "public"."budget_categories";
DROP POLICY IF EXISTS "transactions_manage_own" ON "public"."transactions";
DROP POLICY IF EXISTS "wishlists_manage_own" ON "public"."wishlists";
DROP POLICY IF EXISTS "wishlist_allocations_manage_own" ON "public"."wishlist_allocations";

-- 3. Create RLS Policies for authenticated users with cached (select auth.uid())

-- users: ID mirrors auth.users.id
CREATE POLICY "users_manage_own_profile" ON "public"."users"
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- savings_account
CREATE POLICY "savings_account_manage_own" ON "public"."savings_account"
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- months
CREATE POLICY "months_manage_own" ON "public"."months"
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- incomes
CREATE POLICY "incomes_manage_own" ON "public"."incomes"
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- liabilities
CREATE POLICY "liabilities_manage_own" ON "public"."liabilities"
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- budget_categories (linked via months.month_id)
CREATE POLICY "budget_categories_manage_own" ON "public"."budget_categories"
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "public"."months"
      WHERE "public"."months"."id" = "public"."budget_categories"."month_id"
        AND "public"."months"."user_id" = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."months"
      WHERE "public"."months"."id" = "public"."budget_categories"."month_id"
        AND "public"."months"."user_id" = (select auth.uid())
    )
  );

-- transactions
CREATE POLICY "transactions_manage_own" ON "public"."transactions"
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- wishlists
CREATE POLICY "wishlists_manage_own" ON "public"."wishlists"
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- wishlist_allocations
CREATE POLICY "wishlist_allocations_manage_own" ON "public"."wishlist_allocations"
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
