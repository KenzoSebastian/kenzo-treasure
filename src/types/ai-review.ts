/**
 * ==============================================================================
 * Kenzo Treasury — Shared AI Monthly Review & Export Types (Fase B13)
 * ==============================================================================
 */

export interface CategoryReviewHighlight {
  name: string;
  icon: string;
  targetBudget: number;
  spentAmount: number;
  varianceAmount: number;
  usagePercent: number;
}

export interface MonthlyAiReview {
  monthId: string;
  monthName: string;
  disciplineScore: number;
  statusLabel: string;
  totalIncome: number;
  totalSpent: number;
  netSavings: number;
  savingsRate: number;
  mostFrugalCategory: CategoryReviewHighlight | null;
  mostOverspentCategory: CategoryReviewHighlight | null;
  executiveSummary: string;
  tacticalRecommendations: string[];
  nextMonthAllocationAdvice: string[];
  generatedBy: "gemini" | "deterministic-engine";
  modelUsed: string;
  generatedAt: string;
}

export type ExportFormat = "csv" | "json" | "excel";

export interface ExportFilePayload {
  filename: string;
  mimeType: string;
  content: string;
  recordCount: number;
  exportedAt: string;
}
