/**
 * ==============================================================================
 * Kenzo Treasury — Zod Savings & Emergency Fund Vault Schemas (Fase B11 / R10)
 * ==============================================================================
 *
 * Mendefinisikan kontrak validasi mutasi Brankas Dana Darurat (`savings_account`):
 * - Setor dari tabungan bebas ke brankas dana darurat
 * - Tarik dari brankas dana darurat ke tabungan bebas
 * - Pembaruan target dana darurat ideal (`>= 0` agar kompatibel dengan state awal/reset)
 */

import { z } from "zod";

export const transferEmergencyFundSchema = z.object({
  amount: z.coerce
    .number({ message: "Nominal transfer wajib diisi" })
    .int({ message: "Nominal transfer harus berupa integer bulat tanpa desimal" })
    .positive({ message: "Nominal transfer harus lebih besar dari Rp 0" }),
  allowOverTarget: z.boolean().optional().default(false),
});

export const updateEmergencyTargetSchema = z.object({
  targetAmount: z.coerce
    .number({ message: "Target dana darurat wajib diisi" })
    .int({ message: "Target dana darurat harus berupa integer bulat" })
    .min(0, { message: "Target dana darurat tidak boleh bernilai negatif" }),
});

export type TransferEmergencyFundInput = z.infer<typeof transferEmergencyFundSchema>;
export type UpdateEmergencyTargetInput = z.infer<typeof updateEmergencyTargetSchema>;
