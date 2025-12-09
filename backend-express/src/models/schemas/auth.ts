import { JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";

import { zod, ZodInfer } from "@/lib/zod";

import { AuthFields, UserFields } from "../fields";

// --- Token ----
export interface TokenPayload {
    userId: Types.ObjectId;
    email: string;
}

export interface DecodedTokenPayload extends TokenPayload, JwtPayload {}

// --- Signup Schemas ----
export const SignupSchema = zod.object({
    name: UserFields.name,
    email: UserFields.email,
    password: UserFields.password,
    image: UserFields.image.optional(),
});

export type Signup = ZodInfer<typeof SignupSchema>;

// --- Signin Schemas ----
export const SigninSchema = zod.object({
    username: AuthFields.username,
    password: UserFields.password,
});

export type Signin = ZodInfer<typeof SigninSchema>;

// Response Schemas

export const EncodedTokenSchema = zod.object({
    access_token: AuthFields.accessToken,
    token_type: AuthFields.tokenType,
    userId: UserFields.id,
    email: UserFields.email,
    expires_in: AuthFields.expiresIn,
});

export type EncodedToken = ZodInfer<typeof EncodedTokenSchema>;
