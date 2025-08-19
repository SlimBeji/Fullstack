import { JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";

import {
    userEmailField,
    userIdField,
    userImageField,
    userNameField,
    userPasswordField,
} from "./user";
import { z } from "./zod";

// Fields
export const accessTokenField = z.string().openapi({
    description:
        "A generated web token. The 'Bearer ' prefix needs to be added for authentication",
    example:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODIyNDVhOWY2YTU5ZjVlNjM2Y2NmYjEiLCJlbWFpbCI6ImJlamkuc2xpbUB5YWhvby5mciIsImlhdCI6MTc0NzMzNjUxMCwiZXhwIjoxNzQ3MzQwMTEwfQ.C4DCJKvGWhpHClpqmxHyxKLPYDOZDUlr-LA_2IflTXM",
});

export const tokenTypeField = z.literal("bearer").openapi({
    description: "The type of token. Only 'bearer' is supported.",
    example: "bearer",
});

export const expiresInField = z.number().openapi({
    description: "The UNIX timestamp the token expires at",
    example: 1751879562,
});

// Token Data
export interface UserTokenInput {
    userId: Types.ObjectId;
    email: string;
}

export interface DecodedUserToken extends UserTokenInput, JwtPayload {}

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
    username: userEmailField,
    password: userPasswordField,
});

export type Signin = z.infer<typeof SigninSchema>;

// Response Schemas

export const EncodedTokenSchema = z.object({
    access_token: accessTokenField,
    token_type: tokenTypeField,
    userId: userIdField,
    email: userEmailField,
    expires_in: expiresInField,
});

export type EncodedToken = z.infer<typeof EncodedTokenSchema>;
