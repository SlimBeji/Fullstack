import jwt, { JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";
import { env } from "../../config";
import { UserRead, EncodedToken } from "../../models/schemas";
import { crudUser } from "../../models/crud";
import { ApiError, HttpStatus } from "../../types";
import { redisClient } from "../../lib/clients";

export interface UserTokenInput {
    userId: Types.ObjectId;
    email: string;
}

export interface DecodedUserToken extends UserTokenInput, JwtPayload {}

const _createToken = (user: UserRead): EncodedToken => {
    const payload: UserTokenInput = {
        userId: user.id,
        email: user.email,
    };
    const token = jwt.sign(payload, env.SECRET_KEY, {
        expiresIn: env.JWT_EXPIRATION,
    });
    const decoded = jwt.decode(token) as JwtPayload;
    return {
        token,
        email: user.email,
        userId: user.id,
        expiresAt: Number(decoded.exp),
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

export const verifyToken = (token: string): DecodedUserToken => {
    const decoded = jwt.verify(token, env.SECRET_KEY);
    if (typeof decoded === "string") {
        throw new ApiError(HttpStatus.BAD_REQUEST, "Invalid token payload");
    }
    return decoded as DecodedUserToken;
};

export const getUserFromToken = async (token: string): Promise<UserRead> => {
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
