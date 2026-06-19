import { z } from "zod";
import { ESTIMATE_LINE_CATEGORY_VALUES } from "../config/constants.js";
import { objectId } from "./auth.validator.js";

const projectIdParams = z.object({
  projectId: objectId,
});

export const upsertBudgetSchema = z.object({
  params: projectIdParams,
  body: z.object({
    allocatedAmount: z.number().min(0),
    currency: z.string().length(3).optional(),
  }),
});

export const addExpenseSchema = z.object({
  params: projectIdParams,
  body: z.object({
    date: z.coerce.date(),
    category: z.enum(ESTIMATE_LINE_CATEGORY_VALUES),
    amount: z.number().min(0),
    description: z.string().max(500).optional(),
  }),
});

export const expenseIdParamSchema = z.object({
  params: projectIdParams.extend({
    expenseId: objectId,
  }),
});

export const budgetProjectParamSchema = z.object({
  params: projectIdParams,
});
