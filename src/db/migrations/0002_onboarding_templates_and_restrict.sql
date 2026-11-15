CREATE TABLE "user_budget_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"icon" text DEFAULT 'wallet' NOT NULL,
	"group" "category_group" NOT NULL,
	"target_budget" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_category_id_budget_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "budget_categories" ALTER COLUMN "icon" SET DEFAULT 'wallet';--> statement-breakpoint
ALTER TABLE "savings_account" ALTER COLUMN "emergency_fund_target" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "wishlists" ALTER COLUMN "icon" SET DEFAULT 'target';--> statement-breakpoint
ALTER TABLE "liabilities" ADD COLUMN "icon" text DEFAULT 'credit-card' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "default_base_salary" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_completed_at" timestamp with time zone;--> statement-breakpoint
UPDATE "users" SET "onboarding_completed_at" = NOW() WHERE "onboarding_completed_at" IS NULL;--> statement-breakpoint
ALTER TABLE "user_budget_templates" ADD CONSTRAINT "user_budget_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_budget_templates_user_id_idx" ON "user_budget_templates" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_budget_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."budget_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "months" ADD CONSTRAINT "months_user_year_month_unique" UNIQUE("user_id","year","month_index");--> statement-breakpoint
ALTER TABLE "public"."user_budget_templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "user_budget_templates_manage_own" ON "public"."user_budget_templates";--> statement-breakpoint
CREATE POLICY "user_budget_templates_manage_own" ON "public"."user_budget_templates"
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
