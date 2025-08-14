import { compare, hash } from "bcryptjs";

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
