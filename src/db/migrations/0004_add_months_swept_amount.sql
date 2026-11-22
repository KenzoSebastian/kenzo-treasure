-- ==============================================================================
-- Kenzo Treasury — Migration 0004: Add swept_amount to months (SC-02 Reopen Reversal)
-- ==============================================================================
-- Menyimpan nominal yang disapu ke savings_account.balance saat tutup buku
-- untuk mendukung penarikan kembali (reversal) saat siklus bulan dibuka kembali (reopenMonth).

ALTER TABLE "months" ADD COLUMN IF NOT EXISTS "swept_amount" integer DEFAULT 0 NOT NULL;
