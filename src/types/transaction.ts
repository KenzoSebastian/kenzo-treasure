/**
 * ==============================================================================
 * Kenzo Treasury — Shared Transaction Types (Fase B9)
 * ==============================================================================
 */

import type { Transaction, NewTransaction, TransactionMethod } from "@/db/schema";

export type { Transaction, NewTransaction, TransactionMethod };

export interface TransactionItem {
  id: string;
  userId: string;
  categoryId: string;
  categoryName?: string;
  categoryIcon?: string | null;
  amount: number;
  date: string;
  description: string;
  method: TransactionMethod;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
