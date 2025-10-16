import { compare, hash } from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";

import { env } from "@/config";

const DEFAULT_HASH_SALT = 12;

export const hashInput = async (input: string): Promise<string> => {
    return await hash(input, DEFAULT_HASH_SALT);
};

export const verifyHash = async (
    plain: string,
    hashed: string
): Promise<boolean> => {
    return await compare(plain, hashed);
};

export const encodePayload = (
    payload: any,
    expiration: number = env.JWT_EXPIRATION
): string => {
    return jwt.sign(payload, env.SECRET_KEY, { expiresIn: expiration });
};

export const decodePayload = (encoded: string): JwtPayload | string => {
    return jwt.verify(encoded, env.SECRET_KEY);
};
