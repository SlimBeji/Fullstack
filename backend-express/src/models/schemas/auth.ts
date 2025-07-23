import { z } from "./zod";

import {
    userNameField,
    userEmailField,
    userPasswordField,
    userIdField,
    userImageField,
} from "./user";

// Fields
export const tokenField = z.string().openapi({
    description:
        "A generated web token. The 'Bearer ' prefix needs to be added for authentication",
    example:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODIyNDVhOWY2YTU5ZjVlNjM2Y2NmYjEiLCJlbWFpbCI6ImJlamkuc2xpbUB5YWhvby5mciIsImlhdCI6MTc0NzMzNjUxMCwiZXhwIjoxNzQ3MzQwMTEwfQ.C4DCJKvGWhpHClpqmxHyxKLPYDOZDUlr-LA_2IflTXM",
});

export const expiresAtField = z.number().openapi({
    description: "The UNIX timestamp the token expires at",
    example: 1751879562,
});

// Signup Schemas
export const SignupSchema = z.object({
    name: userNameField,
    email: userEmailField,
    password: userPasswordField,
    image: userImageField.optional(),
});

export type Signup = z.infer<typeof SignupSchema>;

// Signin Schemas
export const SigninSchema = z.object({
    email: userEmailField,
    password: userPasswordField,
});

export type Signin = z.infer<typeof SigninSchema>;

// Response Schemas

export const EncodedTokenSchema = z.object({
    userId: userIdField,
    email: userEmailField,
    token: tokenField,
    expiresAt: expiresAtField,
});

export type EncodedToken = z.infer<typeof EncodedTokenSchema>;
