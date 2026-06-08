import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { AppRoute, router } from "@/router";
import { deleteAuthData, setAuthData as setAuthStorageData } from "@/storage";
import type { EncodedUserToken, SigninResponse } from "@/types";

export const useAuthStore = defineStore("auth", () => {
    const data = ref<EncodedUserToken | undefined>(undefined);

    const isLoggedIn = computed(() => !!data.value?.user_id);
    const userId = computed(() => data.value?.user_id);

    function setAuthData(payload: EncodedUserToken) {
        data.value = payload;
    }

    function login(payload: SigninResponse) {
        const { expires_in, ...rest } = payload;
        const expires_at = Math.floor(Date.now() / 1000) + expires_in;
        data.value = { ...rest, expires_at };
        setAuthStorageData(data.value);
        router.push(AppRoute.HOME);
    }

    function logout() {
        data.value = undefined;
        deleteAuthData();
        router.push(AppRoute.AUTH);
    }

    return {
        data,
        isLoggedIn,
        userId,
        setAuthData,
        login,
        logout,
    };
});
