import type { EncodedUserToken } from '@/types';

enum LocalStorageKeys {
    userData = 'userData',
}

export const setAuthData = (data: EncodedUserToken) => {
    localStorage.setItem(LocalStorageKeys.userData, JSON.stringify(data));
};

export const deleteAuthData = () => {
    localStorage.removeItem(LocalStorageKeys.userData);
};

export const getAuthData = (): EncodedUserToken | null => {
    const raw = localStorage.getItem(LocalStorageKeys.userData);
    if (!raw) return null;
    let data: EncodedUserToken;
    try {
        data = JSON.parse(raw);
    } catch {
        deleteAuthData();
        return null;
    }
    if (
        !data.access_token ||
        !(data.token_type === 'bearer') ||
        !data.user_id ||
        !data.email ||
        !data.expires_at
    ) {
        deleteAuthData();
        return null;
    }

    if (Date.now() > data.expires_at * 1000) {
        deleteAuthData();
        return null;
    }
    return data;
};

export const getToken = (): string => {
    const authData = getAuthData();
    if (!authData) return '';
    return `Bearer ${authData.access_token}`;
};
