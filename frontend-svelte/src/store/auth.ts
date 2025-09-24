import { derived, writable } from "svelte/store";
import { push } from "svelte-spa-router";

import type { EncodedUserToken, SigninResponse } from "../types";
import { LocalStorageKeys } from "../types";

const data = writable<EncodedUserToken | undefined>(undefined);
const isLoggedIn = derived(data, ($data) => !!$data?.userId);
const userId = derived(data, ($data) => $data?.userId);

function setAuthData(payload: EncodedUserToken) {
    data.set(payload);
}

function login(payload: SigninResponse) {
    const { expires_in, ...rest } = payload;
    const expiresAt = Math.floor(Date.now() / 1000) + expires_in;
    const token: EncodedUserToken = { ...rest, expiresAt };
    data.set({ ...rest, expiresAt });
    localStorage.setItem(LocalStorageKeys.userData, JSON.stringify(token));
    push("/");
}

function logout() {
    data.set(undefined);
    localStorage.removeItem(LocalStorageKeys.userData);
    push("/logout");
}

export const authStore = {
    isLoggedIn,
    userId,
    setAuthData,
    login,
    logout,
};
