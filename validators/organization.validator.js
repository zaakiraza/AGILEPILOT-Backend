import { z } from "zod";

export const createOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(200),
    slug: z
      .string()
      .min(2)
      .max(100)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
      .optional(),
    defaultCurrency: z.string().length(3).optional(),
  }),
});
