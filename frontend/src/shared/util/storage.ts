import { LocalStorageKeys, EncodedUserToken } from "../types";

export const getAuthData = (): EncodedUserToken | null => {
    const error = new Error("LocalStorage corrupted");
    const raw = localStorage.getItem(LocalStorageKeys.userData);
    if (!raw) return null;
    let data: EncodedUserToken;
    try {
        data = JSON.parse(raw);
    } catch {
        throw error;
    }
    if (!data.email || !data.userId || !data.token) {
        throw error;
    }
    return data;
};

export const getToken = (): string => {
    const authData = getAuthData();
    if (!authData) return "";
    return `Bearer ${authData.token}`;
};
