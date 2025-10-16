import { env } from "@/config";
import {
    DecodedTokenPayload,
    EncodedToken,
    TokenPayload,
    UserRead,
} from "@/models/schemas";
import { ApiError, HttpStatus } from "@/types";

import { decodePayload, encodePayload } from "./helpers";

export const decodeToken = (encoded: string): DecodedTokenPayload => {
    const decoded = decodePayload(encoded);
    if (typeof decoded === "string") {
        throw new ApiError(HttpStatus.BAD_REQUEST, "Invalid token payload");
    }
    return decoded as DecodedTokenPayload;
};

export const createToken = (user: UserRead): EncodedToken => {
    const payload: TokenPayload = {
        userId: user.id,
        email: user.email,
    };
    const access_token = encodePayload(payload);
    return {
        access_token,
        token_type: "bearer",
        email: user.email,
        userId: user.id,
        expires_in: env.JWT_EXPIRATION,
    };
};
