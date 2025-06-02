import { z } from "../../openapi";

import { userNameField, userEmailField, userPasswordField } from "./user";

// Zod Schemas
export const SignupSchema = z.object({
    name: userNameField,
    email: userEmailField,
    password: userPasswordField,
});

export type SignupBodyForm = z.infer<typeof SignupSchema>;

export type SignupForm = SignupBodyForm & {
    imageUrl?: string;
};

export const SigninSchema = z.object({
    email: userEmailField,
    password: userPasswordField,
});

export type SigninForm = z.infer<typeof SigninSchema>;
