import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';

import { getAuthData } from '@/storage';
import { AuthStore } from '@/store';

import { AppRoute } from './routes';

export const authGuard: CanActivateFn = () => {
    const router = inject(Router);
    const authStote = inject(AuthStore);

    if (!authStote.isLoggedIn()) {
        const authData = getAuthData();
        if (authData != null) {
            authStote.setAuthData(authData);
        }
    }

    return authStote.isLoggedIn() ? true : router.createUrlTree([`/${AppRoute.AUTH}`]);
};
