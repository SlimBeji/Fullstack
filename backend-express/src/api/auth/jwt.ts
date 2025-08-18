import { decodeToken } from "../../lib/encryption";
import { crudUser } from "../../models/crud";
import { UserRead } from "../../models/schemas";
import { ApiError, HttpStatus } from "../../types";

export const getUserFromToken = async (token: string): Promise<UserRead> => {
    const payload = decodeToken(token);
    const user = await crudUser.get(payload.userId);
    if (!user) {
        throw new ApiError(HttpStatus.NOT_FOUND, "User not found");
    }
    if (user.email !== payload.email) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            "Invalid token, payload corrupted"
        );
    }
    return user;
};
