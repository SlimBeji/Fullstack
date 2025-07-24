import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { EncodedUserToken, LocalStorageKeys } from "../types";

interface AuthState {
    data?: EncodedUserToken;
}

const initialState: AuthState = {};

export const authSlice = createSlice({
    name: "auth",
    initialState: initialState,
    reducers: {
        login: (state: AuthState, action: PayloadAction<EncodedUserToken>) => {
            state.data = action.payload;
            localStorage.setItem(
                LocalStorageKeys.userData,
                JSON.stringify(action.payload)
            );
        },
        logout: (state: AuthState) => {
            state.data = undefined;
            localStorage.removeItem(LocalStorageKeys.userData);
        },
    },
});
