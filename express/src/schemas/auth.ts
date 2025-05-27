import { z } from "zod";

export const SignupSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    imageUrl: z.string().url().optional(),
});

export type SignupForm = z.infer<typeof SignupSchema>;

export const SigninSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export type SigninForm = z.infer<typeof SigninSchema>;
