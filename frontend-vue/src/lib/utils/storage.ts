import { EncodedUserToken, LocalStorageKeys } from "@/types";

export const getAuthData = (): EncodedUserToken | null => {
    const raw = localStorage.getItem(LocalStorageKeys.userData);
    if (!raw) return null;
    let data: EncodedUserToken;
    try {
        data = JSON.parse(raw);
    } catch {
        localStorage.removeItem(LocalStorageKeys.userData);
        return null;
    }
    if (
        !data.access_token ||
        !(data.token_type === "bearer") ||
        !data.userId ||
        !data.email ||
        !data.expiresAt
    ) {
        localStorage.removeItem(LocalStorageKeys.userData);
        return null;
    }

    if (Date.now() > data.expiresAt * 1000) {
        localStorage.removeItem(LocalStorageKeys.userData);
        return null;
    }
    return data;
};

export const getToken = (): string => {
    const authData = getAuthData();
    if (!authData) return "";
    return `Bearer ${authData.access_token}`;
};
