import { JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";

import z from "@/zodExt";

import { AuthFields, UserFields } from "../fields";

// --- Token ----
export interface TokenPayload {
    userId: Types.ObjectId;
    email: string;
}

export interface DecodedTokenPayload extends TokenPayload, JwtPayload {}

// --- Signup Schemas ----
export const SignupSchema = z.object({
    name: UserFields.name,
    email: UserFields.email,
    password: UserFields.password,
    image: UserFields.image.optional(),
});

export type Signup = z.infer<typeof SignupSchema>;

// --- Signin Schemas ----
export const SigninSchema = z.object({
    username: AuthFields.username,
    password: UserFields.password,
});

export type Signin = z.infer<typeof SigninSchema>;

// Response Schemas

export const EncodedTokenSchema = z.object({
    access_token: AuthFields.accessToken,
    token_type: AuthFields.tokenType,
    userId: UserFields.id,
    email: UserFields.email,
    expires_in: AuthFields.expiresIn,
});

export type EncodedToken = z.infer<typeof EncodedTokenSchema>;
