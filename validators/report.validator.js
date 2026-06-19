import { z } from "zod";
import { objectId } from "./auth.validator.js";

const projectIdParams = z.object({
  projectId: objectId,
});

export const createReportSchema = z.object({
  params: projectIdParams,
  body: z
    .object({
      periodStart: z.coerce.date(),
      periodEnd: z.coerce.date(),
      manualNotes: z.string().max(5000).optional(),
      milestoneId: objectId.optional(),
      taskId: objectId.optional(),
    })
    .refine((data) => !(data.milestoneId && data.taskId), {
      message: "Provide either milestoneId or taskId, not both",
    }),
});

export const reportIdParamSchema = z.object({
  params: projectIdParams.extend({
    reportId: objectId,
  }),
});

export const listReportsSchema = z.object({
  params: projectIdParams,
});

export const exportReportSchema = z.object({
  params: projectIdParams.extend({
    reportId: objectId,
  }),
  query: z.object({
    format: z.enum(["pdf", "excel"]),
  }),
});
