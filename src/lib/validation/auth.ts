import { z } from "zod";

export const loginInputSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Enter your username.")
    .max(64, "Username is too long.")
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Enter your password.").max(128, "Password is too long."),
});

export type LoginInput = z.infer<typeof loginInputSchema>;
