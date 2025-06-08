import jwt, { JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";
import config from "../../config";
import { UserRead, EncodedToken } from "../../models/schemas";
import { crudUser } from "../../models/crud";
import { ApiError, HttpStatus } from "../../types";

export interface UserTokenInput {
    userId: Types.ObjectId;
    email: string;
}

export interface DecodedUserToken extends UserTokenInput, JwtPayload {}

export const createToken = (user: UserRead): EncodedToken => {
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

export const getUserFromToken = async (token: string): Promise<UserRead> => {
    const payload = verifyToken(token);
    const user = await crudUser.getById(payload.userId);
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
