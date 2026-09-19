import { z } from "zod";

export const createTaskSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  title: z.string().trim().min(1, "Title is required").max(300),
  description: z.string().trim().max(5000).optional().nullable(),
  statusId: z.string().uuid("Invalid status ID").optional().nullable(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  assigneeId: z.string().uuid("Invalid assignee ID").optional().nullable(),
  assigneeIds: z.array(z.string().uuid("Invalid assignee ID")).optional().default([]),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export const updateTaskSchema = z.object({
  projectId: z.string().uuid("Invalid project ID").optional(),
  title: z.string().trim().min(1, "Title is required").max(300).optional(),
  description: z.string().trim().max(5000).optional().nullable(),
  statusId: z.string().uuid("Invalid status ID").optional().nullable(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assigneeId: z.string().uuid("Invalid assignee ID").optional().nullable(),
  assigneeIds: z.array(z.string().uuid("Invalid assignee ID")).optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
