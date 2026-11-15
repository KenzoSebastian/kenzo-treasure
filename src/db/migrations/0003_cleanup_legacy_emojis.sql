-- ==============================================================================
-- Kenzo Treasury — Migration 0003: Idempotent Legacy Emoji Cleanup (Fase R1)
-- ==============================================================================
-- Membersihkan nilai kolom `icon` dan awalan emoji pada kolom `name`/`source`
-- di tabel `budget_categories`, `liabilities`, `wishlists`, dan `incomes`.

UPDATE "budget_categories"
SET "icon" = CASE
  WHEN "icon" IN ('✝️', '✝') THEN 'heart-handshake'
  WHEN "icon" = '📱' THEN 'smartphone'
  WHEN "icon" IN ('👩‍👦', '👵') THEN 'users'
  WHEN "icon" = '⚡' THEN 'zap'
  WHEN "icon" = '⛽' THEN 'fuel'
  WHEN "icon" = '🍿' THEN 'wallet'
  WHEN "icon" IN ('💵', '💸', '💰') THEN 'banknote'
  WHEN "icon" IN ('🎯', '🏆', '🥇', '🥈') THEN 'target'
  WHEN "icon" IN ('📦', '📁') THEN 'package'
  WHEN "icon" = '💳' THEN 'credit-card'
  WHEN "icon" = '📷' THEN 'camera'
  WHEN "icon" IN ('🖥️', '🖥', '💻') THEN 'monitor'
  WHEN "icon" = '🍔' THEN 'utensils'
  WHEN "icon" = '🚗' THEN 'car'
  WHEN "icon" = '🏠' THEN 'home'
  WHEN "icon" IN ('🛡️', '🛡') THEN 'shield-check'
  WHEN "icon" IN ('🎉', '🎁') THEN 'gift'
  WHEN "icon" IN (
    'wallet','banknote','credit-card','piggy-bank','landmark','receipt',
    'heart-handshake','shield-check','zap','home','wifi','smartphone',
    'camera','monitor','wrench','fuel','car','utensils','coffee',
    'shopping-bag','users','gift','target','package'
  ) THEN "icon"
  ELSE 'wallet'
END;
--> statement-breakpoint

UPDATE "wishlists"
SET "icon" = CASE
  WHEN "icon" = '📷' THEN 'camera'
  WHEN "icon" IN ('🖥️', '🖥', '💻') THEN 'monitor'
  WHEN "icon" = '📱' THEN 'smartphone'
  WHEN "icon" = '🚗' THEN 'car'
  WHEN "icon" = '🏠' THEN 'home'
  WHEN "icon" IN (
    'wallet','banknote','credit-card','piggy-bank','landmark','receipt',
    'heart-handshake','shield-check','zap','home','wifi','smartphone',
    'camera','monitor','wrench','fuel','car','utensils','coffee',
    'shopping-bag','users','gift','target','package'
  ) THEN "icon"
  ELSE 'target'
END;
--> statement-breakpoint

UPDATE "budget_categories"
SET "name" = BTRIM(REGEXP_REPLACE("name", '^[^[:alnum:]]+', ''));
--> statement-breakpoint

UPDATE "liabilities"
SET "name" = BTRIM(REGEXP_REPLACE("name", '^[^[:alnum:]]+', ''));
--> statement-breakpoint

UPDATE "wishlists"
SET "name" = BTRIM(REGEXP_REPLACE("name", '^[^[:alnum:]]+', ''));
--> statement-breakpoint

UPDATE "incomes"
SET "source" = BTRIM(REGEXP_REPLACE("source", '^[^[:alnum:]]+', ''));
