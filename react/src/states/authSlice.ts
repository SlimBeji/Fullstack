import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { EncodedUserToken } from "../types";

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
        },
        logout: (state: AuthState) => {
            state.data = undefined;
        },
    },
});
