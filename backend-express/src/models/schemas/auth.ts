import { JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";

import { env } from "@/config/env";
import { ApiError, HttpStatus } from "@/lib/express";
import { decodePayload, encodePayload } from "@/lib/utils";
import { zod, ZodInfer } from "@/lib/zod";

import { AuthFields, UserFields } from "../fields";
import { UserRead } from "./user";

// --- Access Token ----
export interface TokenPayload {
    userId: Types.ObjectId;
    email: string;
}

export interface DecodedTokenPayload extends TokenPayload, JwtPayload {}

export const decodeToken = (encoded: string): DecodedTokenPayload => {
    const decoded = decodePayload(encoded, env.SECRET_KEY);
    if (typeof decoded === "string") {
        throw new ApiError(HttpStatus.BAD_REQUEST, "Invalid token payload");
    }
    return decoded as DecodedTokenPayload;
};

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

// --- Response Schemas ---

export const EncodedTokenSchema = zod.object({
    access_token: AuthFields.accessToken,
    token_type: AuthFields.tokenType,
    userId: UserFields.id,
    email: UserFields.email,
    expires_in: AuthFields.expiresIn,
});

export type EncodedToken = ZodInfer<typeof EncodedTokenSchema>;

export const createToken = (user: UserRead): EncodedToken => {
    const payload: TokenPayload = {
        userId: user.id,
        email: user.email,
    };
    const access_token = encodePayload(
        payload,
        env.SECRET_KEY,
        env.JWT_EXPIRATION
    );
    return {
        access_token,
        token_type: "bearer",
        email: user.email,
        userId: user.id,
        expires_in: env.JWT_EXPIRATION,
    };
};
