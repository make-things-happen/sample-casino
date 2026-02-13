import { z } from "zod";

export const conversionSchema = z.discriminatedUnion("conversionType", [
  z.object({
    conversionType: z.literal("registration"),
    clickId: z.string().min(1, "clickId is required"),
    playerId: z.string().min(1, "playerId is required"),
    eventAt: z.number().optional(),
  }),
  z.object({
    conversionType: z.literal("ftd"),
    clickId: z.string().min(1, "clickId is required"),
    transactionId: z.string().min(1, "transactionId is required"),
    amount: z.union([z.number(), z.coerce.number()]),
    playerId: z.string().min(1, "playerId is required"),
    eventAt: z.number().optional(),
  }),
  z.object({
    conversionType: z.literal("revenue"),
    clickId: z.string().min(1, "clickId is required"),
    transactionId: z.string().min(1, "transactionId is required"),
    amount: z.union([z.number(), z.coerce.number()]),
    revenueType: z.enum(["net_revenue", "gross_revenue"]),
    playerId: z.string().min(1, "playerId is required"),
    eventAt: z.number().optional(),
  }),
]);

export type ConversionData = z.infer<typeof conversionSchema>;
