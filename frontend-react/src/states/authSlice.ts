import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { EncodedUserToken, LocalStorageKeys, SigninResponse } from "../types";

interface AuthState {
    data?: EncodedUserToken;
}

const initialState: AuthState = {};

export const authSlice = createSlice({
    name: "auth",
    initialState: initialState,
    reducers: {
        login: (state: AuthState, action: PayloadAction<SigninResponse>) => {
            const { expires_in, ...rest } = action.payload;
            const expiresAt = Math.floor(Date.now() / 1000) + expires_in;
            state.data = { ...rest, expiresAt };
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
