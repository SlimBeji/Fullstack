import { goto } from "@mateothegreat/svelte5-router";
import { derived, writable } from "svelte/store";

import { AppRoute } from "@/router";
import { deleteAuthData, setAuthData as setAuthSorageData } from "@/storage";
import type { EncodedUserToken, SigninResponse } from "@/types";

const data = writable<EncodedUserToken | undefined>(undefined);
const isLoggedIn = derived(data, ($data) => !!$data?.user_id);
const userId = derived(data, ($data) => $data?.user_id);

function setAuthData(payload: EncodedUserToken) {
    data.set(payload);
}

function login(payload: SigninResponse) {
    const { expires_in, ...rest } = payload;
    const expires_at = Math.floor(Date.now() / 1000) + expires_in;
    const token: EncodedUserToken = { ...rest, expires_at };
    data.set({ ...rest, expires_at });
    setAuthSorageData(token);
    goto(AppRoute.HOME);
}

function logout() {
    data.set(undefined);
    deleteAuthData();
    goto(AppRoute.AUTH);
}

export const authStore = {
    isLoggedIn,
    userId,
    setAuthData,
    login,
    logout,
};
