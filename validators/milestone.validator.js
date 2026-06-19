import { z } from "zod";
import { MILESTONE_STATUS_VALUES } from "../config/constants.js";
import { objectId } from "./auth.validator.js";

const projectIdParams = z.object({
  projectId: objectId,
});

export const createMilestoneSchema = z.object({
  params: projectIdParams,
  body: z.object({
    title: z.string().min(1).max(300),
    description: z.string().max(2000).optional(),
    dueDate: z.coerce.date().optional().nullable(),
    status: z.enum(MILESTONE_STATUS_VALUES).optional(),
    order: z.number().int().min(0).optional(),
  }),
});

export const milestoneIdParamSchema = z.object({
  params: projectIdParams.extend({
    milestoneId: objectId,
  }),
});

export const updateMilestoneSchema = z.object({
  params: projectIdParams.extend({
    milestoneId: objectId,
  }),
  body: z
    .object({
      title: z.string().min(1).max(300).optional(),
      description: z.string().max(2000).optional(),
      dueDate: z.coerce.date().optional().nullable(),
      status: z.enum(MILESTONE_STATUS_VALUES).optional(),
      order: z.number().int().min(0).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided",
    }),
});

export const listMilestonesSchema = z.object({
  params: projectIdParams,
});
