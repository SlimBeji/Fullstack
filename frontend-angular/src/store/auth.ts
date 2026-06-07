import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { deleteAuthData, setAuthData as setAuthStorageData } from '@/storage';
import type { EncodedUserToken, SigninResponse } from '@/types';

interface AuthState {
    data: EncodedUserToken | undefined;
}

const initialState: AuthState = {
    data: undefined,
};

export const AuthStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withComputed(({ data }) => ({
        isLoggedIn: computed(() => !!data()?.user_id),
        userId: computed(() => data()?.user_id),
    })),
    withMethods((store) => {
        const router = inject(Router);

        return {
            setAuthData(payload: EncodedUserToken) {
                patchState(store, { data: payload });
            },
            login(payload: SigninResponse) {
                const { expires_in, ...rest } = payload;
                const expires_at = Math.floor(Date.now() / 1000) + expires_in;
                const data = { ...rest, expires_at };
                setAuthStorageData(data);
                patchState(store, { data });
                router.navigate(['/']);
            },
            logout() {
                deleteAuthData();
                patchState(store, { data: undefined });
                router.navigate(['/auth']);
            },
        };
    })
);
