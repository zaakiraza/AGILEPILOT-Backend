import { z } from "zod";
import { ESTIMATE_LINE_CATEGORY_VALUES } from "../config/constants.js";
import { objectId } from "./auth.validator.js";

const projectIdParams = z.object({
  projectId: objectId,
});

const lineItemSchema = z.object({
  category: z.enum(ESTIMATE_LINE_CATEGORY_VALUES),
  description: z.string().min(1).max(500),
  quantity: z.number().min(0),
  unitCost: z.number().min(0),
  amount: z.number().min(0).optional(),
});

export const upsertEstimateSchema = z.object({
  params: projectIdParams,
  body: z.object({
    currency: z.string().length(3).optional(),
    lineItems: z.array(lineItemSchema).optional(),
    contingencyPercent: z.number().min(0).max(100).optional(),
    notes: z.string().max(2000).optional(),
  }),
});

export const estimateProjectParamSchema = z.object({
  params: projectIdParams,
});
