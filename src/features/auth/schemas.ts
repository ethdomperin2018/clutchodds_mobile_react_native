import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    email: z.email("Enter a valid email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[0-9]/, "Password must include at least 1 number.")
      .regex(/[A-Z]/, "Password must include at least 1 uppercase letter."),
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;

export function getPasswordChecks(password: string) {
  return {
    minLength: password.length >= 8,
    hasNumber: /[0-9]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
  };
}
