import { JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";

import { env } from "@/config";
import { ApiError, HttpStatus } from "@/lib/express_";
import { decodePayload, encodePayload } from "@/lib/utils";
import { zod, ZodInfer } from "@/lib/zod_";

import { UserFields } from "./user";

// --- Fields ----

const username = zod.string().email().openapi({
    description: "The user email (We use username here because of OAuth spec)",
    example: "mslimbeji@gmail.com",
});

const accessToken = zod.string().openapi({
    description:
        "A generated web token. The 'Bearer ' prefix needs to be added for authentication",
    example:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODIyNDVhOWY2YTU5ZjVlNjM2Y2NmYjEiLCJlbWFpbCI6ImJlamkuc2xpbUB5YWhvby5mciIsImlhdCI6MTc0NzMzNjUxMCwiZXhwIjoxNzQ3MzQwMTEwfQ.C4DCJKvGWhpHClpqmxHyxKLPYDOZDUlr-LA_2IflTXM",
});

const tokenType = zod.literal("bearer").openapi({
    description: "The type of token. Only 'bearer' is supported.",
    example: "bearer",
});

const expiresIn = zod.number().openapi({
    description: "The UNIX timestamp the token expires at",
    example: 1751879562,
});

export const AuthFields = { username, accessToken, tokenType, expiresIn };

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

export const createToken = (
    userId: Types.ObjectId,
    email: string
): EncodedToken => {
    const payload: TokenPayload = {
        userId: userId,
        email: email,
    };
    const access_token = encodePayload(
        payload,
        env.SECRET_KEY,
        env.JWT_EXPIRATION
    );
    return {
        access_token,
        token_type: "bearer",
        email: email,
        userId: userId,
        expires_in: env.JWT_EXPIRATION,
    };
};
