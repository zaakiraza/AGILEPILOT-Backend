import { z } from "zod";
import { TASK_PRIORITY_VALUES, TASK_STATUS_VALUES } from "../config/constants.js";
import { objectId } from "./auth.validator.js";

const projectIdParams = z.object({
  projectId: objectId,
});

export const createTaskSchema = z.object({
  params: projectIdParams,
  body: z.object({
    milestoneId: objectId,
    title: z.string().min(1).max(300),
    description: z.string().max(5000).optional(),
    status: z.enum(TASK_STATUS_VALUES).optional(),
    priority: z.enum(TASK_PRIORITY_VALUES).optional(),
    assigneeId: objectId.optional(),
    estimatedHours: z.number().min(0).optional(),
    actualHours: z.number().min(0).optional(),
    hourlyRate: z.number().min(0).optional(),
    parentTaskId: objectId.optional(),
    dependsOn: z.array(objectId).optional(),
    order: z.number().int().min(0).optional(),
  }),
});

export const listTasksSchema = z.object({
  params: projectIdParams,
  query: z.object({
    milestoneId: objectId.optional(),
  }),
});

export const taskIdParamSchema = z.object({
  params: projectIdParams.extend({
    taskId: objectId,
  }),
});

export const updateTaskSchema = z.object({
  params: projectIdParams.extend({
    taskId: objectId,
  }),
  body: z
    .object({
      milestoneId: objectId.optional(),
      title: z.string().min(1).max(300).optional(),
      description: z.string().max(5000).optional(),
      status: z.enum(TASK_STATUS_VALUES).optional(),
      priority: z.enum(TASK_PRIORITY_VALUES).optional(),
      assigneeId: objectId.optional().nullable(),
      estimatedHours: z.number().min(0).optional(),
      actualHours: z.number().min(0).optional(),
      hourlyRate: z.number().min(0).optional(),
      parentTaskId: objectId.optional().nullable(),
      dependsOn: z.array(objectId).optional(),
      order: z.number().int().min(0).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided",
    }),
});

export const createCommentSchema = z.object({
  params: projectIdParams.extend({
    taskId: objectId,
  }),
  body: z.object({
    text: z.string().min(1).max(2000),
  }),
});

export const listCommentsSchema = taskIdParamSchema;
