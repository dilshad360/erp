import { z } from "zod";

export const tenantSignupSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  subdomain: z.string().min(1, "Subdomain is required"),
});

export const activateEmployeeSchema = z.object({
  role: z.enum(["admin", "manager", "employee"]).default("employee"),
  employeeId: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  designation: z.string().optional().nullable(),
  dateOfJoining: z.string().optional().nullable(),
  reportingManagerId: z.string().uuid().nullable().optional(),
});

export type TenantSignupInput = z.infer<typeof tenantSignupSchema>;
export type ActivateEmployeeInput = z.infer<typeof activateEmployeeSchema>;
