import * as z from "zod";

// UserRole type (SQLite doesn't support enums)
const UserRoleValues = ["SUPER_ADMIN", "ORG_ADMIN", "EXPERT", "USER", "ADMIN"] as const;

export const userNameSchema = z.object({
  name: z.string().min(3).max(32),
});

export const userRoleSchema = z.object({
  role: z.enum(UserRoleValues),
});
