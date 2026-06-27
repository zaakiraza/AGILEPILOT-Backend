import { z } from "zod";
import { ORG_ROLES } from "../config/roles.js";
import { objectId } from "./auth.validator.js";

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8),
    orgRole: z.enum([ORG_ROLES.ADMIN]).optional(),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z
    .object({
      name: z.string().min(2).max(100).optional(),
      email: z.string().email().optional(),
      password: z.string().min(8).optional(),
      isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided",
    }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});
