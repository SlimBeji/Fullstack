import { defineStore } from "pinia";
import { computed, ref } from "vue";

import router from "@/router";
import { EncodedUserToken, LocalStorageKeys, SigninResponse } from "@/types";

export const useAuthStore = defineStore("auth", () => {
    const data = ref<EncodedUserToken | undefined>(undefined);

    const isLoggedIn = computed(() => !!data.value?.userId);
    const userId = computed(() => data.value?.userId);

    function setAuthData(payload: EncodedUserToken) {
        data.value = payload;
    }

    function login(payload: SigninResponse) {
        const { expires_in, ...rest } = payload;
        const expiresAt = Math.floor(Date.now() / 1000) + expires_in;
        data.value = { ...rest, expiresAt };

        localStorage.setItem(
            LocalStorageKeys.userData,
            JSON.stringify(data.value)
        );
        router.push("/");
    }

    function logout() {
        data.value = undefined;
        localStorage.removeItem(LocalStorageKeys.userData);
        router.push("/logout");
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
