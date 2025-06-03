import { z } from "../../openapi";

import {
    userNameField,
    userEmailField,
    userPasswordField,
    userIdField,
} from "./user";

// Fields
export const tokenField = z.string().openapi({
    description:
        "A generated web token. The 'Bearer ' prefix needs to be added for authentication",
    example:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODIyNDVhOWY2YTU5ZjVlNjM2Y2NmYjEiLCJlbWFpbCI6ImJlamkuc2xpbUB5YWhvby5mciIsImlhdCI6MTc0NzMzNjUxMCwiZXhwIjoxNzQ3MzQwMTEwfQ.C4DCJKvGWhpHClpqmxHyxKLPYDOZDUlr-LA_2IflTXM",
});

// Signup Schemas
export const SignupSchema = z.object({
    name: userNameField,
    email: userEmailField,
    password: userPasswordField,
});

export type SignupBodyForm = z.infer<typeof SignupSchema>;

export type SignupForm = SignupBodyForm & {
    imageUrl?: string;
};

// Signin Schemas
export const SigninSchema = z.object({
    email: userEmailField,
    password: userPasswordField,
});

export type SigninForm = z.infer<typeof SigninSchema>;

export const EncodedTokenSchema = z.object({
    userId: userIdField,
    email: userEmailField,
    token: tokenField,
});

export type EncodedToken = z.infer<typeof EncodedTokenSchema>;
