import { JwtPayload } from "jsonwebtoken";

import { env } from "../../config";
import { redisClient } from "../../lib/clients";
import {
    DecodedUserToken,
    EncodedToken,
    UserRead,
    UserTokenInput,
} from "../../models/schemas";
import { ApiError, HttpStatus } from "../../types";
import { decodePayload, encodePayload } from "./helpers";

export const decodeToken = (encoded: string): DecodedUserToken => {
    const decoded = decodePayload(encoded);
    if (typeof decoded === "string") {
        throw new ApiError(HttpStatus.BAD_REQUEST, "Invalid token payload");
    }
    return decoded as DecodedUserToken;
};

const _createToken = (user: UserRead): EncodedToken => {
    const payload: UserTokenInput = {
        userId: user.id,
        email: user.email,
    };
    const access_token = encodePayload(payload);
    const decoded = decodePayload(access_token) as JwtPayload;
    return {
        access_token,
        token_type: "bearer",
        email: user.email,
        userId: user.id,
        expires_in: Number(decoded.exp),
    };
};

const createTokenKeygen = (user: UserRead): string => {
    return `create_token_${user.email}`;
};

export const createToken = redisClient.wrap<[UserRead], EncodedToken>(
    _createToken,
    createTokenKeygen,
    env.JWT_EXPIRATION
);
