import jwt, { JwtPayload } from "jsonwebtoken";

import { SECRET_KEY, JWT_EXPIRATION } from "../config";
import { User } from "../schemas";
import { crudUser } from "../models";
import { ApiError, HttpStatus } from "../framework";

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
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: JWT_EXPIRATION });
    return { token, email: user.email, userId: user.id };
};

export const verifyToken = (token: string): DecodedUserToken => {
    const decoded = jwt.verify(token, SECRET_KEY);
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
