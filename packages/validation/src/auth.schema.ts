import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  organizationSlug: z.string().trim().optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterUserSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  phone: z.string().trim().optional(),
});

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;
