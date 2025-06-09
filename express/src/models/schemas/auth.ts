import { FileToUpload } from "../../types";
import { z } from "../../zod";

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

// Signup Schemas
export const SignupBodySchema = z.object({
    name: userNameField,
    email: userEmailField,
    password: userPasswordField,
});

export type SignupBody = z.infer<typeof SignupBodySchema>;

export const SignupMultipartSchema = SignupBodySchema.extend({
    image: userImageField.optional(),
});

export type SignupMultipart = Omit<
    z.infer<typeof SignupMultipartSchema>,
    "image"
> & {
    image?: FileToUpload;
};

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
});

export type EncodedToken = z.infer<typeof EncodedTokenSchema>;
