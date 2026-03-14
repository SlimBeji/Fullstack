import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";

import type { EncodedUserToken, SigninResponse } from "@/types";
import { LocalStorageKeys } from "@/types";

interface AuthState {
    data?: EncodedUserToken;
}

const initialState: AuthState = {};

export const authSlice = createSlice({
    name: "auth",
    initialState: initialState,
    reducers: {
        setAuthData: (
            state: AuthState,
            action: PayloadAction<EncodedUserToken>
        ) => {
            state.data = action.payload;
        },
        login: (state: AuthState, action: PayloadAction<SigninResponse>) => {
            const { expires_in, ...rest } = action.payload;
            const expires_at = Math.floor(Date.now() / 1000) + expires_in;
            state.data = { ...rest, expires_at };
            localStorage.setItem(
                LocalStorageKeys.userData,
                JSON.stringify(state.data)
            );
        },
        logout: (state: AuthState) => {
            state.data = undefined;
            localStorage.removeItem(LocalStorageKeys.userData);
        },
    },
});
