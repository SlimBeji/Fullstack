import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';

import { getAuthData } from '@/storage';
import { AuthStore } from '@/store';

import { AppRoute } from './routes';

export const guestGuard: CanActivateFn = () => {
    const router = inject(Router);
    const authStore = inject(AuthStore);

    if (!authStore.isLoggedIn()) {
        const authData = getAuthData();
        if (authData !== null) {
            authStore.setAuthData(authData);
        }
    }

    return authStore.isLoggedIn() ? router.createUrlTree([AppRoute.HOME]) : true;
};
