import { z } from "zod";
import { PROJECT_STATUS_VALUES } from "../config/constants.js";
import { objectId } from "./auth.validator.js";

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(200),
    description: z.string().max(2000).optional(),
    status: z.enum(PROJECT_STATUS_VALUES).optional(),
    currency: z.string().length(3),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    projectManagerId: objectId,
  }),
});

export const updateProjectSchema = z.object({
  params: z.object({
    projectId: objectId,
  }),
  body: z
    .object({
      name: z.string().min(2).max(200).optional(),
      description: z.string().max(2000).optional(),
      status: z.enum(PROJECT_STATUS_VALUES).optional(),
      currency: z.string().length(3).optional(),
      startDate: z.coerce.date().optional().nullable(),
      endDate: z.coerce.date().optional().nullable(),
      projectManagerId: objectId.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided",
    }),
});

export const projectIdParamSchema = z.object({
  params: z.object({
    projectId: objectId,
  }),
});

export const changeManagerSchema = z.object({
  params: z.object({
    projectId: objectId,
  }),
  body: z.object({
    projectManagerId: objectId,
  }),
});

export const addMemberSchema = z.object({
  params: z.object({
    projectId: objectId,
  }),
  body: z.object({
    userId: objectId,
  }),
});

export const memberUserIdParamSchema = z.object({
  params: z.object({
    projectId: objectId,
    userId: objectId,
  }),
});
