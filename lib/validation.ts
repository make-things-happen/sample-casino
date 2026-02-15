import { z } from "zod";

export const registrationSchema = z.object({
  clickId: z.string().uuid(),
  playerId: z.string().min(1, "playerId is required"),
  eventAt: z.number().optional(),
});

export const ftdSchema = z.object({
  clickId: z.string().uuid(),
  transactionId: z.string().min(1, "transactionId is required"),
  amount: z.number(),
  playerId: z.string().min(1, "playerId is required"),
  eventAt: z.number().optional(),
});

export const revenueSchema = z.object({
  clickId: z.string().uuid(),
  transactionId: z.string().min(1, "transactionId is required"),
  amount: z.number(),
  revenueType: z.enum(["net_revenue", "gross_revenue"]),
  playerId: z.string().min(1, "playerId is required"),
  eventAt: z.number().optional(),
});

export const reversalSchema = z.object({
  txId: z.string().min(1, "txId is required"),
});

export const conversionSchema = z.discriminatedUnion("conversionType", [
  registrationSchema.extend({ conversionType: z.literal("registration") }),
  ftdSchema.extend({ conversionType: z.literal("ftd") }),
  revenueSchema.extend({ conversionType: z.literal("revenue") }),
]);

export type RegistrationData = z.infer<typeof registrationSchema>;
export type FtdData = z.infer<typeof ftdSchema>;
export type RevenueData = z.infer<typeof revenueSchema>;
export type ReversalData = z.infer<typeof reversalSchema>;
export type ConversionData = z.infer<typeof conversionSchema>;
