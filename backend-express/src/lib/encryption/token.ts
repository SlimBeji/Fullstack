import { env } from "../../config";
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

export const createToken = (user: UserRead): EncodedToken => {
    const payload: UserTokenInput = {
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
