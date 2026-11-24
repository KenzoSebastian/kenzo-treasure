CREATE TABLE IF NOT EXISTS "savings_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"snapshot_date" date NOT NULL,
	"free_savings_balance" integer DEFAULT 0 NOT NULL,
	"emergency_fund_balance" integer DEFAULT 0 NOT NULL,
	"total_balance" integer DEFAULT 0 NOT NULL,
	"delta_amount" integer DEFAULT 0 NOT NULL,
	"source_event" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "months" ADD COLUMN IF NOT EXISTS "swept_amount" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "savings_snapshots" ADD CONSTRAINT "savings_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "savings_snapshots_user_date_idx" ON "savings_snapshots" USING btree ("user_id","snapshot_date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "savings_snapshots_user_created_idx" ON "savings_snapshots" USING btree ("user_id","created_at");
--> statement-breakpoint
ALTER TABLE "public"."savings_snapshots" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "savings_snapshots_manage_own" ON "public"."savings_snapshots";
--> statement-breakpoint
CREATE POLICY "savings_snapshots_manage_own" ON "public"."savings_snapshots"
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
