import { compare, hash } from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";

export const hashInput = async (
    input: string,
    salt: number
): Promise<string> => {
    return await hash(input, salt);
};

export const verifyHash = async (
    plain: string,
    hashed: string
): Promise<boolean> => {
    return await compare(plain, hashed);
};

export const encodePayload = (
    payload: any,
    secret: string,
    expiration: number
): string => {
    return jwt.sign(payload, secret, { expiresIn: expiration });
};

export const decodePayload = (
    encoded: string,
    secret: string
): JwtPayload | string => {
    return jwt.verify(encoded, secret);
};
