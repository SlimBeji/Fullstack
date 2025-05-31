import jwt, { JwtPayload } from "jsonwebtoken";

import config from "../../config";
import { User } from "../../models/schemas";
import { crudUser } from "../../models/crud";
import { ApiError, HttpStatus } from "../../types";

export interface UserTokenInput {
    userId: string;
    email: string;
}

export interface EncodedUserToken {
    userId: string;
    email: string;
    token: string;
}

export interface DecodedUserToken extends UserTokenInput, JwtPayload {}

export const createToken = (user: User): EncodedUserToken => {
    const payload: UserTokenInput = {
        userId: user.id,
        email: user.email,
    };
    const token = jwt.sign(payload, config.SECRET_KEY, {
        expiresIn: config.JWT_EXPIRATION,
    });
    return { token, email: user.email, userId: user.id };
};

export const verifyToken = (token: string): DecodedUserToken => {
    const decoded = jwt.verify(token, config.SECRET_KEY);
    if (typeof decoded === "string") {
        throw new ApiError(HttpStatus.BAD_REQUEST, "Invalid token payload");
    }
    return decoded as DecodedUserToken;
};

export const getUserFromToken = async (token: string): Promise<User> => {
    const payload = verifyToken(token);
    const user = await crudUser.get(payload.userId);
    if (!user) {
        throw new ApiError(HttpStatus.BAD_REQUEST, "Invalid token payload");
    }
    if (user.email !== payload.email) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            "Invalid token, payload corrupted"
        );
    }
    return user;
};
