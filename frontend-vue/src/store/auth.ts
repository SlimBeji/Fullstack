import { defineStore } from "pinia";
import { computed, ref } from "vue";

import router from "@/router";
import type { EncodedUserToken, SigninResponse } from "@/types";
import { LocalStorageKeys } from "@/types";

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

        localStorage.setItem(
            LocalStorageKeys.userData,
            JSON.stringify(data.value)
        );
        router.push("/");
    }

    function logout() {
        data.value = undefined;
        localStorage.removeItem(LocalStorageKeys.userData);
        router.push("/auth");
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
